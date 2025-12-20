import { useState } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
}

export function MarkdownEditor({ value, onChange, onImageUpload }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'markdown' | 'preview' | 'code'>('markdown')

  const handleImageUpload = async () => {
    if (!onImageUpload) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const url = await onImageUpload(file)
        // Insert markdown image syntax at cursor
        const imageMarkdown = `![${file.name}](${url})`
        onChange(value + '\n\n' + imageMarkdown)
      } catch (error) {
        console.error('Failed to upload image:', error)
        alert('Failed to upload image. Please try again.')
      }
    }
    input.click()
  }

  const customCommands = [
    ...commands.getCommands(),
    commands.divider,
    {
      name: 'upload-image',
      keyCommand: 'upload-image',
      buttonProps: { 'aria-label': 'Upload image' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 20 20">
          <path
            fill="currentColor"
            d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
          />
        </svg>
      ),
      execute: () => {
        handleImageUpload()
      },
    },
    {
      name: 'youtube-embed',
      keyCommand: 'youtube',
      buttonProps: { 'aria-label': 'Insert YouTube embed' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"
          />
        </svg>
      ),
      execute: (state, api) => {
        const videoId = prompt('Enter YouTube video ID:')
        if (videoId) {
          const embedSyntax = `{{youtube:${videoId}}}`
          api.replaceSelection(embedSyntax)
        }
      },
    },
    {
      name: 'custom-image',
      keyCommand: 'custom-image',
      buttonProps: { 'aria-label': 'Insert custom image component' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          />
        </svg>
      ),
      execute: (state, api) => {
        const imageUrl = prompt('Enter image URL:')
        if (imageUrl) {
          const imageSyntax = `{{image:${imageUrl}}}`
          api.replaceSelection(imageSyntax)
        }
      },
    },
  ]

  return (
    <div className="w-full" data-color-mode="light">
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={viewMode === 'markdown' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('markdown')}
        >
          <Icon name="FileEdit" className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          type="button"
          variant={viewMode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('preview')}
        >
          <Icon name="Eye" className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button
          type="button"
          variant={viewMode === 'code' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('code')}
        >
          <Icon name="Code" className="h-4 w-4 mr-1" />
          Code
        </Button>
      </div>

      {viewMode === 'code' ? (
        <div className="border rounded-md">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[600px] p-4 font-mono text-sm bg-background resize-none focus:outline-none"
            placeholder="Write your content in markdown or HTML..."
          />
        </div>
      ) : (
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={600}
          preview={viewMode === 'preview' ? 'preview' : 'edit'}
          hideToolbar={viewMode === 'preview'}
          commands={customCommands}
          extraCommands={[]}
        />
      )}
    </div>
  )
}
