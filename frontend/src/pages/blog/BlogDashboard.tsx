import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  fetchAllPosts,
  fetchMyDrafts,
  deletePost,
  type PostListItem,
} from '@/api/blog'
import { format } from 'date-fns'

type TabType = 'all' | 'drafts' | 'published' | 'scheduled' | 'archived'
type SortField = 'title' | 'updated' | 'views' | 'created'
type SortDirection = 'asc' | 'desc'

export default function BlogDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [posts, setPosts] = useState<PostListItem[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostListItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPosts, setSelectedPosts] = useState<number[]>([])

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('updated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    title: true,
    categories: true,
    views: true,
    updated: true,
    actions: true,
  })

  // Stats
  const stats = {
    total: posts.length,
    drafts: posts.filter((p) => p.slug?.includes('draft') || !p.publish_date).length,
    published: posts.filter((p) => p.publish_date).length,
    totalViews: posts.reduce((sum, p) => sum + p.view_count, 0),
  }

  // Load posts
  useEffect(() => {
    loadPosts()
  }, [activeTab])

  const loadPosts = async () => {
    setIsLoading(true)
    try {
      let data: PostListItem[]

      if (activeTab === 'drafts') {
        data = await fetchMyDrafts()
      } else if (activeTab === 'all') {
        data = await fetchAllPosts()
      } else {
        data = await fetchAllPosts({ status: activeTab })
      }

      setPosts(data)
      setFilteredPosts(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and sort posts
  useEffect(() => {
    let filtered = posts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'views':
          aValue = a.view_count
          bValue = b.view_count
          break
        case 'updated':
          aValue = new Date(a.publish_date || a.id).getTime()
          bValue = new Date(b.publish_date || b.id).getTime()
          break
        case 'created':
          aValue = a.id
          bValue = b.id
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredPosts(sorted)
  }, [searchQuery, posts, sortField, sortDirection])

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with desc as default
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  // Handle delete
  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      await deletePost(slug)
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      })
      loadPosts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      })
    }
  }

  // Toggle post selection
  const togglePostSelection = (id: number) => {
    setSelectedPosts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  // Select all posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map((p) => p.id))
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) return

    try {
      const postsToDelete = filteredPosts.filter((p) => selectedPosts.includes(p.id))
      await Promise.all(postsToDelete.map((p) => deletePost(p.slug)))

      toast({
        title: 'Success',
        description: `${selectedPosts.length} posts deleted successfully`,
      })
      setSelectedPosts([])
      loadPosts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete some posts',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Icon name="LayoutDashboard" className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Blog Dashboard</h1>
            </div>
            <Button onClick={() => navigate({ to: '/blog/new' })}>
              <Icon name="Plus" className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon name="FileText" className="h-4 w-4" />
              <span className="text-sm">Total Posts</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon name="FilePenLine" className="h-4 w-4" />
              <span className="text-sm">Drafts</span>
            </div>
            <p className="text-2xl font-bold">{stats.drafts}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon name="FileCheck" className="h-4 w-4" />
              <span className="text-sm">Published</span>
            </div>
            <p className="text-2xl font-bold">{stats.published}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon name="Eye" className="h-4 w-4" />
              <span className="text-sm">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          {(['all', 'drafts', 'published', 'scheduled', 'archived'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectedPosts.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedPosts.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Icon name="Trash2" className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-9 w-64"
              />
            </div>

            {/* Column visibility dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Icon name="Columns" className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.title}
                  onCheckedChange={() => toggleColumn('title')}
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.categories}
                  onCheckedChange={() => toggleColumn('categories')}
                >
                  Categories
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.views}
                  onCheckedChange={() => toggleColumn('views')}
                >
                  Views
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.updated}
                  onCheckedChange={() => toggleColumn('updated')}
                >
                  Updated
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.actions}
                  onCheckedChange={() => toggleColumn('actions')}
                >
                  Actions
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={loadPosts}>
              <Icon name="RefreshCw" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Posts Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                {columnVisibility.title && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Title</span>
                      {sortField === 'title' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.categories && <TableHead>Categories</TableHead>}
                {columnVisibility.views && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Views</span>
                      {sortField === 'views' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.updated && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('updated')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Updated</span>
                      {sortField === 'updated' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.actions && <TableHead className="w-32">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Icon name="Loader2" className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading posts...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Icon name="FileX" className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No posts found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      // Only navigate if clicking on the row itself, not on interactive elements
                      const target = e.target as HTMLElement
                      if (
                        !target.closest('button') &&
                        !target.closest('input') &&
                        !target.closest('a')
                      ) {
                        navigate({ to: `/blog/edit/${post.slug}` })
                      }
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="rounded"
                      />
                    </TableCell>
                    {columnVisibility.title && (
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{post.title}</span>
                            {post.status === 'draft' && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                Draft
                              </span>
                            )}
                            {post.status === 'scheduled' && (
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                                Scheduled
                              </span>
                            )}
                            {post.status === 'archived' && (
                              <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-0.5 rounded">
                                Archived
                              </span>
                            )}
                            {post.featured && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {post.excerpt}
                          </p>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.categories && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.id}
                              className="text-xs bg-muted px-2 py-0.5 rounded"
                            >
                              {cat.name}
                            </span>
                          ))}
                          {post.categories.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.views && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Icon name="Eye" className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{post.view_count.toLocaleString()}</span>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.updated && (
                      <TableCell className="text-sm text-muted-foreground">
                        {post.publish_date ? format(new Date(post.publish_date), 'MMM d, yyyy') : 'Draft'}
                      </TableCell>
                    )}
                    {columnVisibility.actions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate({ to: `/blog/edit/${post.slug}` })}
                          >
                            <Icon name="Pencil" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          >
                            <Icon name="ExternalLink" className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.slug)}
                          >
                            <Icon name="Trash2" className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
