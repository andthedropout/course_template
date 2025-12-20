import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { fetchRelatedPosts, type PostListItem } from '@/api/blog'
import { Icon } from '@/components/ui/icon'

interface RelatedPostsProps {
  currentPostSlug: string
}

export function RelatedPosts({ currentPostSlug }: RelatedPostsProps) {
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRelatedPosts = async () => {
      try {
        const relatedPosts = await fetchRelatedPosts(currentPostSlug)
        setPosts(relatedPosts)
      } catch (error) {
        console.error('Failed to load related posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRelatedPosts()
  }, [currentPostSlug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug: post.slug }}
            className="group block bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {post.featured_image_url && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="Clock" className="h-3 w-3" />
                  {post.reading_time} min read
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Eye" className="h-3 w-3" />
                  {post.view_count}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
