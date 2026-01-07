import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { BlurhashImage } from '@/components/ui/blurhash-image';
import { fetchBunnyVideos, deleteBunnyVideo, BunnyVideo } from '@/api/courses';
import { useBunnyUpload, UploadState } from '@/hooks/useBunnyUpload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VideoLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (video: BunnyVideo) => void;
  selectedVideoId?: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '--';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getStatusBadge(status: BunnyVideo['status']) {
  switch (status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 dark:text-green-400">
          <Icon name="Check" className="h-3 w-3" />
          Ready
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Icon name="Loader2" className="h-3 w-3 animate-spin" />
          Processing
        </span>
      );
    case 'uploading':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Icon name="Upload" className="h-3 w-3" />
          Uploading
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-600 dark:text-red-400">
          <Icon name="AlertCircle" className="h-3 w-3" />
          Failed
        </span>
      );
  }
}

function getUploadStateMessage(state: UploadState): string {
  switch (state) {
    case 'initializing':
      return 'Preparing upload...';
    case 'uploading':
      return 'Uploading...';
    case 'confirming':
      return 'Confirming upload...';
    case 'processing':
      return 'Processing video...';
    case 'ready':
      return 'Complete!';
    case 'error':
      return 'Upload failed';
    default:
      return '';
  }
}

export function VideoLibrary({
  open,
  onClose,
  onSelect,
  selectedVideoId,
}: VideoLibraryProps) {
  const { toast } = useToast();
  const [videos, setVideos] = useState<BunnyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    uploadState,
    progress,
    error: uploadError,
    video: uploadedVideo,
    upload,
    cancel,
    reset: resetUpload,
  } = useBunnyUpload();

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBunnyVideos();
      setVideos(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load videos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      loadVideos();
    }
  }, [open, loadVideos]);

  // When upload completes, refresh the list
  useEffect(() => {
    if (uploadedVideo && uploadState === 'ready') {
      loadVideos();
      resetUpload();
    }
  }, [uploadedVideo, uploadState, loadVideos, resetUpload]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    await upload(file);
    e.target.value = '';
  };

  const handleDelete = async (video: BunnyVideo) => {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return;

    try {
      setDeletingId(video.id);
      await deleteBunnyVideo(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      toast({
        title: 'Deleted',
        description: 'Video deleted successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase())
  );

  const isUploading = ['initializing', 'uploading', 'confirming', 'processing'].includes(uploadState);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Film" className="h-5 w-5" />
            Video Library
          </DialogTitle>
        </DialogHeader>

        {/* Search and Upload */}
        <div className="flex items-center gap-3 py-2">
          <div className="relative flex-1">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="pl-9"
            />
          </div>
          <div className="relative">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Button disabled={isUploading} className="gap-2">
              <Icon name="Upload" className="h-4 w-4" />
              Upload Video
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{getUploadStateMessage(uploadState)}</span>
              </div>
              {uploadState === 'uploading' && (
                <Button variant="ghost" size="sm" onClick={cancel}>
                  Cancel
                </Button>
              )}
            </div>
            {uploadState === 'uploading' && (
              <div className="space-y-1">
                <Progress value={progress.percentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(progress.bytesUploaded)} / {formatFileSize(progress.bytesTotal)}</span>
                  <span>{progress.percentage}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Error */}
        {uploadState === 'error' && uploadError && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="AlertCircle" className="h-4 w-4" />
              {uploadError}
            </div>
            <Button variant="ghost" size="sm" onClick={resetUpload}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Icon name="Film" className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">No videos found</p>
              <p className="text-sm">Upload your first video to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className={cn(
                    'group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50',
                    selectedVideoId === video.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => video.status === 'ready' && onSelect(video)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {video.thumbnail_blurhash ? (
                      <BlurhashImage
                        blurhash={video.thumbnail_blurhash}
                        width={256}
                        height={144}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Icon name="Film" className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Duration overlay */}
                    {video.status === 'ready' && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
                        {formatDuration(video.duration_seconds)}
                      </span>
                    )}

                    {/* Selected indicator */}
                    {selectedVideoId === video.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Icon name="Check" className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate">{video.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      {getStatusBadge(video.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(video.file_size_bytes)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video);
                    }}
                    disabled={deletingId === video.id}
                  >
                    {deletingId === video.id ? (
                      <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon name="Trash2" className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
