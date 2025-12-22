import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { fetchCourseStructure, fetchCourseProgress, type CourseStructure, type CourseProgress } from '@/api/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function CoursePlayer() {
  const { slug } = useParams({ from: '/app/courses_/$slug/' });
  const navigate = useNavigate();
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCourseStructure(slug);

        // If not enrolled, redirect to store page
        if (!data.is_enrolled) {
          console.log('User not enrolled in course, redirecting to store');
          navigate({ to: `/store/${slug}` });
          return;
        }

        setStructure(data);

        // Fetch progress (after confirming enrollment)
        try {
          const progressData = await fetchCourseProgress(slug);
          setProgress(progressData);
        } catch {
          // Progress fetch failed - user might not have started yet
          console.log('No progress data yet');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load course structure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !structure) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon name="AlertCircle" className="h-12 w-12 text-destructive mb-4" />
          <CardTitle className="mb-2">Failed to load course</CardTitle>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button asChild>
            <Link to="/app/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const firstLesson = structure.modules[0]?.lessons[0];
  const totalLessons = structure.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalDuration = structure.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((lSum, l) => lSum + (l.duration_minutes || 0), 0),
    0
  );

  // Progress calculations
  const completedIds = new Set(progress?.completed_lesson_ids || []);
  const progressPercentage = progress?.percentage || 0;
  const nextLessonSlug = progress?.next_lesson_slug || firstLesson?.slug;
  const hasStarted = progressPercentage > 0;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <PageWrapper className="space-y-6 w-full">
      {/* Two-column layout */}
      <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: Image + Long description */}
        <div className="space-y-6">
          {/* Course image */}
          {structure.course.thumbnail_url && (
            <div className="w-full rounded-xl overflow-hidden bg-black flex justify-center">
              <img
                src={structure.course.thumbnail_url}
                alt={structure.course.title}
                className="max-w-full h-auto"
              />
            </div>
          )}

          {/* Course title + stats + Start button */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{structure.course.title}</h1>
              <p className="text-muted-foreground mt-2">
                {structure.modules.length} modules · {totalLessons} lessons
                {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
              </p>
            </div>
            {nextLessonSlug && (
              <Button asChild size="lg" className="shrink-0">
                <Link to={`/app/courses/${slug}/${nextLessonSlug}`}>
                  <Icon name="Play" className="mr-2 h-5 w-5" />
                  {hasStarted ? 'Continue Learning' : 'Start Course'}
                </Link>
              </Button>
            )}
          </div>

          {/* Long description */}
          {structure.course.long_description ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MarkdownRenderer>{structure.course.long_description}</MarkdownRenderer>
            </div>
          ) : structure.course.description ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MarkdownRenderer>{structure.course.description}</MarkdownRenderer>
            </div>
          ) : null}
        </div>

        {/* Right: Stats + Navigation */}
        <div className="space-y-4">
          {/* Stats & CTA Card */}
          <Card className="overflow-hidden">
            <div className="p-4 space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Icon name="BookOpen" className="h-4 w-4 text-muted-foreground" />
                  <span>{totalLessons} lessons</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="Clock" className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {progress && (
                  <p className="text-xs text-muted-foreground">
                    {progress.completed_count} of {progress.total_lessons} lessons completed
                  </p>
                )}
              </div>

              {/* Start/Continue button */}
              {nextLessonSlug && (
                <Button asChild size="lg" className="w-full">
                  <Link to={`/app/courses/${slug}/${nextLessonSlug}`}>
                    <Icon name="Play" className="mr-2 h-5 w-5" />
                    {hasStarted ? 'Continue Learning' : 'Start Course'}
                  </Link>
                </Button>
              )}
            </div>
          </Card>

          {/* Module navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Course Content</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[50vh] overflow-y-auto">
              <Accordion type="multiple" defaultValue={structure.modules.map(m => String(m.id))} className="w-full">
                {structure.modules.map((module) => (
                  <AccordionItem key={module.id} value={String(module.id)}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        <Icon name="Folder" className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{module.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {module.lessons.length} lessons
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pt-1 pb-2">
                        {module.lessons.map((lesson) => {
                          const isCompleted = completedIds.has(lesson.id);
                          return (
                            <Link
                              key={lesson.id}
                              to={`/app/courses/${slug}/${lesson.slug}`}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                'hover:bg-muted',
                                isCompleted && 'text-muted-foreground'
                              )}
                            >
                              {isCompleted ? (
                                <Icon
                                  name="CheckCircle2"
                                  className="h-4 w-4 text-primary shrink-0"
                                />
                              ) : (
                                <Icon
                                  name={lesson.has_video ? 'Video' : 'FileText'}
                                  className="h-4 w-4 text-muted-foreground shrink-0"
                                />
                              )}
                              <span className="flex-1 truncate">{lesson.title}</span>
                              {lesson.is_free_preview && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">
                                  Preview
                                </span>
                              )}
                              {lesson.duration_minutes > 0 && (
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                  {lesson.duration_minutes}m
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
