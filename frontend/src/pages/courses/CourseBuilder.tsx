import { useState, useEffect, useRef } from 'react';
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
  fetchTags,
  fetchAllCourses,
  addPrerequisite,
  removePrerequisite,
  CourseFull,
  Module,
  Tag,
  CoursePrerequisite,
} from '@/api/courses';
import { uploadBlogImage } from '@/api/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [longDescription, setLongDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saleorProductId, setSaleorProductId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // New metadata fields
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);

  // Available options for tags and prerequisites
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [allCourses, setAllCourses] = useState<CourseFull[]>([]);

  // Thumbnail upload
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
    loadTagsAndCourses();
  }, [slug]);

  async function loadTagsAndCourses() {
    try {
      const [tags, courses] = await Promise.all([
        fetchTags(),
        fetchAllCourses(),
      ]);
      setAvailableTags(tags);
      setAllCourses(courses);
    } catch (err) {
      console.error('Failed to load tags/courses:', err);
    }
  }

  async function loadCourse() {
    try {
      setIsLoading(true);
      const data = await fetchCourseForEdit(slug);
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setLongDescription(data.long_description || '');
      setThumbnailUrl(data.thumbnail_url || '');
      setSaleorProductId(data.saleor_product_id || '');
      setStatus(data.status);
      // New metadata fields
      setDifficulty(data.difficulty || null);
      setLearningObjectives(data.learning_objectives || []);
      setSelectedTagIds(data.tags?.map(t => t.id) || []);
      setPrerequisites(data.prerequisites || []);
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
        long_description: longDescription,
        thumbnail_url: thumbnailUrl,
        saleor_product_id: saleorProductId,
        status,
        difficulty,
        learning_objectives: learningObjectives.filter(o => o.trim()),
        tag_ids: selectedTagIds,
      });
      // Preserve modules since the PATCH endpoint may not return them
      setCourse((prev) => prev ? { ...prev, ...updated, modules: prev.modules } : updated);
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

  // Prerequisite management
  async function handleAddPrerequisite(requiredCourseId: number, enforcement: 'recommended' | 'required') {
    try {
      const prereq = await addPrerequisite(slug, { required_course_id: requiredCourseId, enforcement });
      setPrerequisites(prev => [...prev, prereq]);
      toast({ title: 'Prerequisite added' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add prerequisite',
        variant: 'destructive',
      });
    }
  }

  async function handleRemovePrerequisite(prerequisiteId: number) {
    try {
      await removePrerequisite(slug, prerequisiteId);
      setPrerequisites(prev => prev.filter(p => p.id !== prerequisiteId));
      toast({ title: 'Prerequisite removed' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove prerequisite',
        variant: 'destructive',
      });
    }
  }

  // Learning objectives helpers
  function addObjective() {
    setLearningObjectives(prev => [...prev, '']);
  }

  function updateObjective(index: number, value: string) {
    setLearningObjectives(prev => prev.map((o, i) => i === index ? value : o));
  }

  function removeObjective(index: number) {
    setLearningObjectives(prev => prev.filter((_, i) => i !== index));
  }

  // Tag helpers
  function toggleTag(tagId: number) {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
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
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link to="/courses/dashboard">
              <Icon name="ArrowLeft" className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate max-w-[200px]">{course.title}</span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                status === 'published'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
              )}
            >
              {status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link to={`/app/courses/${slug}/`} target="_blank">
              <Icon name="Eye" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving} size="sm" className="gap-1.5">
            {isSaving ? (
              <>
                <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="Check" className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Course structure */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Course Structure</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Organize your course into modules and lessons
                </p>
              </div>
              <Button onClick={() => setNewModuleOpen(true)} className="gap-1.5">
                <Icon name="Plus" className="h-4 w-4" />
                Add Module
              </Button>
            </div>

            {!course.modules?.length ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Layers" className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Modules help organize your lessons into sections. Start by adding your first module.
                </p>
                <Button onClick={() => setNewModuleOpen(true)} className="gap-1.5">
                  <Icon name="Plus" className="h-4 w-4" />
                  Add First Module
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
        </main>

        {/* Right - Course settings */}
        <aside className="w-80 border-l bg-muted/20 flex flex-col">
          <div className="p-4 border-b bg-background/50">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Course Settings
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-medium">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium">Short Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-lg bg-background resize-none"
                  placeholder="Brief description for course cards"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long-description" className="text-xs font-medium">Long Description</Label>
                <textarea
                  id="long-description"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  className="w-full min-h-[160px] px-3 py-2 text-sm border rounded-lg bg-background resize-y font-mono"
                  placeholder="Detailed course overview - explain modules, structure, prerequisites... (Markdown supported)"
                />
                <p className="text-xs text-muted-foreground">
                  Supports Markdown formatting
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Thumbnail</Label>
                {thumbnailUrl ? (
                  <div className="relative group">
                    <img
                      src={thumbnailUrl}
                      alt="Course thumbnail"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        <Icon name="Upload" className="h-4 w-4 mr-1" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setThumbnailUrl('')}
                      >
                        <Icon name="Trash2" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                      isDraggingThumbnail
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary",
                      isUploadingThumbnail && "opacity-50 pointer-events-none"
                    )}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDraggingThumbnail(false);
                      const file = e.dataTransfer.files[0];
                      if (!file?.type.startsWith('image/')) return;
                      setIsUploadingThumbnail(true);
                      try {
                        const result = await uploadBlogImage(file);
                        setThumbnailUrl(result.url);
                        toast({ title: 'Uploaded', description: 'Thumbnail uploaded' });
                      } catch {
                        toast({ title: 'Error', description: 'Failed to upload', variant: 'destructive' });
                      } finally {
                        setIsUploadingThumbnail(false);
                      }
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingThumbnail(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingThumbnail(false); }}
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    {isUploadingThumbnail ? (
                      <Icon name="Loader2" className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <Icon name="Upload" className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Drop image or click to upload
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploadingThumbnail(true);
                    try {
                      const result = await uploadBlogImage(file);
                      setThumbnailUrl(result.url);
                      toast({ title: 'Uploaded', description: 'Thumbnail uploaded' });
                    } catch {
                      toast({ title: 'Error', description: 'Failed to upload', variant: 'destructive' });
                    } finally {
                      setIsUploadingThumbnail(false);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Course Details
              </h3>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Difficulty Level</Label>
                <Select
                  value={difficulty || 'none'}
                  onValueChange={(value) => setDifficulty(value === 'none' ? null : value as 'beginner' | 'intermediate' | 'advanced')}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select difficulty (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Learning Objectives */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Learning Objectives</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  What will students learn?
                </p>
                <div className="space-y-2">
                  {learningObjectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder={`Objective ${index + 1}`}
                        className="h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => removeObjective(index)}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addObjective}
                    className="w-full"
                  >
                    <Icon name="Plus" className="h-4 w-4 mr-1" />
                    Add Objective
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {selectedTagIds.includes(tag.id) && (
                        <Icon name="Check" className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                  {availableTags.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tags available</p>
                  )}
                </div>
              </div>

              {/* Prerequisites */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Prerequisites</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Courses to complete first
                </p>
                {prerequisites.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {prerequisites.map((prereq) => (
                      <div
                        key={prereq.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon name="BookOpen" className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{prereq.required_course_title}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {prereq.enforcement}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleRemovePrerequisite(prereq.id)}
                        >
                          <Icon name="X" className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Select
                  value=""
                  onValueChange={(value) => {
                    const courseId = parseInt(value);
                    if (!isNaN(courseId)) {
                      handleAddPrerequisite(courseId, 'recommended');
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Add prerequisite..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCourses
                      .filter(c => c.slug !== slug && !prerequisites.some(p => p.required_course_id === c.id))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.title}
                        </SelectItem>
                      ))}
                    {allCourses.filter(c => c.slug !== slug && !prerequisites.some(p => p.required_course_id === c.id)).length === 0 && (
                      <SelectItem value="none" disabled>No other courses available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Publishing */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Publishing
              </h3>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="published" className="text-sm font-medium cursor-pointer">
                    Published
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Make course visible to students
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={status === 'published'}
                  onCheckedChange={(checked: boolean) =>
                    setStatus(checked ? 'published' : 'draft')
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleor-id" className="text-xs font-medium">Saleor Product ID</Label>
                <Input
                  id="saleor-id"
                  value={saleorProductId}
                  onChange={(e) => setSaleorProductId(e.target.value)}
                  placeholder="UHJvZHVjdDox"
                  className="h-9 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Link to Saleor product for purchases
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stats
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold">{course.modules?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </div>
                <div className="bg-background p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold">{course.total_lessons}</p>
                  <p className="text-xs text-muted-foreground">Lessons</p>
                </div>
                <div className="bg-background p-3 rounded-lg border text-center">
                  <p className="text-2xl font-bold">{course.total_duration_minutes}</p>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Danger Zone */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Danger Zone
              </h3>
              <button
                onClick={() => setShowDeleteCourse(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-destructive/30 hover:bg-destructive/5 transition-colors group"
              >
                <div className="text-left">
                  <p className="text-sm font-medium">Delete Course</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove this course
                  </p>
                </div>
                <Icon name="Trash2" className="h-4 w-4 text-destructive opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </aside>
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
      <div
        className={cn(
          'bg-background rounded-xl border shadow-sm transition-all duration-200',
          isExpanded ? 'shadow-md' : 'hover:shadow-md hover:border-primary/30'
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                isExpanded ? 'bg-primary/10' : 'bg-muted/50'
              )}
            >
              <Icon
                name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                className={cn(
                  'h-4 w-4 transition-colors',
                  isExpanded ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{module.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {module.lessons.length} lesson{module.lessons.length !== 1 && 's'}
              </p>
            </div>
            <div
              className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddLesson}
                className="h-8 w-8 p-0"
              >
                <Icon name="Plus" className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteModule}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Icon name="Trash2" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {module.lessons.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg py-6 text-center">
                <Icon name="FileText" className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No lessons yet.{' '}
                  <button onClick={onAddLesson} className="text-primary hover:underline font-medium">
                    Add one
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {module.lessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    to="/courses/$slug/$lessonSlug"
                    params={{ slug: courseSlug, lessonSlug: lesson.slug }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 group cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-muted-foreground/60 w-5 text-center font-mono">
                      {index + 1}
                    </span>
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-md',
                        lesson.has_video ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted/50'
                      )}
                    >
                      <Icon
                        name={lesson.has_video ? 'Video' : 'FileText'}
                        className={cn(
                          'h-3.5 w-3.5',
                          lesson.has_video ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {lesson.is_free_preview && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                          Free
                        </span>
                      )}
                      {lesson.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {lesson.duration_minutes}m
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
