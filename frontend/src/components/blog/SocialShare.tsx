import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface SocialShareProps {
  url: string
  title: string
  description?: string
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = description ? encodeURIComponent(description) : ''

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    hackernews: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Share this post</h3>
      <div className="flex flex-wrap gap-2">
        {/* Twitter */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareLinks.twitter, '_blank', 'width=550,height=420')}
        >
          <Icon name="logos:twitter" className="h-4 w-4 mr-2" />
          Twitter
        </Button>

        {/* Facebook */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareLinks.facebook, '_blank', 'width=550,height=420')}
        >
          <Icon name="logos:facebook" className="h-4 w-4 mr-2" />
          Facebook
        </Button>

        {/* LinkedIn */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareLinks.linkedin, '_blank', 'width=550,height=420')}
        >
          <Icon name="logos:linkedin-icon" className="h-4 w-4 mr-2" />
          LinkedIn
        </Button>

        {/* Reddit */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareLinks.reddit, '_blank', 'width=550,height=420')}
        >
          <Icon name="logos:reddit-icon" className="h-4 w-4 mr-2" />
          Reddit
        </Button>

        {/* Hacker News */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(shareLinks.hackernews, '_blank', 'width=550,height=420')}
        >
          <Icon name="simple-icons:ycombinator" className="h-4 w-4 mr-2" />
          HN
        </Button>

        {/* Copy Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
        >
          <Icon name="Link" className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      </div>
    </div>
  )
}
