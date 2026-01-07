import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { fetchMyEnrollments, fetchCourseProgress, type Enrollment, type CourseProgress } from '@/api/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import PageWrapper from '@/components/layout/PageWrapper';

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const enrollmentData = await fetchMyEnrollments();
        setEnrollments(enrollmentData);

        // Fetch progress for all courses in parallel
        const progressPromises = enrollmentData.map(async (enrollment) => {
          try {
            const progress = await fetchCourseProgress(enrollment.course.slug);
            return { slug: enrollment.course.slug, progress };
          } catch {
            return null;
          }
        });

        const progressResults = await Promise.all(progressPromises);
        const progressData: Record<string, CourseProgress> = {};
        progressResults.forEach((result) => {
          if (result) {
            progressData[result.slug] = result.progress;
          }
        });
        setProgressMap(progressData);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageWrapper className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          Access your enrolled courses.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No enrolled courses</CardTitle>
            <CardDescription className="text-center mb-4">
              You haven't enrolled in any courses yet.
            </CardDescription>
            <Button asChild>
              <Link to="/store">Browse Store</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const progress = progressMap[enrollment.course.slug];
            const percentage = progress?.percentage || 0;
            const hasStarted = percentage > 0;
            const nextLessonSlug = progress?.next_lesson_slug;

            const courseUrl = nextLessonSlug
              ? `/app/courses/${enrollment.course.slug}/${nextLessonSlug}`
              : `/app/courses/${enrollment.course.slug}/`;

            return (
              <Link
                key={enrollment.id}
                to={courseUrl}
                className="group"
              >
                <Card className="overflow-hidden flex flex-col h-full transition-all hover:shadow-lg hover:border-primary/50">
                  {enrollment.course.thumbnail_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={enrollment.course.thumbnail_url}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </CardTitle>
                      {enrollment.course.difficulty && (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 capitalize text-xs ${difficultyColors[enrollment.course.difficulty]}`}
                        >
                          {enrollment.course.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Icon name="Video" className="h-4 w-4" />
                        {enrollment.course.total_lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" className="h-4 w-4" />
                        {Math.round(enrollment.course.total_duration_minutes / 60)}h
                      </span>
                    </CardDescription>
                    {/* Tags */}
                    {enrollment.course.tags && enrollment.course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {enrollment.course.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {enrollment.course.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{enrollment.course.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {percentage === 100 ? (
                            <span className="text-primary flex items-center gap-1">
                              <Icon name="CheckCircle2" className="h-3 w-3" />
                              Completed
                            </span>
                          ) : progress ? (
                            `${progress.completed_count} of ${progress.total_lessons} lessons`
                          ) : (
                            'Not started'
                          )}
                        </span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
                      <Icon name="Play" className="h-4 w-4" />
                      {percentage === 100 ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
