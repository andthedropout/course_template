import { Link } from '@tanstack/react-router'
import type { PostListItem } from '@/api/blog'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'

interface PostCardProps {
  post: PostListItem
  showStatus?: boolean
  showEditButton?: boolean
}

export function PostCard({ post, showStatus = false, showEditButton = false }: PostCardProps) {
  const statusConfig = {
    draft: {
      color: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
      icon: 'FileText' as const,
      label: 'Draft'
    },
    scheduled: {
      color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: 'Clock' as const,
      label: 'Scheduled'
    },
    archived: {
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      icon: 'Archive' as const,
      label: 'Archived'
    },
    published: {
      color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      icon: 'CheckCircle' as const,
      label: 'Published'
    }
  }

  const config = statusConfig[post.status]
  return (
    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col">
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="group flex-1"
      >
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        <CardHeader className="relative px-6">
          {/* Status Badge - Top Right - Only show to staff and only if not published */}
          {showStatus && post.status !== 'published' && (
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.color}`}>
                <Icon name={config.icon} className="h-3 w-3" />
                {config.label}
              </span>
            </div>
          )}

          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors pr-20">
            {post.title}
          </h3>
        </CardHeader>

        <CardContent className="px-6">
          <p className="text-muted-foreground mb-4">{post.excerpt}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author_name}</span>
            <span>•</span>
            <span>{new Date(post.publish_date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{post.reading_time} min read</span>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="flex items-center justify-between gap-4 pt-0 px-6">
        {post.categories?.length > 0 && (
          <div className="flex gap-2 flex-wrap flex-1">
            {post.categories.map(cat => (
              <span key={cat.slug} className="text-xs bg-secondary px-2 py-1 rounded">
                {cat.name}
              </span>
            ))}
          </div>
        )}
        {showEditButton && (
          <Link
            to="/blog/edit/$slug"
            params={{ slug: post.slug }}
            className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="Edit" className="h-3 w-3" />
            Edit
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
