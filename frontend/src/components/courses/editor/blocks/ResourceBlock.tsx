import { useState, useRef } from 'react';
import { ResourceBlockData, ResourceFile } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadCourseFile } from '@/api/courses';

interface ResourceBlockProps {
  data: ResourceBlockData;
  onChange: (data: ResourceBlockData) => void;
  isEditing?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'Image';
  if (type.startsWith('video/')) return 'Video';
  if (type.startsWith('audio/')) return 'Music';
  if (type.includes('pdf')) return 'FileText';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'Archive';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return 'Table';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'Presentation';
  if (type.includes('document') || type.includes('word')) return 'FileText';
  if (type.includes('text') || type.includes('json') || type.includes('javascript') || type.includes('css')) return 'FileCode';
  return 'File';
}

export function ResourceBlock({ data, onChange, isEditing }: ResourceBlockProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    await uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    const newFiles: ResourceFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

        const result = await uploadCourseFile(file);
        newFiles.push({
          id: result.id,
          name: result.name,
          url: result.url,
          size: result.size,
          type: result.type,
        });
      }

      onChange({
        ...data,
        files: [...data.files, ...newFiles],
      });

      toast({
        title: 'Files uploaded',
        description: `${newFiles.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    onChange({
      ...data,
      files: data.files.filter(f => f.id !== fileId),
    });
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Title and description */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="resource-title" className="text-xs font-medium text-muted-foreground">
              Section Title (optional)
            </Label>
            <Input
              id="resource-title"
              value={data.title || ''}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              placeholder="e.g., Project Files, Additional Resources"
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="resource-description" className="text-xs font-medium text-muted-foreground">
            Description (optional)
          </Label>
          <Textarea
            id="resource-description"
            value={data.description || ''}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Add a description for these resources..."
            rows={2}
            className="resize-none"
          />
        </div>

        {/* File list */}
        {data.files.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Uploaded Files ({data.files.length})
            </Label>
            <div className="space-y-2">
              {data.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  <Icon name={getFileIcon(file.type)} className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Icon name="ExternalLink" className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
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
              <Icon name="Loader2" className="h-10 w-10 mx-auto mb-3 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">{uploadProgress || 'Uploading...'}</p>
            </>
          ) : (
            <>
              <Icon name="Upload" className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, ZIP, code files, images, and more
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  return <ResourcePreview data={data} />;
}

function ResourcePreview({ data }: { data: ResourceBlockData }) {
  if (data.files.length === 0 && !data.title && !data.description) {
    return (
      <div className="flex items-center justify-center h-32 bg-muted rounded-lg border border-dashed">
        <div className="text-center text-muted-foreground">
          <Icon name="Download" className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No resources added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      {data.title && (
        <h4 className="font-medium mb-1">{data.title}</h4>
      )}
      {data.description && (
        <p className="text-sm text-muted-foreground mb-4">{data.description}</p>
      )}

      {data.files.length > 0 && (
        <div className="space-y-2">
          {data.files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.name}
              className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:border-primary transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={getFileIcon(file.type)} className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Icon name="Download" className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
