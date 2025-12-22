import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { fetchMyEnrollments, fetchCourseProgress, type Enrollment, type CourseProgress } from '@/api/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import PageWrapper from '@/components/layout/PageWrapper';

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

            return (
              <Card key={enrollment.id} className="overflow-hidden flex flex-col">
                {enrollment.course.thumbnail_url ? (
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Progress overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground" />
                    {/* Progress overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
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
                  {/* Progress text */}
                  {progress && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {percentage === 100 ? (
                        <span className="text-primary flex items-center gap-1">
                          <Icon name="CheckCircle2" className="h-3 w-3" />
                          Completed
                        </span>
                      ) : (
                        `${progress.completed_count} of ${progress.total_lessons} lessons completed (${percentage}%)`
                      )}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link
                      to={nextLessonSlug
                        ? `/app/courses/${enrollment.course.slug}/${nextLessonSlug}`
                        : `/app/courses/${enrollment.course.slug}/`
                      }
                    >
                      <Icon name="Play" className="mr-2 h-4 w-4" />
                      {percentage === 100 ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
