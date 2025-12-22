import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyEnrollments, fetchCourseProgress, type Enrollment, type CourseProgress } from '@/api/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import PageWrapper from '@/components/layout/PageWrapper';

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const data = await fetchMyEnrollments();
        setEnrollments(data);

        // Fetch progress for all courses in parallel
        const progressPromises = data.map(async (enrollment) => {
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
        console.error('Failed to load enrollments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnrollments();
  }, []);

  return (
    <PageWrapper className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.displayName || user?.username || 'Student'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your learning journey.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <Icon name="BookOpen" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Icon name="Video" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.reduce((sum, e) => sum + e.course.total_lessons, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
            <Icon name="Clock" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(enrollments.reduce((sum, e) => sum + e.course.total_duration_minutes, 0) / 60)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue learning section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Continue Learning</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/courses">View All Courses</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No courses yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Start your learning journey by enrolling in a course.
              </CardDescription>
              <Button asChild>
                <Link to="/store">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.slice(0, 3).map((enrollment) => {
              const progress = progressMap[enrollment.course.slug];
              const percentage = progress?.percentage || 0;
              const hasStarted = percentage > 0;
              const nextLessonSlug = progress?.next_lesson_slug;

              return (
                <Link
                  key={enrollment.id}
                  to={nextLessonSlug
                    ? `/app/courses/${enrollment.course.slug}/${nextLessonSlug}`
                    : `/app/courses/${enrollment.course.slug}`
                  }
                  className="block group"
                >
                  <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
                    {enrollment.course.thumbnail_url && (
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={enrollment.course.thumbnail_url}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {/* Progress overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </CardTitle>
                      <CardDescription>
                        {enrollment.course.total_lessons} lessons · {Math.round(enrollment.course.total_duration_minutes / 60)}h
                      </CardDescription>
                      {progress && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {percentage === 100 ? (
                            <span className="text-primary flex items-center gap-1">
                              <Icon name="CheckCircle2" className="h-3 w-3" />
                              Completed
                            </span>
                          ) : (
                            `${percentage}% complete`
                          )}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        {percentage === 100 ? 'Review Course' : hasStarted ? 'Continue Learning' : 'Start Course'}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
