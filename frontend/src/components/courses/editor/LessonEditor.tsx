import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { LessonBlock, BlockType, createBlock, Lesson } from './types';
import { BlockPalette } from './BlockPalette';
import { BlockCanvas } from './BlockCanvas';
import { VideoLibrary } from './VideoLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BlurhashImage } from '@/components/ui/blurhash-image';
import { useToast } from '@/hooks/use-toast';
import { useBunnyUpload } from '@/hooks/useBunnyUpload';
import { BunnyVideo } from '@/api/courses';

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
  const [bunnyVideo, setBunnyVideo] = useState<BunnyVideo | null>(lesson.bunny_video || null);
  const [durationMinutes, setDurationMinutes] = useState(lesson.duration_minutes);
  const [isFreePreview, setIsFreePreview] = useState(lesson.is_free_preview);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [videoTab, setVideoTab] = useState<string>(bunnyVideo ? 'bunny' : 'external');

  const {
    uploadState,
    progress: uploadProgress,
    error: uploadError,
    video: uploadedVideo,
    upload,
    cancel: cancelUpload,
    reset: resetUpload,
  } = useBunnyUpload();

  // Track changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(blocks) !== JSON.stringify(lesson.blocks) ||
      title !== lesson.title ||
      slug !== lesson.slug ||
      videoUrl !== (lesson.video_url || '') ||
      bunnyVideo?.id !== lesson.bunny_video?.id ||
      durationMinutes !== lesson.duration_minutes ||
      isFreePreview !== lesson.is_free_preview;
    setIsDirty(hasChanges);
  }, [blocks, title, slug, videoUrl, bunnyVideo, durationMinutes, isFreePreview, lesson]);

  // Handle upload completion
  useEffect(() => {
    if (uploadedVideo && uploadState === 'ready') {
      setBunnyVideo(uploadedVideo);
      setVideoUrl(''); // Clear external URL when using Bunny
      setVideoTab('bunny');
      resetUpload();
      toast({
        title: 'Upload complete',
        description: 'Video is ready to use',
      });
    }
  }, [uploadedVideo, uploadState, resetUpload, toast]);

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
        video_url: bunnyVideo ? '' : videoUrl, // Clear URL when using Bunny
        bunny_video_id: bunnyVideo?.id || null,
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

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    await upload(file, title || file.name);
    e.target.value = '';
  };

  const handleSelectVideoFromLibrary = (video: BunnyVideo) => {
    setBunnyVideo(video);
    setVideoUrl('');
    setShowVideoLibrary(false);
  };

  const handleRemoveBunnyVideo = () => {
    setBunnyVideo(null);
  };

  const isUploading = ['initializing', 'uploading', 'confirming', 'processing'].includes(uploadState);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                  Video
                </h3>

                <Tabs value={videoTab} onValueChange={setVideoTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="bunny" className="text-xs">
                      <Icon name="Upload" className="h-3.5 w-3.5 mr-1.5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="external" className="text-xs">
                      <Icon name="Link" className="h-3.5 w-3.5 mr-1.5" />
                      External
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bunny" className="mt-3 space-y-3">
                    {bunnyVideo ? (
                      // Selected video preview
                      <div className="rounded-lg border bg-muted/30 overflow-hidden">
                        <div className="aspect-video bg-black relative overflow-hidden">
                          {bunnyVideo.thumbnail_blurhash ? (
                            <BlurhashImage
                              blurhash={bunnyVideo.thumbnail_blurhash}
                              width={320}
                              height={180}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Icon name="Film" className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                          {bunnyVideo.status === 'ready' && bunnyVideo.duration_seconds && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
                              {formatDuration(bunnyVideo.duration_seconds)}
                            </span>
                          )}
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-sm truncate">{bunnyVideo.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={handleRemoveBunnyVideo}
                          >
                            <Icon name="X" className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : isUploading ? (
                      // Upload in progress
                      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                          <span className="text-sm">
                            {uploadState === 'uploading'
                              ? 'Uploading...'
                              : uploadState === 'processing'
                              ? 'Processing...'
                              : 'Preparing...'}
                          </span>
                        </div>
                        {uploadState === 'uploading' && (
                          <div className="space-y-1">
                            <Progress value={uploadProgress.percentage} />
                            <div className="text-xs text-muted-foreground text-right">
                              {uploadProgress.percentage}%
                            </div>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelUpload}
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      // Upload/Select buttons
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Button variant="outline" className="w-full gap-2">
                            <Icon name="Upload" className="h-4 w-4" />
                            Upload Video
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full gap-2"
                          onClick={() => setShowVideoLibrary(true)}
                        >
                          <Icon name="FolderOpen" className="h-4 w-4" />
                          Choose from Library
                        </Button>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <Icon name="AlertCircle" className="h-3.5 w-3.5" />
                        {uploadError}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="external" className="mt-3 space-y-2">
                    <Input
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        if (e.target.value) {
                          setBunnyVideo(null); // Clear Bunny video when using external
                        }
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      YouTube, Vimeo, or direct video URL
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </aside>
        </div>

        {/* Video Library Modal */}
        <VideoLibrary
          open={showVideoLibrary}
          onClose={() => setShowVideoLibrary(false)}
          onSelect={handleSelectVideoFromLibrary}
          selectedVideoId={bunnyVideo?.id}
        />
      </div>
    </DndContext>
  );
}
