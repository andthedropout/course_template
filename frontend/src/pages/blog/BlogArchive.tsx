import { useState, useMemo, useEffect } from 'react'
import { useLoaderData } from '@tanstack/react-router'
import { PostCard } from '@/components/blog/PostCard'
import { SEO } from '@/components/SEO'
import PageWrapper from '@/components/layout/PageWrapper'
import type { Category, Tag } from '@/api/blog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

const POSTS_PER_PAGE = 9

export default function BlogArchive() {
  const data = useLoaderData({ strict: false })
  const [currentPage, setCurrentPage] = useState(1)

  // Type-safe data access
  const posts = data?.posts || []
  const type = data?.type as 'category' | 'tag'
  const archive = (data?.category || data?.tag) as Category | Tag

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const currentPosts = useMemo(
    () => posts.slice(startIndex, endIndex),
    [posts, startIndex, endIndex]
  )

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  // Determine title and description based on type
  const title = type === 'category'
    ? `${archive.name} Articles`
    : `Posts tagged "${archive.name}"`

  const description = type === 'category' && 'description' in archive
    ? archive.description
    : `Browse all posts tagged with ${archive.name}`

  const postCount = 'post_count' in archive ? archive.post_count : posts.length

  // Add Breadcrumb schema
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: window.location.origin
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${window.location.origin}/blog`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: archive.name,
          item: window.location.href
        }
      ]
    }

    script.text = JSON.stringify(breadcrumbSchema)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [archive])

  return (
    <PageWrapper>
      <SEO
        title={`${title} - Blog`}
        description={description}
        type="website"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Archive Header */}
        <header className="mb-12 text-center">
          <div className="inline-block mb-3">
            <span className="text-sm font-medium text-primary uppercase tracking-wide">
              {type === 'category' ? 'Category' : 'Tag'}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{archive.name}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            {description}
          </p>
          <p className="text-sm text-muted-foreground">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </p>
        </header>

        {/* Posts Grid */}
        {currentPosts && currentPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {currentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts found in this {type}.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
