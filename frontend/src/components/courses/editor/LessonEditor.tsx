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
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">{courseSlug}</span>
            <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}
            <Button onClick={() => handleSave()} disabled={isSaving || !isDirty}>
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
          {/* Left sidebar - Block palette */}
          <div className="w-48 border-r bg-muted/30 p-4 overflow-y-auto">
            <BlockPalette onAddBlock={handleAddBlock} />
          </div>

          {/* Center - Content canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <BlockCanvas blocks={blocks} onChange={setBlocks} />
          </div>

          {/* Right sidebar - Settings */}
          <div className="w-72 border-l bg-muted/30 p-4 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Lesson Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lesson title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="lesson-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="free-preview">Free Preview</Label>
                  <Switch
                    id="free-preview"
                    checked={isFreePreview}
                    onCheckedChange={setIsFreePreview}
                  />
                </div>

                <hr className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Main lesson video (YouTube, Vimeo, or direct URL)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
