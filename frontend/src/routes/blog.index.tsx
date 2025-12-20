import { createFileRoute } from '@tanstack/react-router'
import BlogList from '@/pages/blog/BlogList'
import { fetchPosts } from '@/api/blog'

export const Route = createFileRoute('/blog/')({
  ssr: true,
  loader: async () => {
    const posts = await fetchPosts()
    return { posts }
  },
  component: BlogList,
})
