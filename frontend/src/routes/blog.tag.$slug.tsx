import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts, fetchTags, type Tag } from '@/api/blog'
import BlogArchive from '@/pages/blog/BlogArchive'

export const Route = createFileRoute('/blog/tag/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    const { slug } = params

    // Fetch all tags to find the current one
    const tags = await fetchTags()
    const tag = tags.find(t => t.slug === slug)

    if (!tag) {
      throw new Error('Tag not found')
    }

    // Fetch posts filtered by tag
    const posts = await fetchPosts({ tag: slug })

    return { posts, tag, type: 'tag' as const }
  },
  component: BlogArchive,
})
