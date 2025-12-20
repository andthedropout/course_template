import { createFileRoute } from '@tanstack/react-router'
import BlogPost from '@/pages/blog/BlogPost'
import { fetchPost } from '@/api/blog'

export const Route = createFileRoute('/blog/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)
    return { post }
  },
  component: BlogPost,
})
