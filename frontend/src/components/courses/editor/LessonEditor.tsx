import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { LessonBlock, BlockType, createBlock, Lesson } from './types';
import { BlockPalette } from './BlockPalette';
import { BlockCanvas } from './BlockCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LessonEditorProps {
  lesson: Lesson;
  courseSlug: string;
  onSave: (lesson: Partial<Lesson>) => Promise<void>;
  onBack: () => void;
}

export function LessonEditor({
  lesson,
  courseSlug,
  onSave,
  onBack,
}: LessonEditorProps) {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<LessonBlock[]>(lesson.blocks || []);
  const [title, setTitle] = useState(lesson.title);
  const [slug, setSlug] = useState(lesson.slug);
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
  const [durationMinutes, setDurationMinutes] = useState(lesson.duration_minutes);
  const [isFreePreview, setIsFreePreview] = useState(lesson.is_free_preview);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(blocks) !== JSON.stringify(lesson.blocks) ||
      title !== lesson.title ||
      slug !== lesson.slug ||
      videoUrl !== (lesson.video_url || '') ||
      durationMinutes !== lesson.duration_minutes ||
      isFreePreview !== lesson.is_free_preview;
    setIsDirty(hasChanges);
  }, [blocks, title, slug, videoUrl, durationMinutes, isFreePreview, lesson]);

  // Auto-save (every 30 seconds if dirty)
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [isDirty, blocks, title, slug, videoUrl, durationMinutes, isFreePreview]);

  const handleSave = async (isAutoSave = false) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      await onSave({
        title,
        slug,
        blocks,
        video_url: videoUrl,
        duration_minutes: durationMinutes,
        is_free_preview: isFreePreview,
      });
      setIsDirty(false);
      if (!isAutoSave) {
        toast({
          title: 'Saved',
          description: 'Lesson saved successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save lesson.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks((prev) => [...prev, { ...newBlock, order: prev.length }]);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handle drag from palette to canvas
    const activeData = active.data.current;
    if (activeData?.fromPalette && over?.id === 'canvas') {
      const newBlock = createBlock(activeData.type as BlockType);
      setBlocks((prev) => [...prev, { ...newBlock, order: prev.length }]);
    }
  };

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, title, slug, videoUrl, durationMinutes, isFreePreview]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-muted/30">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <Icon name="ArrowLeft" className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <nav className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground truncate max-w-[120px]">{courseSlug}</span>
              <Icon name="ChevronRight" className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-semibold truncate max-w-[200px]">{title}</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Unsaved</span>
              </div>
            )}
            <Button
              onClick={() => handleSave()}
              disabled={isSaving || !isDirty}
              size="sm"
              className="gap-1.5"
            >
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
          {/* Left sidebar - Block palette */}
          <aside className="w-56 border-r bg-muted/20 flex flex-col">
            <div className="p-4 border-b bg-background/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Content Blocks
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <BlockPalette onAddBlock={handleAddBlock} />
            </div>
          </aside>

          {/* Center - Content canvas */}
          <main className="flex-1 overflow-y-auto bg-muted/10">
            <div className="max-w-3xl mx-auto p-8">
              <BlockCanvas blocks={blocks} onChange={setBlocks} />
            </div>
          </main>

          {/* Right sidebar - Settings */}
          <aside className="w-80 border-l bg-muted/20 flex flex-col">
            <div className="p-4 border-b bg-background/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lesson Settings
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
                    placeholder="Lesson title"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-xs font-medium">URL Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="lesson-slug"
                    className="h-9 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Lesson Options */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Options
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-xs font-medium">Duration</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="duration"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      min={0}
                      className="h-9 w-20"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="free-preview" className="text-sm font-medium cursor-pointer">
                      Free Preview
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow non-enrolled users to view
                    </p>
                  </div>
                  <Switch
                    id="free-preview"
                    checked={isFreePreview}
                    onCheckedChange={setIsFreePreview}
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Media */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Media
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="video-url" className="text-xs font-medium">Video URL</Label>
                  <Input
                    id="video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube, Vimeo, or direct video URL
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DndContext>
  );
}
