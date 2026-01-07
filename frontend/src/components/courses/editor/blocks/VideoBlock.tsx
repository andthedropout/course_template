import { useState } from 'react';
import { VideoBlockData } from '../types';
import { VideoLibrary } from '../VideoLibrary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BlurhashImage } from '@/components/ui/blurhash-image';
import { useBunnyUpload } from '@/hooks/useBunnyUpload';
import { BunnyVideo } from '@/api/courses';

interface VideoBlockProps {
  data: VideoBlockData;
  onChange: (data: VideoBlockData) => void;
  isEditing?: boolean;
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  return null;
}

function isDirectVideo(url: string): boolean {
  return !!url.match(/\.(mp4|webm|ogg)$/i);
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoBlock({ data, onChange, isEditing }: VideoBlockProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(data.bunny_video ? 'bunny' : 'external');

  const {
    uploadState,
    progress: uploadProgress,
    error: uploadError,
    upload,
    cancel: cancelUpload,
    reset: resetUpload,
  } = useBunnyUpload();

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;

    const result = await upload(file, data.title || file.name);
    if (result) {
      onChange({
        ...data,
        url: '',
        bunny_video_id: result.id,
        bunny_video: {
          id: result.id,
          guid: result.guid,
          title: result.title,
          thumbnail_url: result.thumbnail_url,
          thumbnail_blurhash: result.thumbnail_blurhash,
          duration_seconds: result.duration_seconds,
          status: result.status,
        },
      });
    }
    e.target.value = '';
  };

  const handleSelectFromLibrary = (video: BunnyVideo) => {
    onChange({
      ...data,
      url: '',
      bunny_video_id: video.id,
      bunny_video: {
        id: video.id,
        guid: video.guid,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        thumbnail_blurhash: video.thumbnail_blurhash,
        duration_seconds: video.duration_seconds,
        status: video.status,
      },
    });
    setShowLibrary(false);
  };

  const handleRemoveBunnyVideo = () => {
    onChange({
      ...data,
      bunny_video_id: null,
      bunny_video: null,
    });
  };

  const isUploading = ['initializing', 'uploading', 'confirming', 'processing'].includes(uploadState);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {data.bunny_video ? (
              // Selected Bunny video
              <div className="rounded-lg border bg-muted/30 overflow-hidden">
                <div className="aspect-video bg-black relative overflow-hidden">
                  {data.bunny_video.thumbnail_blurhash ? (
                    <BlurhashImage
                      blurhash={data.bunny_video.thumbnail_blurhash}
                      width={320}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Icon name="Film" className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  {data.bunny_video.duration_seconds && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
                      {formatDuration(data.bunny_video.duration_seconds)}
                    </span>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between">
                  <span className="text-sm truncate">{data.bunny_video.title}</span>
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
                <Button variant="outline" size="sm" onClick={cancelUpload} className="w-full">
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
                  <Button variant="outline" className="w-full gap-2" type="button">
                    <Icon name="Upload" className="h-4 w-4" />
                    Upload Video
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  type="button"
                  onClick={() => setShowLibrary(true)}
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
                <Button variant="ghost" size="sm" onClick={resetUpload} className="ml-auto h-6 px-2">
                  Dismiss
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="external" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="video-url" className="text-xs font-medium text-muted-foreground">
                Video URL
              </Label>
              <Input
                id="video-url"
                value={data.url}
                onChange={(e) => {
                  onChange({
                    ...data,
                    url: e.target.value,
                    bunny_video_id: null,
                    bunny_video: null,
                  });
                }}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, or direct video files (.mp4, .webm)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-1.5">
          <Label htmlFor="video-title" className="text-xs font-medium text-muted-foreground">
            Title (optional)
          </Label>
          <Input
            id="video-title"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="Video title for accessibility"
            className="h-9"
          />
        </div>

        {data.url && !data.bunny_video && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <VideoPreview data={data} />
          </div>
        )}

        <VideoLibrary
          open={showLibrary}
          onClose={() => setShowLibrary(false)}
          onSelect={handleSelectFromLibrary}
          selectedVideoId={data.bunny_video?.id}
        />
      </div>
    );
  }

  return <VideoPreview data={data} />;
}

function VideoPreview({ data }: { data: VideoBlockData }) {
  // Bunny Stream video takes priority
  if (data.bunny_video || data.signed_video_url) {
    // In editor, show thumbnail preview (we don't have signed URL yet)
    if (data.bunny_video && !data.signed_video_url) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {data.bunny_video.thumbnail_blurhash ? (
            <BlurhashImage
              blurhash={data.bunny_video.thumbnail_blurhash}
              width={640}
              height={360}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <Icon name="Film" className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Icon name="Play" className="h-8 w-8 text-white ml-1" />
            </div>
          </div>
          {data.bunny_video.duration_seconds && (
            <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 text-white text-sm font-mono">
              {formatDuration(data.bunny_video.duration_seconds)}
            </span>
          )}
        </div>
      );
    }

    // When we have a signed URL, show the actual player
    if (data.signed_video_url) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={data.signed_video_url}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            loading="lazy"
            style={{ border: 'none' }}
            title={data.title || data.bunny_video?.title || 'Video'}
          />
        </div>
      );
    }
  }

  // External URL fallback
  const embedUrl = getVideoEmbedUrl(data.url);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <Icon name="Play" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{data.url ? 'Invalid video URL' : 'No video set'}</p>
        </div>
      </div>
    );
  }

  if (isDirectVideo(data.url)) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={embedUrl}
          controls
          className="w-full h-full"
          title={data.title}
        />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={data.title || 'Video'}
      />
    </div>
  );
}
