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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Course Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create and manage your courses
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Icon name="Plus" className="h-4 w-4" />
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
      </header>

      {/* Course Grid */}
      <div className="container mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl py-20 text-center bg-background">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Icon name="BookOpen" className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Create your first course to get started. You can add modules, lessons, and rich content.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
              <Icon name="Plus" className="h-4 w-4" />
              Create First Course
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to="/courses/$slug/"
                params={{ slug: course.slug }}
                className="group"
              >
                <div className="bg-background rounded-xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
                  {course.thumbnail_url ? (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Icon name="BookOpen" className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                        )}
                      >
                        {course.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                      {course.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1.5">
                        <Icon name="Layers" className="h-3.5 w-3.5" />
                        {course.modules?.length || 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="FileText" className="h-3.5 w-3.5" />
                        {course.total_lessons}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="Clock" className="h-3.5 w-3.5" />
                        {course.total_duration_minutes}m
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit
                        <Icon name="ArrowRight" className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
