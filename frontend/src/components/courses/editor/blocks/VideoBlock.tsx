import { VideoBlockData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';

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

export function VideoBlock({ data, onChange, isEditing }: VideoBlockProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-url">Video URL</Label>
          <Input
            id="video-url"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <p className="text-xs text-muted-foreground">
            Supports YouTube, Vimeo, or direct video files (.mp4, .webm)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-title">Title (optional)</Label>
          <Input
            id="video-title"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="Video title for accessibility"
          />
        </div>

        {data.url && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <VideoPreview data={data} />
          </div>
        )}
      </div>
    );
  }

  return <VideoPreview data={data} />;
}

function VideoPreview({ data }: { data: VideoBlockData }) {
  const embedUrl = getVideoEmbedUrl(data.url);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <Icon name="Play" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{data.url ? 'Invalid video URL' : 'No video URL set'}</p>
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
