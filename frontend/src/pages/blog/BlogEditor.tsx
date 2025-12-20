import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'
import { GravityMarkdownEditor } from '@/components/blog/editor/GravityMarkdownEditor'
import { MediaLibrary } from '@/components/blog/editor/MediaLibrary'
import { SeoAnalysis } from '@/components/blog/editor/SeoAnalysis'
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { MultiSelect } from '@/components/ui/multi-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  createPost,
  updatePost,
  uploadBlogImage,
  fetchCategories,
  fetchTags,
  type PostCreateData,
  type Category,
  type Tag,
} from '@/api/blog'

// Initialize markdown-it instance (same library used by Gravity editor)
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

// Available animated background options
const BACKGROUND_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'art_deco', label: 'Art Deco' },
  { value: 'barberpole', label: 'Barberpole' },
  { value: 'bigflag', label: 'Big Flag' },
  { value: 'bokeh_up', label: 'Bokeh Up' },
  { value: 'bricks_shadow', label: 'Bricks Shadow' },
  { value: 'bubbles', label: 'Bubbles' },
  { value: 'bubbles_popout', label: 'Bubbles Popout' },
  { value: 'bubbles_up', label: 'Bubbles Up' },
  { value: 'circlewave', label: 'Circle Wave' },
  { value: 'cloud_ocean', label: 'Cloud Ocean' },
  { value: 'clouds', label: 'Clouds' },
  { value: 'cloudscroll', label: 'Cloud Scroll' },
  { value: 'curtain_waves', label: 'Curtain Waves' },
  { value: 'dot_hallway', label: 'Dot Hallway' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'future_braids', label: 'Future Braids' },
  { value: 'grid_wave', label: 'Grid Wave' },
  { value: 'impactlines', label: 'Impact Lines' },
  { value: 'laser_rain', label: 'Laser Rain' },
  { value: 'leaf_blowing', label: 'Leaf Blowing' },
  { value: 'meteor_shower', label: 'Meteor Shower' },
  { value: 'musicnotes', label: 'Music Notes' },
  { value: 'playstation_particles', label: 'PlayStation Particles' },
  { value: 'raindrops', label: 'Raindrops' },
  { value: 'raining_balls', label: 'Raining Balls' },
  { value: 'ripples', label: 'Ripples' },
  { value: 'rolling_hills', label: 'Rolling Hills' },
  { value: 'skylights', label: 'Skylights' },
  { value: 'snowflakes', label: 'Snowflakes' },
  { value: 'soundwaves', label: 'Sound Waves' },
  { value: 'spiral_wave', label: 'Spiral Wave' },
  { value: 'splotches', label: 'Splotches' },
  { value: 'stars', label: 'Stars' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'sunrays', label: 'Sunrays' },
  { value: 'waves_full', label: 'Waves Full' },
  { value: 'waves_fullscreen', label: 'Waves Fullscreen' },
  { value: 'waves_horizontal', label: 'Waves Horizontal' },
  { value: 'waves_slanted', label: 'Waves Slanted' },
  { value: 'waves_tall', label: 'Waves Tall' },
  { value: 'zen_lotusflower', label: 'Zen Lotus Flower' },
]

interface BlogEditorProps {
  slug?: string
  initialData?: any
}

export default function BlogEditor({ slug, initialData }: BlogEditorProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  console.log('📦 [BlogEditor] Component render - Props:', {
    slug,
    hasInitialData: !!initialData,
    initialDataKeys: initialData ? Object.keys(initialData) : [],
    initialTitle: initialData?.title,
    initialContentLength: initialData?.content?.length || 0,
    initialContentPreview: initialData?.content?.substring(0, 100) || '(empty)'
  })

  // Form state
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(initialData?.featured_image_url || null)
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(initialData?.og_image_url || null)
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')

  console.log('📦 [BlogEditor] State initialized:', {
    titleLength: title.length,
    contentLength: content.length,
    contentPreview: content.substring(0, 100) || '(empty)',
    excerptLength: excerpt.length
  })

  // Parse markdown to HTML for preview (same as backend logic)
  const contentHtml = useMemo(() => {
    if (!content) return ''
    try {
      return md.render(content)
    } catch (error) {
      console.error('Markdown render error:', error)
      return ''
    }
  }, [content])

  // Stable callback reference for editor - prevents stale closure bugs
  const handleContentChange = useCallback((newContent: string) => {
    console.log('🔄 [BlogEditor] handleContentChange called:', {
      newContentLength: newContent.length,
      newContentPreview: newContent.substring(0, 100)
    })
    setContent(newContent)
  }, [])
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>(
    initialData?.status || 'draft'
  )
  const [savedStatus, setSavedStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>(
    initialData?.status || 'draft'
  )
  const [publishDate, setPublishDate] = useState(
    initialData?.publish_date
      ? new Date(initialData.publish_date).toISOString().slice(0, 16)
      : ''
  )
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c: Category) => c.id) || []
  )
  const [selectedTags, setSelectedTags] = useState<number[]>(
    initialData?.tags?.map((t: Tag) => t.id) || []
  )

  // Meta state
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '')
  const [metaKeywords, setMetaKeywords] = useState(initialData?.meta_keywords || '')
  const [focusKeyword, setFocusKeyword] = useState(initialData?.focus_keyword || '')
  const [featured, setFeatured] = useState(initialData?.featured || false)
  const [allowComments, setAllowComments] = useState(initialData?.allow_comments ?? true)
  const [fullWidthImage, setFullWidthImage] = useState(initialData?.full_width_image ?? true)
  const [heroBackgroundType, setHeroBackgroundType] = useState(initialData?.hero_background_type || '')
  const [heroBackgroundOpacity, setHeroBackgroundOpacity] = useState((initialData?.hero_background_opacity || 0.6) * 100) // Store as 0-100 for slider
  const [heroBackgroundScope, setHeroBackgroundScope] = useState<'hero' | 'full'>(initialData?.hero_background_scope || 'hero')
  const [heroBackgroundSize, setHeroBackgroundSize] = useState<'cover' | 'tile'>(initialData?.hero_background_size || 'cover')
  const [heroBackgroundTileSize, setHeroBackgroundTileSize] = useState(initialData?.hero_background_tile_size || 800)

  // Available options
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [showSeoSettings, setShowSeoSettings] = useState(true)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [imageSelectorTarget, setImageSelectorTarget] = useState<'featured' | 'og' | null>(null)

  // Load categories and tags
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()])
        setCategories(cats)
        setTags(tgs)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load categories and tags',
          variant: 'destructive',
        })
      }
    }
    loadOptions()
  }, [toast])

  // Mark as dirty when content changes
  useEffect(() => {
    if (title || content || excerpt) {
      setIsDirty(true)
    }
  }, [
    title, content, excerpt,
    selectedCategories, selectedTags,
    status, publishDate,
    heroBackgroundType, heroBackgroundOpacity, heroBackgroundScope, heroBackgroundSize, heroBackgroundTileSize,
    fullWidthImage, featured, allowComments,
    metaTitle, metaDescription, metaKeywords, focusKeyword
  ])

  // Auto-save functionality
  useEffect(() => {
    if (!isDirty || !slug) return

    const timer = setTimeout(async () => {
      await handleSave(true)
    }, 60000) // Auto-save every 60 seconds

    return () => clearTimeout(timer)
  }, [isDirty, slug, title, content, excerpt, selectedCategories, selectedTags])

  // Handle image upload for editor
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await uploadBlogImage(file)
      return result.url
    } catch (error) {
      throw new Error('Failed to upload image')
    }
  }

  // Handle featured image selection
  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFeaturedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setIsDirty(true)
    }
  }

  // Handle OG image selection
  const handleOgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOgImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setIsDirty(true)
    }
  }

  // Remove featured image
  const handleRemoveFeaturedImage = () => {
    setFeaturedImage(null)
    setFeaturedImagePreview(null)
    setIsDirty(true)
  }

  // Remove OG image
  const handleRemoveOgImage = () => {
    setOgImage(null)
    setOgImagePreview(null)
    setIsDirty(true)
  }

  // Open media library for image selection
  const handleSelectFromLibrary = (target: 'featured' | 'og') => {
    setImageSelectorTarget(target)
    setShowImageSelector(true)
  }

  // Handle image selection from library
  const handleImageFromLibrary = (url: string) => {
    if (imageSelectorTarget === 'featured') {
      setFeaturedImagePreview(url)
      setFeaturedImage(null) // Clear file object since we're using existing image
    } else if (imageSelectorTarget === 'og') {
      setOgImagePreview(url)
      setOgImage(null) // Clear file object since we're using existing image
    }
    setShowImageSelector(false)
    setImageSelectorTarget(null)
    setIsDirty(true)
  }

  // Handle save (draft or publish)
  const handleSave = async (isAutoSave = false) => {
    console.log('💾 [BlogEditor] handleSave called:', {
      isAutoSave,
      titleLength: title.length,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) || '(empty)',
      status
    })

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      })
      return
    }

    // Confirm if publishing for the first time (and not auto-saving)
    if (!isAutoSave && status === 'published' && initialData?.status === 'draft') {
      const confirmed = window.confirm(
        'Are you sure you want to publish this post? It will be visible to everyone on your blog.'
      )
      if (!confirmed) {
        return
      }
    }

    setIsSaving(true)

    try {
      const postData: any = {
        title: title.trim(),
        content,
        excerpt: excerpt || undefined,
        status,
        category_ids: selectedCategories,
        tag_ids: selectedTags,
        featured,
        allow_comments: allowComments,
        full_width_image: fullWidthImage,
        hero_background_type: heroBackgroundType || '',
        hero_background_opacity: heroBackgroundOpacity / 100, // Convert from 0-100 to 0.0-1.0
        hero_background_scope: heroBackgroundScope,
        hero_background_size: heroBackgroundSize,
        hero_background_tile_size: heroBackgroundTileSize,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        meta_keywords: metaKeywords || undefined,
        focus_keyword: focusKeyword || undefined,
      }

      // Include publish_date if scheduled or if already set
      if (status === 'scheduled' || publishDate) {
        postData.publish_date = publishDate ? new Date(publishDate).toISOString() : undefined
      }

      // Add images if present
      // If uploading a new file, include it
      if (featuredImage) {
        postData.featured_image = featuredImage
      } else if (featuredImagePreview) {
        // If selecting from library, send the URL directly
        postData.featured_image = featuredImagePreview
      }

      if (ogImage) {
        postData.og_image = ogImage
      } else if (ogImagePreview) {
        // If selecting from library, send the URL directly
        postData.og_image = ogImagePreview
      }

      if (slug) {
        // Update existing post
        const result = await updatePost(slug, postData)
        // Update preview URLs from response
        if (result.featured_image_url) {
          setFeaturedImagePreview(result.featured_image_url)
        }
        if (result.og_image_url) {
          setOgImagePreview(result.og_image_url)
        }
        // Clear file objects after successful upload
        setFeaturedImage(null)
        setOgImage(null)
      } else {
        // Create new post
        const result = await createPost(postData)
        // Update preview URLs from response
        if (result.featured_image_url) {
          setFeaturedImagePreview(result.featured_image_url)
        }
        if (result.og_image_url) {
          setOgImagePreview(result.og_image_url)
        }
        // Clear file objects after successful upload
        setFeaturedImage(null)
        setOgImage(null)
        // After creating, navigate to edit page with the new slug
        navigate({ to: `/blog/edit/${result.slug}` })
      }

      setLastSaved(new Date())
      setIsDirty(false)
      setSavedStatus(status) // Update saved status after successful save

      if (!isAutoSave) {
        toast({
          title: 'Success',
          description: `Post ${slug ? 'updated' : 'created'} successfully`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }


  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Render status badge for header
  const renderStatusBadge = () => {
    const badgeConfig = {
      published: {
        color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        icon: 'CheckCircle' as const,
        label: 'Published'
      },
      scheduled: {
        color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: 'Clock' as const,
        label: publishDate ? `Scheduled for ${new Date(publishDate).toLocaleDateString()}` : 'Scheduled'
      },
      draft: {
        color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        icon: 'FileText' as const,
        label: 'Draft'
      },
      archived: {
        color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: 'Archive' as const,
        label: 'Archived'
      }
    }

    const config = badgeConfig[savedStatus]

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon name={config.icon} className="h-4 w-4" />
        <span>{config.label}</span>
      </div>
    )
  }

  // Render compact status tag for card header
  const renderStatusTag = () => {
    const getStatusText = () => {
      if (status === 'published') {
        return savedStatus === 'published' ? 'Published' : 'Ready to publish'
      } else if (status === 'scheduled') {
        return savedStatus === 'scheduled' ? 'Scheduled' : 'Ready to schedule'
      } else if (status === 'draft') {
        return savedStatus === 'draft' ? 'Draft' : 'Saving as draft'
      } else if (status === 'archived') {
        return savedStatus === 'archived' ? 'Archived' : 'Ready to archive'
      }
      return ''
    }

    const tagConfig = {
      published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      draft: 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      archived: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
    }

    return (
      <span className={`text-xs px-2 py-1 rounded border ${tagConfig[status]}`}>
        {getStatusText()}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/blog/dashboard' })}
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Icon name="FileEdit" className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">
                {slug ? 'Edit Post' : 'New Post'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save status indicator */}
            <span className="text-sm text-muted-foreground">
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                `Saved ${lastSaved.toLocaleTimeString()}`
              ) : isDirty ? (
                'Unsaved changes'
              ) : (
                'All changes saved'
              )}
            </span>

            {/* Status Badge - only show for existing posts */}
            {slug && renderStatusBadge()}
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Excerpt Card */}
            <div className="border rounded-lg p-6 bg-card space-y-6">
              {/* Title */}
              <div>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title..."
                  className="text-3xl font-bold h-auto py-3"
                />
                {title && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Slug: {generateSlug(title)}
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <Label htmlFor="excerpt">Excerpt (optional)</Label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of the post (max 300 characters)"
                  maxLength={300}
                  className="w-full mt-2 p-3 border rounded-md resize-none h-24 text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {excerpt.length}/300 characters
                </p>
              </div>
            </div>

            {/* SEO Analysis Panel */}
            <div className="border rounded-lg p-4 bg-card">
              <Label className="mb-3 block">SEO Analysis</Label>
              <SeoAnalysis
                content={content}
                title={title}
                metaDescription={metaDescription}
                focusKeyword={focusKeyword}
                excerpt={excerpt}
                onFocusKeywordChange={setFocusKeyword}
              />
            </div>

            {/* Editor Card */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center justify-between mb-4">
                <Label>Content</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaLibrary(!showMediaLibrary)}
                >
                  <Icon name="Image" className="h-4 w-4 mr-2" />
                  Media Library
                </Button>
              </div>
              <GravityMarkdownEditor
                value={content}
                onChange={handleContentChange}
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Media Library Modal */}
            <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>
                <MediaLibrary
                  onSelect={(url) => {
                    setContent(content + `\n\n![Image](${url})`)
                    setShowMediaLibrary(false)
                  }}
                  onClose={() => setShowMediaLibrary(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Card */}
            <div className="border rounded-lg p-4 bg-card space-y-4">
              {/* Card Header with Status Tag */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Icon name="Send" className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Publishing</h3>
                </div>
                {renderStatusTag()}
              </div>

              {/* Status Dropdown */}
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full mt-2 p-2 border rounded-md bg-background"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Publish Date (shown for scheduled posts) */}
              {status === 'scheduled' && (
                <div>
                  <Label htmlFor="publish-date">Publish Date & Time</Label>
                  <div className="mt-2">
                    <DateTimePicker
                      value={publishDate}
                      onChange={setPublishDate}
                      placeholder="Schedule publication"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons - Horizontal row */}
              <div className="pt-2 space-y-2">
                <div className="flex gap-2">
                {slug && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(`/blog/${slug}`, '_blank')}
                    title="Preview post in new window"
                  >
                    <Icon name="ExternalLink" className="h-4 w-4 mr-2" />
                    Preview Post
                  </Button>
                )}
                <Button
                  variant={status === 'published' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleSave()}
                  disabled={isSaving || (!isDirty && status === savedStatus)}
                >
                  <Icon name="Save" className="h-4 w-4 mr-2" />
                  {status === 'draft' ? 'Save Draft' :
                   status === 'published' ? 'Save & Publish' :
                   status === 'scheduled' ? 'Schedule Post' :
                   'Save'}
                </Button>
                </div>

                {/* Scheduled info text */}
                {status === 'scheduled' && publishDate && (
                  <p className="text-xs text-right text-muted-foreground">
                    Scheduled for {format(new Date(publishDate), "PPP 'at' p")}
                  </p>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="border rounded-lg p-4 bg-card">
              <Tabs defaultValue="featured" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="featured">Featured</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>

                {/* Featured Image Tab */}
                <TabsContent value="featured" className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Main post image (1200x630px)
                  </p>
                  {featuredImagePreview ? (
                    <div className="relative">
                      <img
                        src={featuredImagePreview}
                        alt="Featured preview"
                        className="w-full aspect-video object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveFeaturedImage}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
                      onClick={() => handleSelectFromLibrary('featured')}
                    >
                      <Icon name="Image" className="h-12 w-12 mb-2 text-muted-foreground" />
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Choose or Upload Image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 1200x630px
                      </p>
                    </div>
                  )}

                  {/* Full-width image toggle */}
                  <div className="pt-2 border-t">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullWidthImage}
                        onChange={(e) => setFullWidthImage(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Display full-width</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Image spans full viewport width vs constrained
                    </p>
                  </div>
                </TabsContent>

                {/* OG/Social Image Tab */}
                <TabsContent value="social" className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Social share preview (optional)
                  </p>
                  {ogImagePreview ? (
                    <div className="relative">
                      <img
                        src={ogImagePreview}
                        alt="OG preview"
                        className="w-full aspect-video object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveOgImage}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
                      onClick={() => handleSelectFromLibrary('og')}
                    >
                      <Icon name="Image" className="h-12 w-12 mb-2 text-muted-foreground" />
                      <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Choose or Upload Image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 1200x630px
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Hero Background */}
            <div className="border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="Sparkles" className="h-5 w-5 text-primary" />
                <Label>Hero Background Animation</Label>
              </div>

              <p className="text-xs text-muted-foreground">
                Add an animated background to your blog post hero section
              </p>

              {/* Background Type Dropdown with Search */}
              <div>
                <Label htmlFor="hero-background" className="text-xs">
                  Background Type
                </Label>
                <select
                  id="hero-background"
                  value={heroBackgroundType}
                  onChange={(e) => setHeroBackgroundType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm bg-background"
                >
                  {BACKGROUND_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Background Scope */}
              {heroBackgroundType && (
                <div>
                  <Label className="text-xs mb-2 block">Background Scope</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={heroBackgroundScope === 'hero'}
                        onChange={() => setHeroBackgroundScope('hero')}
                        className="rounded-full"
                      />
                      <span className="text-sm">Hero section only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={heroBackgroundScope === 'full'}
                        onChange={() => setHeroBackgroundScope('full')}
                        className="rounded-full"
                      />
                      <span className="text-sm">Full page</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Apply background to {heroBackgroundScope === 'hero' ? 'hero section only' : 'entire blog post page'}
                  </p>
                </div>
              )}

              {/* Background Size Mode - Only show for full page scope */}
              {heroBackgroundType && heroBackgroundScope === 'full' && (
                <div>
                  <Label className="text-xs mb-2 block">Display Mode</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={heroBackgroundSize === 'cover'}
                        onChange={() => setHeroBackgroundSize('cover')}
                        className="rounded-full"
                      />
                      <div>
                        <span className="text-sm font-medium">Cover (stretch to fill)</span>
                        <p className="text-xs text-muted-foreground">Fills entire area, may crop edges</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={heroBackgroundSize === 'tile'}
                        onChange={() => setHeroBackgroundSize('tile')}
                        className="rounded-full"
                      />
                      <div>
                        <span className="text-sm font-medium">Tile (repeat pattern)</span>
                        <p className="text-xs text-muted-foreground">Repeats pattern across entire area</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tile Size Slider - Only show when tile mode is active */}
              {heroBackgroundType && heroBackgroundScope === 'full' && heroBackgroundSize === 'tile' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="tile-size" className="text-xs">
                      Tile Size
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {heroBackgroundTileSize}px
                    </span>
                  </div>
                  <input
                    id="tile-size"
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={heroBackgroundTileSize}
                    onChange={(e) => setHeroBackgroundTileSize(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls the size of each repeating tile in pixels
                  </p>
                </div>
              )}

              {/* Opacity Slider */}
              {heroBackgroundType && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="hero-opacity" className="text-xs">
                      Background Opacity
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(heroBackgroundOpacity)}%
                    </span>
                  </div>
                  <input
                    id="hero-opacity"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={heroBackgroundOpacity}
                    onChange={(e) => setHeroBackgroundOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Live Preview - Switches based on scope */}
              {heroBackgroundType && (
                <div className="pt-2 border-t">
                  <Label className="text-xs mb-2 block">Preview</Label>

                  {/* Full Page Preview - tall stretched view */}
                  {heroBackgroundScope === 'full' ? (
                    <>
                      <div className="relative w-full h-96 rounded-lg overflow-hidden border bg-background">
                        {/* Scale wrapper - shrinks to 20% for miniature but tall preview */}
                        <div
                          style={{
                            transform: 'scale(0.2)',
                            transformOrigin: 'top left',
                            width: '500%', // Compensate for scale reduction
                            height: '500%', // Tall height to simulate full page
                          }}
                        >
                          <AnimatedBackground
                            type={heroBackgroundType}
                            opacity={heroBackgroundOpacity / 100}
                            size={heroBackgroundSize}
                            tileSize={heroBackgroundTileSize}
                            className="w-full h-full"
                          >
                            <div className="py-12 min-h-screen">
                              {/* Back Button */}
                              <div className="container mx-auto px-4 max-w-4xl mb-6">
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                  <span>←</span>
                                  Back to Blog
                                </div>
                              </div>

                              <header className="pb-12">
                                <div className="container mx-auto px-4 max-w-4xl mb-8 text-center">
                                  {/* Title */}
                                  <h1 className="text-6xl font-bold">
                                    {title || 'Your Post Title'}
                                  </h1>
                                </div>

                                {/* Featured Image */}
                                {featuredImagePreview && (
                                  fullWidthImage ? (
                                    <div className="w-full h-[400px] overflow-hidden">
                                      <img
                                        src={featuredImagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="container mx-auto px-4 max-w-4xl">
                                      <div className="w-full aspect-video rounded-lg overflow-hidden">
                                        <img
                                          src={featuredImagePreview}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </header>

                              {/* Content Card Preview */}
                              <div className="container mx-auto px-4 max-w-4xl">
                                <div className="bg-card/95 backdrop-blur-sm rounded-lg p-8 mb-8">
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                                    <span>By admin</span>
                                    <span>•</span>
                                    <span>Nov 5, 2025</span>
                                    <span>•</span>
                                    <span>5 min read</span>
                                  </div>
                                  {contentHtml ? (
                                    <div
                                      className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg max-w-none"
                                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                                    />
                                  ) : (
                                    <div className="space-y-3 text-muted-foreground">
                                      <div className="h-3 bg-muted/50 rounded w-full"></div>
                                      <div className="h-3 bg-muted/50 rounded w-5/6"></div>
                                      <div className="h-3 bg-muted/50 rounded w-4/6"></div>
                                    </div>
                                  )}
                                </div>
                                {/* Tags/Social Card */}
                                <div className="bg-card/95 backdrop-blur-sm rounded-lg p-6">
                                  <div className="h-3 bg-muted/50 rounded w-1/3"></div>
                                </div>
                              </div>
                            </div>
                          </AnimatedBackground>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Full page view - showing how background stretches across entire blog post
                      </p>
                    </>
                  ) : (
                    /* Hero Section Preview - just hero area */
                    <>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-background">
                        {/* Scale wrapper - shrinks to 25% for miniature preview */}
                        <div
                          style={{
                            transform: 'scale(0.25)',
                            transformOrigin: 'top left',
                            width: '400%', // Compensate for scale reduction
                          }}
                        >
                          <AnimatedBackground
                            type={heroBackgroundType}
                            opacity={heroBackgroundOpacity / 100}
                            size={heroBackgroundSize}
                            tileSize={heroBackgroundTileSize}
                            className="w-full"
                          >
                            <div className="py-12">
                              {/* Back Button */}
                              <div className="container mx-auto px-4 max-w-4xl mb-6">
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                  <span>←</span>
                                  Back to Blog
                                </div>
                              </div>

                              <header className="pb-12">
                                <div className="container mx-auto px-4 max-w-4xl mb-8 text-center">
                                  {/* Title */}
                                  <h1 className="text-6xl font-bold">
                                    {title || 'Your Post Title'}
                                  </h1>
                                </div>

                                {/* Featured Image */}
                                {featuredImagePreview && (
                                  fullWidthImage ? (
                                    <div className="w-full h-[400px] overflow-hidden">
                                      <img
                                        src={featuredImagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="container mx-auto px-4 max-w-4xl">
                                      <div className="w-full aspect-video rounded-lg overflow-hidden">
                                        <img
                                          src={featuredImagePreview}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  )
                                )}
                              </header>
                            </div>
                          </AnimatedBackground>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hero section only - background appears behind title and image
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SEO Settings */}
            <div className="border rounded-lg p-4 bg-card">
              <button
                type="button"
                onClick={() => setShowSeoSettings(!showSeoSettings)}
                className="flex items-center justify-between w-full"
              >
                <Label>SEO Settings</Label>
                <Icon
                  name={showSeoSettings ? 'ChevronUp' : 'ChevronDown'}
                  className="h-4 w-4"
                />
              </button>

              {showSeoSettings && (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="meta-title" className="text-xs">
                      Meta Title
                    </Label>
                    <Input
                      id="meta-title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Leave empty to use post title"
                      className="mt-1"
                      maxLength={70}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaTitle.length}/70
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta-description" className="text-xs">
                      Meta Description
                    </Label>
                    <textarea
                      id="meta-description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Leave empty to use excerpt"
                      maxLength={160}
                      className="w-full mt-1 p-2 border rounded-md resize-none h-20 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metaDescription.length}/160
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta-keywords" className="text-xs">
                      Meta Keywords
                    </Label>
                    <Input
                      id="meta-keywords"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="focus-keyword" className="text-xs">
                      Focus Keyword
                    </Label>
                    <Input
                      id="focus-keyword"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="primary keyword for SEO analysis"
                      className="mt-1"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for real-time SEO analysis
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="border rounded-lg p-4 bg-card">
              <Label>Categories</Label>
              <div className="mt-2">
                <MultiSelect
                  options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select categories..."
                />
              </div>
            </div>

            {/* Tags */}
            <div className="border rounded-lg p-4 bg-card">
              <Label>Tags</Label>
              <div className="mt-2">
                <MultiSelect
                  options={tags.map(tag => ({ label: tag.name, value: tag.id }))}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Select tags..."
                />
              </div>
            </div>

            {/* Options */}
            <div className="border rounded-lg p-4 space-y-3 bg-card">
              <Label>Options</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Featured post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Allow comments</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Image Selector Dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Select {imageSelectorTarget === 'featured' ? 'Featured' : 'Social Share'} Image
            </DialogTitle>
          </DialogHeader>
          <MediaLibrary
            onSelect={handleImageFromLibrary}
            onClose={() => setShowImageSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
