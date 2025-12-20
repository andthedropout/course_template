import { useState, useMemo, useEffect } from 'react'
import { useLoaderData } from '@tanstack/react-router'
import { PostCard } from '@/components/blog/PostCard'
import { SEO } from '@/components/SEO'
import PageWrapper from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { fetchCategories, fetchTags, type Category, type Tag } from '@/api/blog'
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

export default function BlogList() {
  const { posts } = useLoaderData({ from: '/blog/' })
  const { user, isAuthenticated } = useAuth()
  const isStaff = isAuthenticated && user?.is_staff
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // Fetch categories and tags
  useEffect(() => {
    const loadFilters = async () => {
      const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()])
      setCategories(cats)
      setTags(tgs)
    }
    loadFilters()
  }, [])

  // Filter posts based on search and filters
  const filteredPosts = useMemo(() => {
    if (!posts) return []

    return posts.filter(post => {
      // Search filter (title, excerpt, content)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          post.title.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory) {
        const hasCategory = post.categories?.some(cat => cat.slug === selectedCategory)
        if (!hasCategory) return false
      }

      // Tag filter
      if (selectedTag) {
        const hasTag = post.tags?.some(tag => tag.slug === selectedTag)
        if (!hasTag) return false
      }

      return true
    })
  }, [posts, searchQuery, selectedCategory, selectedTag])

  // Calculate pagination
  const totalPages = Math.ceil((filteredPosts?.length || 0) / POSTS_PER_PAGE)
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE
  const endIndex = startIndex + POSTS_PER_PAGE
  const currentPosts = useMemo(
    () => filteredPosts?.slice(startIndex, endIndex) || [],
    [filteredPosts, startIndex, endIndex]
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedTag])

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <PageWrapper>
      <SEO
        title="Blog - GaggleHome"
        description="Read the latest articles about web development, technology, and more"
        type="website"
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover articles about web development, AI, and the latest in technology
          </p>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category and Tag Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Category Pills */}
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              All Categories
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.slug}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {cat.name}
              </Button>
            ))}

            {/* Divider */}
            {tags.length > 0 && <div className="w-px bg-border" />}

            {/* Tag Pills */}
            {tags.map(tag => (
              <Button
                key={tag.slug}
                variant={selectedTag === tag.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag.slug)}
              >
                #{tag.name}
              </Button>
            ))}

            {/* Clear Filters */}
            {(searchQuery || selectedCategory || selectedTag) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  setSelectedTag('')
                }}
              >
                <Icon name="X" className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-center text-sm text-muted-foreground">
            Showing {currentPosts.length} of {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Posts Grid */}
        {currentPosts && currentPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {currentPosts.map((post) => (
                <PostCard key={post.id} post={post} showStatus={isStaff} showEditButton={isStaff} />
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
            <p className="text-muted-foreground">No posts found.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
