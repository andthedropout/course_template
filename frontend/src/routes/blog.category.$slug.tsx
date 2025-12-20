import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts, fetchCategories, type Category } from '@/api/blog'
import BlogArchive from '@/pages/blog/BlogArchive'

export const Route = createFileRoute('/blog/category/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    const { slug } = params

    // Fetch all categories to find the current one
    const categories = await fetchCategories()
    const category = categories.find(c => c.slug === slug)

    if (!category) {
      throw new Error('Category not found')
    }

    // Fetch posts filtered by category
    const posts = await fetchPosts({ category: slug })

    return { posts, category, type: 'category' as const }
  },
  component: BlogArchive,
})
