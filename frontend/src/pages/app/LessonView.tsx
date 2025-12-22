import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
  fetchLesson,
  fetchCourseStructure,
  fetchCourseProgress,
  updateLessonProgress,
  type Lesson,
  type CourseStructure,
  type CourseProgress,
} from '@/api/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import { BlockRenderer } from '@/components/courses/editor/BlockRenderer';
import type { LessonBlock } from '@/components/courses/editor/types';

export default function LessonView() {
  const { slug, lessonSlug } = useParams({ from: '/app/courses_/$slug/$lessonSlug' });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [lessonData, structureData] = await Promise.all([
          fetchLesson(slug, lessonSlug),
          fetchCourseStructure(slug),
        ]);
        setLesson(lessonData);
        setStructure(structureData);

        // Fetch progress
        try {
          const progressData = await fetchCourseProgress(slug);
          setProgress(progressData);
        } catch {
          // No progress yet
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, lessonSlug]);

  // Video ref for tracking
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const hasAutoCompletedRef = useRef(false);

  // Check if current lesson is completed
  const isCurrentLessonCompleted = lesson && progress?.completed_lesson_ids.includes(lesson.id);

  // Get saved video position for current lesson
  const savedVideoPosition = lesson && progress?.lesson_progress?.[lesson.id]?.video_position_seconds || 0;

  // Mark lesson as complete (defined first to avoid circular dependency)
  const handleMarkComplete = useCallback(async () => {
    if (!lesson || isCurrentLessonCompleted) return;

    setIsMarkingComplete(true);
    try {
      await updateLessonProgress(slug, lessonSlug, { completed: true });
      // Update local progress state
      setProgress((prev) => {
        if (!prev) {
          return {
            completed_lesson_ids: [lesson.id],
            total_lessons: 1,
            completed_count: 1,
            percentage: 100,
            next_lesson_slug: null,
            lesson_progress: { [lesson.id]: { completed: true, video_position_seconds: 0 } },
          };
        }
        const newCompletedIds = [...prev.completed_lesson_ids, lesson.id];
        return {
          ...prev,
          completed_lesson_ids: newCompletedIds,
          completed_count: newCompletedIds.length,
          percentage: Math.round((newCompletedIds.length / prev.total_lessons) * 100),
        };
      });
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    } finally {
      setIsMarkingComplete(false);
    }
  }, [lesson, lessonSlug, slug, isCurrentLessonCompleted]);

  // Save video position periodically
  const saveVideoPosition = useCallback(async (position: number) => {
    if (!lesson || Math.abs(position - lastSavedPositionRef.current) < 5) return;
    lastSavedPositionRef.current = position;
    try {
      await updateLessonProgress(slug, lessonSlug, { video_position_seconds: Math.floor(position) });
    } catch (err) {
      console.error('Failed to save video position:', err);
    }
  }, [lesson, slug, lessonSlug]);

  // Auto-complete when video reaches 90%
  const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video.duration) return;
    const percentWatched = (video.currentTime / video.duration) * 100;

    // Auto-complete at 90% (only once per session)
    if (percentWatched >= 90 && !isCurrentLessonCompleted && !hasAutoCompletedRef.current) {
      hasAutoCompletedRef.current = true;
      handleMarkComplete();
    }
  }, [isCurrentLessonCompleted, handleMarkComplete]);

  // Save position on pause
  const handleVideoPause = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    saveVideoPosition(e.currentTarget.currentTime);
  }, [saveVideoPosition]);

  // Reset auto-complete flag when lesson changes
  useEffect(() => {
    hasAutoCompletedRef.current = false;
  }, [lessonSlug]);

  // Set initial video position when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (video && savedVideoPosition > 0) {
      video.currentTime = savedVideoPosition;
    }
  }, [savedVideoPosition, lesson?.id]);

  // Save position when leaving the page
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && video.currentTime > 0) {
        updateLessonProgress(slug, lessonSlug, {
          video_position_seconds: Math.floor(video.currentTime)
        }).catch(() => {});
      }
    };
  }, [slug, lessonSlug]);

  // Find next/prev lessons
  const findAdjacentLessons = () => {
    if (!structure) return { prev: null, next: null };

    const allLessons: { lesson: typeof structure.modules[0]['lessons'][0]; moduleTitle: string }[] = [];
    structure.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        allLessons.push({ lesson: l, moduleTitle: m.title });
      });
    });

    const currentIndex = allLessons.findIndex((l) => l.lesson.slug === lessonSlug);
    return {
      prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
    };
  };

  const { prev, next } = findAdjacentLessons();

  // Set of completed lesson IDs for sidebar
  const completedIds = new Set(progress?.completed_lesson_ids || []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon name="AlertCircle" className="h-12 w-12 text-destructive mb-4" />
          <CardTitle className="mb-2">Failed to load lesson</CardTitle>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button asChild>
            <Link to={`/app/courses/${slug}/`}>Back to Course</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageWrapper className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Main content */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/app/courses/${slug}/`} className="hover:text-foreground">
            {structure?.course.title}
          </Link>
          <Icon name="ChevronRight" className="h-4 w-4" />
          <span>{lesson.title}</span>
        </div>

        {/* Video player */}
        {lesson.video_url && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be') ? (
              <iframe
                src={lesson.video_url.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : lesson.video_url.includes('vimeo.com') ? (
              <iframe
                src={lesson.video_url.replace('vimeo.com', 'player.vimeo.com/video')}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={lesson.video_url}
                controls
                className="w-full h-full"
                onTimeUpdate={handleVideoTimeUpdate}
                onPause={handleVideoPause}
                onEnded={handleVideoPause}
              />
            )}
          </div>
        )}

        {/* Lesson content */}
        <Card>
          <CardHeader>
            <CardTitle>{lesson.title}</CardTitle>
            {lesson.duration_minutes > 0 && (
              <p className="text-sm text-muted-foreground">
                <Icon name="Clock" className="inline h-4 w-4 mr-1" />
                {lesson.duration_minutes} minutes
              </p>
            )}
          </CardHeader>
          {/* Render blocks if available, fall back to legacy content */}
          {lesson.blocks && lesson.blocks.length > 0 ? (
            <CardContent className="space-y-6">
              {[...lesson.blocks]
                .sort((a, b) => a.order - b.order)
                .map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block as LessonBlock}
                    onChange={() => {}}
                    isEditing={false}
                  />
                ))}
            </CardContent>
          ) : lesson.content ? (
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </CardContent>
          ) : null}
        </Card>

        {/* Mark Complete Button */}
        <div className="flex items-center justify-center py-4 border-t">
          {isCurrentLessonCompleted ? (
            <div className="flex items-center gap-2 text-primary">
              <Icon name="CheckCircle2" className="h-5 w-5" />
              <span className="font-medium">Lesson Completed</span>
            </div>
          ) : (
            <Button
              onClick={handleMarkComplete}
              disabled={isMarkingComplete}
              size="lg"
              className="min-w-[200px]"
            >
              {isMarkingComplete ? (
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
              )}
              Mark as Complete
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {prev ? (
            <Button asChild variant="outline">
              <Link to={`/app/courses/${slug}/${prev.lesson.slug}`}>
                <Icon name="ChevronLeft" className="mr-2 h-4 w-4" />
                {prev.lesson.title}
              </Link>
            </Button>
          ) : (
            <div />
          )}
          {next ? (
            <Button asChild>
              <Link to={`/app/courses/${slug}/${next.lesson.slug}`}>
                {next.lesson.title}
                <Icon name="ChevronRight" className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to={`/app/courses/${slug}/`}>
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                Finish Course
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar - Course outline */}
      <div className="hidden lg:block">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="text-base">Course Content</CardTitle>
            {progress && (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress.completed_count} of {progress.total_lessons} lessons</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            {structure?.modules.map((module) => (
              <div key={module.id} className="mb-4">
                <h4 className="font-medium text-sm mb-2">{module.title}</h4>
                <div className="space-y-1">
                  {module.lessons.map((l) => {
                    const isCompleted = completedIds.has(l.id);
                    const isCurrent = l.slug === lessonSlug;
                    return (
                      <Link
                        key={l.id}
                        to={`/app/courses/${slug}/${l.slug}`}
                        className={cn(
                          'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                          !isCurrent && isCompleted && 'text-muted-foreground'
                        )}
                      >
                        {isCompleted && !isCurrent ? (
                          <Icon name="CheckCircle2" className="h-3 w-3 text-primary shrink-0" />
                        ) : (
                          <Icon
                            name={l.has_video ? 'Video' : 'FileText'}
                            className="h-3 w-3 shrink-0"
                          />
                        )}
                        <span className="line-clamp-1">{l.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
