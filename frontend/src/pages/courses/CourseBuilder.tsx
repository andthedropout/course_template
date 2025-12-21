import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  fetchCourseForEdit,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  deleteLesson,
  reorderModules,
  reorderLessons,
  CourseFull,
  Module,
} from '@/api/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
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
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CourseBuilder() {
  const { slug } = useParams({ from: '/courses/$slug/' });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Course settings form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saleorProductId, setSaleorProductId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Module/Lesson modals
  const [newModuleOpen, setNewModuleOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonOpen, setNewLessonOpen] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  // Delete confirmation (modules/lessons)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'module' | 'lesson';
    moduleId: number;
    lessonSlug?: string;
    title: string;
  } | null>(null);

  // Course deletion
  const [showDeleteCourse, setShowDeleteCourse] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCourse();
  }, [slug]);

  async function loadCourse() {
    try {
      setIsLoading(true);
      const data = await fetchCourseForEdit(slug);
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setThumbnailUrl(data.thumbnail_url || '');
      setSaleorProductId(data.saleor_product_id || '');
      setStatus(data.status);
      // Expand all modules by default
      setExpandedModules(new Set(data.modules?.map((m) => m.id) || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      setIsSaving(true);
      const updated = await updateCourse(slug, {
        title,
        description,
        thumbnail_url: thumbnailUrl,
        saleor_product_id: saleorProductId,
        status,
      });
      setCourse(updated);
      toast({ title: 'Saved', description: 'Course settings saved.' });
      // If slug changed, redirect
      if (updated.slug !== slug) {
        navigate({ to: '/courses/$slug/', params: { slug: updated.slug } });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateModule() {
    if (!newModuleTitle.trim()) return;

    try {
      const module = await createModule(slug, { title: newModuleTitle });
      setCourse((prev) =>
        prev
          ? { ...prev, modules: [...(prev.modules || []), { ...module, lessons: [] }] }
          : prev
      );
      setExpandedModules((prev) => new Set([...prev, module.id]));
      setNewModuleOpen(false);
      setNewModuleTitle('');
      toast({ title: 'Module created' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create module',
        variant: 'destructive',
      });
    }
  }

  async function handleCreateLesson(moduleId: number) {
    if (!newLessonTitle.trim()) return;

    try {
      const lesson = await createLesson(slug, moduleId, { title: newLessonTitle });
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          modules: prev.modules?.map((m) =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m
          ),
        };
      });
      setNewLessonOpen(null);
      setNewLessonTitle('');
      // Navigate to lesson editor
      navigate({
        to: '/courses/$slug/$lessonSlug',
        params: { slug, lessonSlug: lesson.slug },
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'module') {
        await deleteModule(slug, deleteTarget.moduleId);
        setCourse((prev) =>
          prev
            ? { ...prev, modules: prev.modules?.filter((m) => m.id !== deleteTarget.moduleId) }
            : prev
        );
      } else if (deleteTarget.lessonSlug) {
        await deleteLesson(slug, deleteTarget.lessonSlug);
        setCourse((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            modules: prev.modules?.map((m) =>
              m.id === deleteTarget.moduleId
                ? { ...m, lessons: m.lessons.filter((l) => l.slug !== deleteTarget.lessonSlug) }
                : m
            ),
          };
        });
      }
      toast({ title: 'Deleted' });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteCourse() {
    try {
      setIsDeletingCourse(true);
      await deleteCourse(slug);
      toast({ title: 'Course deleted', description: `"${course?.title}" has been deleted.` });
      navigate({ to: '/courses/dashboard' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete course',
        variant: 'destructive',
      });
      setIsDeletingCourse(false);
      setShowDeleteCourse(false);
    }
  }

  function toggleModule(moduleId: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="AlertCircle" className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="mb-2">Error</CardTitle>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button asChild>
              <Link to="/courses/dashboard">Back to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/courses/dashboard">
              <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
              Courses
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="font-medium">{course.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to={`/app/courses/${slug}`} target="_blank">
              <Icon name="Eye" className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="Save" className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Course structure */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Course Structure</h2>
              <Button size="sm" onClick={() => setNewModuleOpen(true)}>
                <Icon name="Plus" className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            {!course.modules?.length ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Icon name="Layers" className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No modules yet</p>
                  <Button onClick={() => setNewModuleOpen(true)}>
                    <Icon name="Plus" className="h-4 w-4 mr-2" />
                    Add First Module
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {course.modules.map((module, moduleIndex) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    courseSlug={slug}
                    isExpanded={expandedModules.has(module.id)}
                    onToggle={() => toggleModule(module.id)}
                    onAddLesson={() => setNewLessonOpen(module.id)}
                    onDeleteModule={() =>
                      setDeleteTarget({
                        type: 'module',
                        moduleId: module.id,
                        title: module.title,
                      })
                    }
                    onDeleteLesson={(lessonSlug, lessonTitle) =>
                      setDeleteTarget({
                        type: 'lesson',
                        moduleId: module.id,
                        lessonSlug,
                        title: lessonTitle,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Course settings */}
        <div className="w-80 border-l bg-muted/30 p-6 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Course Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleor-id">Saleor Product ID</Label>
                <Input
                  id="saleor-id"
                  value={saleorProductId}
                  onChange={(e) => setSaleorProductId(e.target.value)}
                  placeholder="UHJvZHVjdDox"
                />
                <p className="text-xs text-muted-foreground">
                  Links this course to a Saleor product for purchases
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={status === 'published'}
                  onCheckedChange={(checked: boolean) =>
                    setStatus(checked ? 'published' : 'draft')
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-background p-3 rounded-lg border">
                <p className="text-muted-foreground">Modules</p>
                <p className="text-2xl font-bold">{course.modules?.length || 0}</p>
              </div>
              <div className="bg-background p-3 rounded-lg border">
                <p className="text-muted-foreground">Lessons</p>
                <p className="text-2xl font-bold">{course.total_lessons}</p>
              </div>
              <div className="bg-background p-3 rounded-lg border col-span-2">
                <p className="text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{course.total_duration_minutes} min</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-destructive/20">
            <h3 className="text-sm font-medium text-destructive mb-3">Danger Zone</h3>
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Delete this course</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete this course and all its content
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteCourse(true)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Course Confirmation */}
      <AlertDialog open={showDeleteCourse} onOpenChange={setShowDeleteCourse}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{course.title}"? This will permanently delete
              all modules, lessons, and content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCourse}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingCourse}
            >
              {isDeletingCourse ? 'Deleting...' : 'Delete Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Module Modal */}
      <Dialog open={newModuleOpen} onOpenChange={setNewModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Module</DialogTitle>
            <DialogDescription>
              Modules help organize your lessons into sections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Module Title</Label>
              <Input
                id="module-title"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Getting Started"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModule} disabled={!newModuleTitle.trim()}>
              Add Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Modal */}
      <Dialog open={newLessonOpen !== null} onOpenChange={() => setNewLessonOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
            <DialogDescription>
              Add a new lesson to this module.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="Introduction"
                onKeyDown={(e) =>
                  e.key === 'Enter' && newLessonOpen && handleCreateLesson(newLessonOpen)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLessonOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => newLessonOpen && handleCreateLesson(newLessonOpen)}
              disabled={!newLessonTitle.trim()}
            >
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'module' ? 'Module' : 'Lesson'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"?
              {deleteTarget?.type === 'module' &&
                ' This will also delete all lessons in this module.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  courseSlug: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAddLesson: () => void;
  onDeleteModule: () => void;
  onDeleteLesson: (lessonSlug: string, lessonTitle: string) => void;
}

function ModuleCard({
  module,
  courseSlug,
  isExpanded,
  onToggle,
  onAddLesson,
  onDeleteModule,
  onDeleteLesson,
}: ModuleCardProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center gap-3">
              <Icon
                name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                className="h-4 w-4 text-muted-foreground"
              />
              <div className="flex-1">
                <CardTitle className="text-base">{module.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {module.lessons.length} lesson{module.lessons.length !== 1 && 's'}
                </p>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onAddLesson}>
                  <Icon name="Plus" className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteModule}
                  className="text-destructive hover:text-destructive"
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lessons yet.{' '}
                <button onClick={onAddLesson} className="text-primary hover:underline">
                  Add one
                </button>
              </p>
            ) : (
              <div className="space-y-1">
                {module.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to="/courses/$slug/$lessonSlug"
                    params={{ slug: courseSlug, lessonSlug: lesson.slug }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted group cursor-pointer"
                  >
                    <Icon
                      name={lesson.has_video ? 'Video' : 'FileText'}
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <span className="flex-1 text-sm hover:text-primary">
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lesson.is_free_preview && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Free
                        </span>
                      )}
                      {lesson.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {lesson.duration_minutes}m
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteLesson(lesson.slug, lesson.title);
                        }}
                      >
                        <Icon name="X" className="h-3 w-3" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
