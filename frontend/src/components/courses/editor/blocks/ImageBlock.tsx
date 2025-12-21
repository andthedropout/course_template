import { ImageBlockData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';

interface ImageBlockProps {
  data: ImageBlockData;
  onChange: (data: ImageBlockData) => void;
  isEditing?: boolean;
}

export function ImageBlock({ data, onChange, isEditing }: ImageBlockProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="image-url" className="text-xs font-medium text-muted-foreground">Image URL</Label>
          <Input
            id="image-url"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="image-alt" className="text-xs font-medium text-muted-foreground">Alt Text</Label>
          <Input
            id="image-alt"
            value={data.alt}
            onChange={(e) => onChange({ ...data, alt: e.target.value })}
            placeholder="Describe the image for accessibility"
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="image-caption" className="text-xs font-medium text-muted-foreground">
            Caption (optional)
          </Label>
          <Input
            id="image-caption"
            value={data.caption || ''}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Optional caption below the image"
            className="h-9"
          />
        </div>

        {data.url && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
            <ImagePreview data={data} />
          </div>
        )}
      </div>
    );
  }

  return <ImagePreview data={data} />;
}

function ImagePreview({ data }: { data: ImageBlockData }) {
  if (!data.url) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <Icon name="Image" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No image URL set</p>
        </div>
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      <img
        src={data.url}
        alt={data.alt}
        className="max-w-full h-auto rounded-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '';
          (e.target as HTMLImageElement).alt = 'Failed to load image';
        }}
      />
      {data.caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}
