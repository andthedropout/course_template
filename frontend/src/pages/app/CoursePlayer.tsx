import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { fetchCourseStructure, type CourseStructure } from '@/api/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function CoursePlayer() {
  const { slug } = useParams({ from: '/app/courses/$slug' });
  const navigate = useNavigate();
  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStructure = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCourseStructure(slug);
        setStructure(data);

        // If not enrolled, redirect to store page
        if (!data.is_enrolled) {
          navigate({ to: `/store/${slug}` });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    loadStructure();
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

  return (
    <PageWrapper className="space-y-6">
      {/* Course header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{structure.course.title}</h1>
          <p className="text-muted-foreground mt-2">
            {structure.modules.length} modules · {structure.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
          </p>
        </div>
        {firstLesson && (
          <Button asChild>
            <Link to={`/app/courses/${slug}/${firstLesson.slug}`}>
              <Icon name="Play" className="mr-2 h-4 w-4" />
              Start Course
            </Link>
          </Button>
        )}
      </div>

      {/* Course content */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={structure.modules.map(m => String(m.id))} className="w-full">
            {structure.modules.map((module) => (
              <AccordionItem key={module.id} value={String(module.id)}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Icon name="Folder" className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{module.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {module.lessons.length} lessons
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-2">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/app/courses/${slug}/${lesson.slug}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          'hover:bg-muted'
                        )}
                      >
                        <Icon
                          name={lesson.video_url ? 'Video' : 'FileText'}
                          className="h-4 w-4 text-muted-foreground"
                        />
                        <span className="flex-1">{lesson.title}</span>
                        {lesson.is_free_preview && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                        {lesson.duration_minutes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {lesson.duration_minutes}m
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
