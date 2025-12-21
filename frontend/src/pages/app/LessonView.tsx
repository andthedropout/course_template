import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { fetchLesson, fetchCourseStructure, type Lesson, type CourseStructure } from '@/api/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export default function LessonView() {
  const { slug, lessonSlug } = useParams({ from: '/app/courses/$slug/$lessonSlug' });
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
            <Link to={`/app/courses/${slug}`}>Back to Course</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      {/* Main content */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/app/courses/${slug}`} className="hover:text-foreground">
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
              <video src={lesson.video_url} controls className="w-full h-full" />
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
          {lesson.content && (
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </CardContent>
          )}
        </Card>

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
              <Link to={`/app/courses/${slug}`}>
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                Complete Course
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
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            {structure?.modules.map((module) => (
              <div key={module.id} className="mb-4">
                <h4 className="font-medium text-sm mb-2">{module.title}</h4>
                <div className="space-y-1">
                  {module.lessons.map((l) => (
                    <Link
                      key={l.id}
                      to={`/app/courses/${slug}/${l.slug}`}
                      className={cn(
                        'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
                        l.slug === lessonSlug
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon
                        name={l.video_url ? 'Video' : 'FileText'}
                        className="h-3 w-3"
                      />
                      <span className="line-clamp-1">{l.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
