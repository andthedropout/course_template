import { getCSRFToken } from '@/lib/getCookie'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  post_count: number
  parent?: number
  order?: number
}

export interface Tag {
  id: number
  name: string
  slug: string
  post_count: number
}

export interface PostListItem {
  id: number
  title: string
  slug: string
  excerpt: string
  featured_image_url: string | null
  author_name: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publish_date: string
  reading_time: number
  view_count: number
  categories: Category[]
  tags: Tag[]
  featured: boolean
}

export interface PostDetail {
  id: number
  title: string
  slug: string
  content_parsed: {
    html: string
    components: Array<{
      id: string
      type: string
      data: string
    }>
  }
  excerpt: string
  featured_image_url: string | null
  og_image_url: string | null
  full_width_image: boolean
  hero_background_type?: string
  hero_background_opacity?: number
  hero_background_scope?: 'hero' | 'full'
  hero_background_size?: 'cover' | 'tile'
  hero_background_tile_size?: number
  author: {
    name: string
    email: string
    username: string
  }
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publish_date: string
  updated_at: string
  reading_time: number
  view_count: number
  categories: Category[]
  tags: Tag[]
  meta_title: string
  meta_description: string
  meta_keywords: string
  focus_keyword: string
  canonical_url: string
}

export async function fetchPosts(params?: {
  category?: string
  tag?: string
  featured?: boolean
  page?: number
}) {
  const queryParams = new URLSearchParams()
  if (params?.category) queryParams.set('category', params.category)
  if (params?.tag) queryParams.set('tag', params.tag)
  if (params?.featured) queryParams.set('featured', 'true')
  if (params?.page) queryParams.set('page', params.page.toString())

  const response = await fetch(`${API_BASE}/blog/posts/?${queryParams}`)
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  return response.json() as Promise<PostListItem[]>
}

export async function fetchPost(slug: string) {
  const response = await fetch(`${API_BASE}/blog/posts/${slug}/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Failed to fetch post:', response.status, errorData)
    throw new Error(`Failed to fetch post: ${response.status}`)
  }
  return response.json() as Promise<PostDetail>
}

// Fetch post for editing (returns PostWriteResponse with raw content)
export async function fetchPostForEdit(slug: string): Promise<PostWriteResponse> {
  const response = await fetch(`${API_BASE}/blog/posts/${slug}/`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch post for editing')
  }
  return response.json()
}

export async function incrementViewCount(slug: string) {
  try {
    await fetch(`${API_BASE}/blog/posts/${slug}/view/`, { method: 'POST' })
  } catch (error) {
    console.error('Failed to increment view count:', error)
  }
}

export async function fetchRelatedPosts(slug: string) {
  const response = await fetch(`${API_BASE}/blog/posts/${slug}/related/`)
  if (!response.ok) {
    throw new Error('Failed to fetch related posts')
  }
  return response.json() as Promise<PostListItem[]>
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/blog/categories/`)
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  return response.json() as Promise<Category[]>
}

export async function fetchTags() {
  const response = await fetch(`${API_BASE}/blog/tags/`)
  if (!response.ok) {
    throw new Error('Failed to fetch tags')
  }
  return response.json() as Promise<Tag[]>
}

// ============================================================================
// Write Operations (Staff Only)
// ============================================================================

export interface PostCreateData {
  title: string
  content: string
  excerpt?: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publish_date?: string
  featured?: boolean
  allow_comments?: boolean
  category_ids?: number[]
  tag_ids?: number[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  focus_keyword?: string
  canonical_url?: string
  hero_background_type?: string
  hero_background_opacity?: number
  hero_background_scope?: 'hero' | 'full'
  hero_background_size?: 'cover' | 'tile'
  hero_background_tile_size?: number
  full_width_image?: boolean
}

export interface PostUpdateData extends Partial<PostCreateData> {
  featured_image?: File | null
  og_image?: File | null
}

export interface PostWriteResponse {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  featured_image_url: string | null
  og_image_url: string | null
  full_width_image: boolean
  hero_background_type?: string
  hero_background_opacity?: number
  hero_background_scope?: 'hero' | 'full'
  hero_background_size?: 'cover' | 'tile'
  hero_background_tile_size?: number
  status: string
  publish_date: string
  featured: boolean
  allow_comments: boolean
  meta_title: string
  meta_description: string
  meta_keywords: string
  canonical_url: string
  categories: Category[]
  tags: Tag[]
  author_name: string
  reading_time: number
  view_count: number
  created_at: string
  updated_at: string
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const csrfToken = getCSRFToken()
  return {
    'X-CSRFToken': csrfToken || '',
  }
}

// Post CRUD operations
export async function createPost(data: PostCreateData & PostUpdateData): Promise<PostWriteResponse> {
  // Check if we have file uploads
  const hasFeaturedImage = data.featured_image instanceof File
  const hasOgImage = data.og_image instanceof File

  let body: FormData | string
  let headers: HeadersInit

  if (hasFeaturedImage || hasOgImage) {
    // Use FormData for multipart upload
    const formData = new FormData()

    // Add all text fields (exclude featured_image and og_image - we'll handle those separately)
    Object.keys(data).forEach(key => {
      const value = data[key as keyof typeof data]
      if (key !== 'featured_image' && key !== 'og_image' && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    // Add image files with correct field names
    if (hasFeaturedImage) {
      formData.append('featured_image_upload', data.featured_image as File)
    }
    if (hasOgImage) {
      formData.append('og_image_upload', data.og_image as File)
    }

    body = formData
    headers = getAuthHeaders() // Don't set Content-Type for FormData, browser handles it
  } else {
    // Use JSON for regular posts (including when selecting from library)
    body = JSON.stringify(data)
    headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    }
  }

  const response = await fetch(`${API_BASE}/blog/posts/`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create post')
  }

  return response.json()
}

export async function updatePost(slug: string, data: Partial<PostCreateData> & PostUpdateData): Promise<PostWriteResponse> {
  // Check if we have file uploads
  const hasFeaturedImage = data.featured_image instanceof File
  const hasOgImage = data.og_image instanceof File

  let body: FormData | string
  let headers: HeadersInit

  if (hasFeaturedImage || hasOgImage) {
    // Use FormData for multipart upload
    const formData = new FormData()

    // Add all text fields (exclude featured_image and og_image - we'll handle those separately)
    Object.keys(data).forEach(key => {
      const value = data[key as keyof typeof data]
      if (key !== 'featured_image' && key !== 'og_image' && value !== undefined) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })

    // Add image files with correct field names
    if (hasFeaturedImage) {
      formData.append('featured_image_upload', data.featured_image as File)
    }
    if (hasOgImage) {
      formData.append('og_image_upload', data.og_image as File)
    }

    body = formData
    headers = getAuthHeaders() // Don't set Content-Type for FormData, browser handles it
  } else {
    // Use JSON for regular posts (including when selecting from library)
    body = JSON.stringify(data)
    headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    }
  }

  const response = await fetch(`${API_BASE}/blog/posts/${slug}/`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update post')
  }

  return response.json()
}

export async function deletePost(slug: string): Promise<void> {
  const response = await fetch(`${API_BASE}/blog/posts/${slug}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete post' }))
    throw new Error(error.detail || 'Failed to delete post')
  }
}

// Fetch user's drafts
export async function fetchMyDrafts(): Promise<PostListItem[]> {
  const response = await fetch(`${API_BASE}/blog/posts/drafts/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch drafts')
  }
  return response.json()
}

// Fetch all posts (staff only)
export async function fetchAllPosts(filters?: {
  status?: string
  author?: string
}): Promise<PostListItem[]> {
  const queryParams = new URLSearchParams()
  if (filters?.status) queryParams.set('status', filters.status)
  if (filters?.author) queryParams.set('author', filters.author)

  const response = await fetch(`${API_BASE}/blog/posts/all_posts/?${queryParams}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch all posts')
  }
  return response.json()
}

// Image management
export interface BlogImage {
  id: number
  url: string
  alt_text: string
  filename: string
  size: number
  created_at: string
}

export async function fetchUploadedImages(): Promise<BlogImage[]> {
  const response = await fetch(`${API_BASE}/blog/images/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch uploaded images')
  }
  return response.json()
}

export async function uploadBlogImage(file: File, altText?: string): Promise<{ url: string; filename: string; size: number; alt_text: string; id: number }> {
  const formData = new FormData()
  formData.append('image', file)
  if (altText) {
    formData.append('alt_text', altText)
  }

  const response = await fetch(`${API_BASE}/blog/upload-image/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload image')
  }

  return response.json()
}

// Category CRUD
export async function createCategory(data: {
  name: string
  description?: string
  parent?: number
}): Promise<Category> {
  const response = await fetch(`${API_BASE}/blog/categories/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create category')
  }

  return response.json()
}

export async function updateCategory(id: number, data: Partial<{
  name: string
  description: string
  parent: number
  order: number
}>): Promise<Category> {
  const response = await fetch(`${API_BASE}/blog/categories/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update category')
  }

  return response.json()
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/blog/categories/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete category' }))
    throw new Error(error.detail || 'Failed to delete category')
  }
}

// Tag CRUD
export async function createTag(data: { name: string }): Promise<Tag> {
  const response = await fetch(`${API_BASE}/blog/tags/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create tag')
  }

  return response.json()
}

export async function updateTag(id: number, data: { name: string }): Promise<Tag> {
  const response = await fetch(`${API_BASE}/blog/tags/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update tag')
  }

  return response.json()
}

export async function deleteTag(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/blog/tags/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete tag' }))
    throw new Error(error.detail || 'Failed to delete tag')
  }
}
