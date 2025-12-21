import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { fetchMyEnrollments, type Enrollment } from '@/api/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import PageWrapper from '@/components/layout/PageWrapper';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const enrollmentData = await fetchMyEnrollments();
        setEnrollments(enrollmentData);
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
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="overflow-hidden flex flex-col">
              {enrollment.course.thumbnail_url ? (
                <div className="aspect-video bg-muted">
                  <img
                    src={enrollment.course.thumbnail_url}
                    alt={enrollment.course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground" />
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
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={`/app/courses/${enrollment.course.slug}`}>
                    <Icon name="Play" className="mr-2 h-4 w-4" />
                    Continue
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
