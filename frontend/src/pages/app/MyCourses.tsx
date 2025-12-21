import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { fetchMyEnrollments, fetchCourses, type Enrollment, type Course } from '@/api/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollmentData, coursesData] = await Promise.all([
          fetchMyEnrollments(),
          fetchCourses(),
        ]);
        setEnrollments(enrollmentData);
        setAllCourses(coursesData);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));
  const availableCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          Access your enrolled courses or discover new ones.
        </p>
      </div>

      <Tabs defaultValue="enrolled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enrolled">
            My Courses ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="browse">
            Browse More ({availableCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          {availableCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Icon name="CheckCircle" className="h-12 w-12 text-green-500 mb-4" />
                <CardTitle className="mb-2">You're all caught up!</CardTitle>
                <CardDescription className="text-center">
                  You're enrolled in all available courses.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden flex flex-col">
                  {course.thumbnail_url ? (
                    <div className="aspect-video bg-muted">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="flex-1">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Icon name="Video" className="h-4 w-4" />
                        {course.total_lessons} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" className="h-4 w-4" />
                        {Math.round(course.total_duration_minutes / 60)}h
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/store/${course.slug}`}>
                        View Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
