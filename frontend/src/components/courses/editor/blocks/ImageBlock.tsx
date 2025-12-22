import { useState, useRef } from 'react';
import { ImageBlockData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { uploadBlogImage } from '@/api/blog';

interface ImageBlockProps {
  data: ImageBlockData;
  onChange: (data: ImageBlockData) => void;
  isEditing?: boolean;
}

interface PendingUpload {
  file: File;
  preview: string;
}

export function ImageBlock({ data, onChange, isEditing }: ImageBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAltDialog, setShowAltDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [altText, setAltText] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPendingUpload({ file, preview });
    setAltText(data.alt || '');
    setShowAltDialog(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please drop an image file',
        variant: 'destructive',
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPendingUpload({ file, preview });
    setAltText(data.alt || '');
    setShowAltDialog(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!pendingUpload) return;

    setIsUploading(true);
    setShowAltDialog(false);

    try {
      const result = await uploadBlogImage(pendingUpload.file, altText);

      onChange({
        ...data,
        url: result.url,
        alt: altText || result.alt_text,
      });

      toast({
        title: 'Image uploaded',
        description: 'Image uploaded successfully',
      });

      URL.revokeObjectURL(pendingUpload.preview);
      setPendingUpload(null);
      setAltText('');
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelUpload = () => {
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.preview);
      setPendingUpload(null);
    }
    setAltText('');
    setShowAltDialog(false);
  };

  const handleRemoveImage = () => {
    onChange({ ...data, url: '', alt: '', caption: '' });
  };

  if (isEditing) {
    return (
      <>
        <div className="space-y-4">
          {/* Image upload/display area */}
          {data.url ? (
            <div className="relative group">
              <img
                src={data.url}
                alt={data.alt}
                className="max-w-full h-auto rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Upload" className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemoveImage}
                >
                  <Icon name="Trash2" className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Icon name="Loader2" className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Icon name="Upload" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop an image here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, GIF, WebP
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* URL input toggle */}
          {!data.url && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlInput(!showUrlInput)}
              >
                <Icon name="Link" className="h-4 w-4 mr-1" />
                {showUrlInput ? 'Hide URL input' : 'Or enter URL manually'}
              </Button>
            </div>
          )}

          {showUrlInput && !data.url && (
            <div className="space-y-1.5">
              <Label htmlFor="image-url" className="text-xs font-medium text-muted-foreground">
                Image URL
              </Label>
              <Input
                id="image-url"
                value={data.url}
                onChange={(e) => onChange({ ...data, url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="h-9"
              />
            </div>
          )}

          {/* Alt text and caption - always show when image exists */}
          {data.url && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="image-alt" className="text-xs font-medium text-muted-foreground">
                  Alt Text
                </Label>
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
            </>
          )}
        </div>

        {/* Alt Text Dialog */}
        <Dialog open={showAltDialog} onOpenChange={handleCancelUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Image Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {pendingUpload && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={pendingUpload.preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="alt-text">Alt Text (for SEO & Accessibility)</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image..."
                  className="mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUpload();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alt text helps search engines and screen readers understand your image
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelUpload}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
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
          <p>No image set</p>
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
