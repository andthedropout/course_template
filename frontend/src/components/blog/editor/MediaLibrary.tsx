import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { uploadBlogImage, fetchUploadedImages, type BlogImage } from '@/api/blog'

interface MediaLibraryProps {
  onSelect?: (url: string) => void
  onClose?: () => void
}

interface PendingUpload {
  file: File
  preview: string
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [images, setImages] = useState<BlogImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showAltTextDialog, setShowAltTextDialog] = useState(false)
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null)
  const [altText, setAltText] = useState('')
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing images on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const uploadedImages = await fetchUploadedImages()
        setImages(uploadedImages)
      } catch (error) {
        console.error('Failed to load images:', error)
        toast({
          title: 'Error',
          description: 'Failed to load media library',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0] // Handle one file at a time for alt text
    const preview = URL.createObjectURL(file)

    setPendingUpload({ file, preview })
    setAltText('')
    setShowAltTextDialog(true)
  }

  const handleUploadWithAltText = async () => {
    if (!pendingUpload) return

    setIsUploading(true)
    setShowAltTextDialog(false)

    try {
      const result = await uploadBlogImage(pendingUpload.file, altText)

      // Add newly uploaded image to the list
      const newImage: BlogImage = {
        id: result.id,
        url: result.url,
        filename: result.filename,
        size: result.size,
        alt_text: result.alt_text,
        created_at: new Date().toISOString(),
      }

      setImages((prev) => [newImage, ...prev])

      toast({
        title: 'Image uploaded',
        description: `${pendingUpload.file.name} uploaded successfully`,
      })

      URL.revokeObjectURL(pendingUpload.preview)
      setPendingUpload(null)
      setAltText('')
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancelUpload = () => {
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.preview)
      setPendingUpload(null)
    }
    setAltText('')
    setShowAltTextDialog(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files

    if (files.length === 0) return

    const file = files[0] // Handle one file at a time for alt text
    if (!file.type.startsWith('image/')) return

    const preview = URL.createObjectURL(file)
    setPendingUpload({ file, preview })
    setAltText('')
    setShowAltTextDialog(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleImageSelect = (url: string) => {
    if (onSelect) {
      onSelect(url)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: 'Copied',
      description: 'Image URL copied to clipboard',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 pb-0">
          <h2 className="text-lg font-semibold mb-4">Media Library</h2>
        </div>

      <div className="p-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="Upload" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop images here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, GIF, WebP (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {isUploading && (
        <div className="px-4 py-2 bg-muted">
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="ImageOff" className="h-12 w-12 mx-auto mb-4" />
            <p>No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border rounded-lg overflow-hidden group bg-card">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleImageSelect(image.url)}
                    >
                      <Icon name="Check" className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyToClipboard(image.url)}
                    >
                      <Icon name="Copy" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{image.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Alt Text Dialog */}
    <Dialog open={showAltTextDialog} onOpenChange={handleCancelUpload}>
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
                  e.preventDefault()
                  handleUploadWithAltText()
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
          <Button onClick={handleUploadWithAltText}>
            Upload Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
