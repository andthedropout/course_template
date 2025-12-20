import { useEffect } from 'react'
import { SEO } from '@/components/SEO'
import type { PostDetail } from '@/api/blog'

interface BlogSEOProps {
  post: PostDetail
}

export function BlogSEO({ post }: BlogSEOProps) {
  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt
  const image = post.og_image_url || post.featured_image_url

  useEffect(() => {
    // Add JSON-LD structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'

    // Calculate word count from content
    const wordCount = post.content_parsed?.html
      ? post.content_parsed.html.replace(/<[^>]*>/g, '').split(/\s+/).length
      : 0

    // Build canonical URL
    const canonicalUrl = post.canonical_url || `${window.location.origin}/blog/${post.slug}`

    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': canonicalUrl,
      headline: post.title,
      description: description,
      image: image ? [image] : undefined,
      datePublished: post.publish_date,
      dateModified: post.updated_at,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      wordCount: wordCount,
      publisher: {
        '@type': 'Organization',
        name: 'GaggleHome',
        // Only include logo if it exists
        // logo: {
        //   '@type': 'ImageObject',
        //   url: 'https://gagglehome.com/logo.png'
        // }
      },
    }

    // Only add author if it exists
    if (post.author) {
      structuredData.author = {
        '@type': 'Person',
        name: post.author.name,
        url: post.author.username ? `${window.location.origin}/author/${post.author.username}` : undefined,
      }
    }

    // Add article sections (categories)
    if (post.categories && post.categories.length > 0) {
      structuredData.articleSection = post.categories.map(cat => cat.name)
    }

    // Add keywords (tags)
    if (post.tags && post.tags.length > 0) {
      structuredData.keywords = post.tags.map(tag => tag.name).join(', ')
    }

    script.text = JSON.stringify(structuredData)

    document.head.appendChild(script)

    return () => {
      // Cleanup: remove the script when component unmounts
      document.head.removeChild(script)
    }
  }, [post, image, description])

  return (
    <SEO
      title={title}
      description={description}
      ogImage={image || undefined}
      type="article"
    />
  )
}
