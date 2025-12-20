import { useEffect } from 'react'
import { useLoaderData, Link } from '@tanstack/react-router'
import { BlogSEO } from '@/components/blog/BlogSEO'
import { PostContent } from '@/components/blog/PostContent'
import { SocialShare } from '@/components/blog/SocialShare'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { StatusBanner } from '@/components/blog/StatusBanner'
import { incrementViewCount } from '@/api/blog'
import PageWrapper from '@/components/layout/PageWrapper'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground'
import { Card, CardContent } from '@/components/ui/card'

export default function BlogPost() {
  const { post } = useLoaderData({ from: '/blog/$slug' })
  const { user } = useAuth()

  useEffect(() => {
    // Increment view count on mount
    incrementViewCount(post.slug)
  }, [post.slug])

  return (
    <PageWrapper>
      <BlogSEO post={post} />

      {/* Status Banner - Only visible to staff - Full width below header */}
      {user?.is_staff && (
        <StatusBanner status={post.status} publishDate={post.publish_date} />
      )}

      {/* Full page background - wraps everything */}
      {post.hero_background_type && post.hero_background_scope === 'full' ? (
        <AnimatedBackground
          type={post.hero_background_type}
          opacity={post.hero_background_opacity || 0.6}
          size={post.hero_background_size || 'cover'}
          tileSize={post.hero_background_tile_size || 800}
        >
          <article className="py-12">
            {/* Back Button + Edit Button (staff only) */}
            <div className="container mx-auto px-4 max-w-4xl mb-6 flex items-center justify-between">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="ArrowLeft" className="h-4 w-4" />
                Back to Blog
              </Link>
              {user?.is_staff && (
                <Link
                  to="/blog/edit/$slug"
                  params={{ slug: post.slug }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                >
                  <Icon name="Edit" className="h-4 w-4" />
                  Edit Post
                </Link>
              )}
            </div>

            <header className="mb-8">
              <div className="container mx-auto px-4 max-w-4xl mb-8 pt-8 text-center">
                <h1 className="text-6xl font-bold">{post.title}</h1>
              </div>

              {/* Featured Image */}
              {post.full_width_image ? (
                <div className="w-full h-[400px] overflow-hidden">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No featured image</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="container mx-auto px-4 max-w-4xl">
                  <div className="w-full aspect-video rounded-lg overflow-hidden">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No featured image</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </header>

            {/* Content - in Card for readability */}
            <div className="container mx-auto px-4 max-w-4xl">
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="pt-8 pb-6 px-8 md:px-12">
                  {/* Title + Metadata at top of content card */}
                  <div className="mb-8 pb-8 border-b">
                    <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                      {post.author && (
                        <>
                          <span>By {post.author.name}</span>
                          <span>•</span>
                        </>
                      )}
                      <time dateTime={post.publish_date}>
                        {new Date(post.publish_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                      <span>•</span>
                      <span>{post.reading_time} min read</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" className="h-4 w-4" />
                        {post.view_count}
                      </span>
                    </div>

                    {/* Categories */}
                    {post.categories?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.categories.map(cat => (
                          <Link
                            key={cat.slug}
                            to="/blog/category/$slug"
                            params={{ slug: cat.slug }}
                            className="text-sm bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {post.content_parsed ? (
                      <PostContent
                        html={post.content_parsed.html}
                        components={post.content_parsed.components}
                      />
                    ) : (
                      <div className="text-muted-foreground italic">No content available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags & Social Share - in Card */}
            <div className="container mx-auto px-4 max-w-4xl mt-8">
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardContent className="py-6 space-y-6 px-8 md:px-12">
                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Link
                            key={tag.slug}
                            to="/blog/tag/$slug"
                            params={{ slug: tag.slug }}
                            className="text-sm bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Share */}
                  <div className={post.tags?.length > 0 ? "pt-6 border-t" : ""}>
                    <h3 className="text-sm font-semibold mb-3">Share this post</h3>
                    <SocialShare
                      url={`${window.location.origin}/blog/${post.slug}`}
                      title={post.title}
                      description={post.excerpt}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Related Posts */}
            <div className="container mx-auto px-4">
              <RelatedPosts currentPostSlug={post.slug} />
            </div>
          </article>
        </AnimatedBackground>
      ) : (
        <article className="py-12">
          {/* Hero background - wraps only header */}
          {post.hero_background_type && post.hero_background_scope === 'hero' ? (
            <AnimatedBackground
              type={post.hero_background_type}
              opacity={post.hero_background_opacity || 0.6}
              size={post.hero_background_size || 'cover'}
              className="mb-8"
            >
              {/* Back Button + Edit Button (staff only) */}
              <div className="container mx-auto px-4 max-w-4xl mb-6 pt-0 flex items-center justify-between">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" className="h-4 w-4" />
                  Back to Blog
                </Link>
                {user?.is_staff && (
                  <Link
                    to="/blog/edit/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                  >
                    <Icon name="Edit" className="h-4 w-4" />
                    Edit Post
                  </Link>
                )}
              </div>

              <header className="pb-12">
                <div className="container mx-auto px-4 max-w-4xl mb-8 pt-8 text-center">
                  <h1 className="text-6xl font-bold">{post.title}</h1>
                </div>

                {/* Featured Image */}
                {post.full_width_image ? (
                  <div className="w-full h-[400px] overflow-hidden">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No featured image</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="container mx-auto px-4 max-w-4xl">
                    <div className="w-full aspect-video rounded-lg overflow-hidden">
                      {post.featured_image_url ? (
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">No featured image</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </header>
            </AnimatedBackground>
          ) : (
            <>
              {/* Back Button + Edit Button (staff only) */}
              <div className="container mx-auto px-4 max-w-4xl mb-6 flex items-center justify-between">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" className="h-4 w-4" />
                  Back to Blog
                </Link>
                {user?.is_staff && (
                  <Link
                    to="/blog/edit/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
                  >
                    <Icon name="Edit" className="h-4 w-4" />
                    Edit Post
                  </Link>
                )}
              </div>

              <header className="mb-8">
                <div className="container mx-auto px-4 max-w-4xl mb-8 pt-8 text-center">
                  <h1 className="text-6xl font-bold">{post.title}</h1>
                </div>

              {/* Featured Image */}
              {post.full_width_image ? (
                <div className="w-full h-[400px] overflow-hidden">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No featured image</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="container mx-auto px-4 max-w-4xl">
                  <div className="w-full aspect-video rounded-lg overflow-hidden">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No featured image</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </header>
            </>
          )}

          {/* Content - in Card for readability */}
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6 px-8 md:px-12">
                {/* Title + Metadata at top of content card */}
                <div className="mb-8 pb-8 border-b">
                  <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                    {post.author && (
                      <>
                        <span>By {post.author.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <time dateTime={post.publish_date}>
                      {new Date(post.publish_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <span>•</span>
                    <span>{post.reading_time} min read</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Eye" className="h-4 w-4" />
                      {post.view_count}
                    </span>
                  </div>

                  {/* Categories */}
                  {post.categories?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {post.categories.map(cat => (
                        <Link
                          key={cat.slug}
                          to="/blog/category/$slug"
                          params={{ slug: cat.slug }}
                          className="text-sm bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blog Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {post.content_parsed ? (
                    <PostContent
                      html={post.content_parsed.html}
                      components={post.content_parsed.components}
                    />
                  ) : (
                    <div className="text-muted-foreground italic">No content available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags & Social Share - in Card */}
          <div className="container mx-auto px-4 max-w-4xl mt-8">
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardContent className="py-6 space-y-6 px-8 md:px-12">
                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link
                          key={tag.slug}
                          to="/blog/tag/$slug"
                          params={{ slug: tag.slug }}
                          className="text-sm bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Share */}
                <div className={post.tags?.length > 0 ? "pt-6 border-t" : ""}>
                  <h3 className="text-sm font-semibold mb-3">Share this post</h3>
                  <SocialShare
                    url={`${window.location.origin}/blog/${post.slug}`}
                    title={post.title}
                    description={post.excerpt}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Posts */}
          <div className="container mx-auto px-4">
            <RelatedPosts currentPostSlug={post.slug} />
          </div>
        </article>
      )}
    </PageWrapper>
  )
}
