import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  fetchAllCourses,
  createCourse,
  CourseFull,
} from '@/api/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CourseDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create course modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);


  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setIsLoading(true);
      const data = await fetchAllCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;

    try {
      setIsCreating(true);
      const course = await createCourse({
        title: newTitle,
        saleor_product_id: `temp-${Date.now()}`, // Temporary, user should update
      });
      toast({ title: 'Course created', description: `"${course.title}" has been created.` });
      setIsCreateOpen(false);
      setNewTitle('');
      navigate({ to: '/courses/$slug/', params: { slug: course.slug } });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon name="AlertCircle" className="h-12 w-12 text-destructive mb-4" />
          <CardTitle className="mb-2">Error</CardTitle>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={loadCourses}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your courses
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Enter a title for your new course. You can add modules and lessons after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Introduction to Python"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim() || isCreating}>
                {isCreating ? (
                  <>
                    <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Course'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Icon name="BookOpen" className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first course to get started. You can add modules, lessons, and rich content.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              Create First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-md transition-shadow overflow-hidden">
              {course.thumbnail_url ? (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {course.description || 'No description'}
                    </CardDescription>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium ml-2 shrink-0',
                      course.status === 'published'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    )}
                  >
                    {course.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Icon name="Layers" className="h-4 w-4" />
                    {course.modules?.length || 0} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="FileText" className="h-4 w-4" />
                    {course.total_lessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Clock" className="h-4 w-4" />
                    {course.total_duration_minutes}m
                  </span>
                </div>
                <Button asChild className="w-full">
                  <Link to="/courses/$slug/" params={{ slug: course.slug }}>
                    <Icon name="Pencil" className="h-4 w-4 mr-2" />
                    Edit Course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
