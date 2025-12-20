import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { fetchPostForEdit } from '@/api/blog'

export const Route = createFileRoute('/blog/edit/$slug')({
  component: lazyRouteComponent(() => import('@/pages/blog/BlogEditor').then(m => {
    // Wrapper to pass props from loader to lazy-loaded component
    return {
      default: () => {
        const { post } = Route.useLoaderData()
        const { slug } = Route.useParams()

        console.log('📄 [BlogEditorPage] Rendering with data:', {
          slug,
          hasPost: !!post,
          postTitle: post?.title,
          postContentLength: post?.content?.length || 0,
          postContentPreview: post?.content?.substring(0, 100) || '(empty)'
        })

        const BlogEditor = m.default
        return <BlogEditor slug={slug} initialData={post} />
      }
    }
  })),
  ssr: false, // Client-only for editor (requires auth)
  loader: async ({ params }) => {
    // Load post data for editing (includes raw content)
    console.log('🔍 [Route Loader] Fetching post:', params.slug)
    const post = await fetchPostForEdit(params.slug)
    console.log('🔍 [Route Loader] Post fetched:', {
      slug: params.slug,
      title: post.title,
      hasContent: !!post.content,
      contentLength: post.content?.length || 0,
      contentPreview: post.content?.substring(0, 100) || '(empty)',
      allKeys: Object.keys(post)
    })
    return { post }
  },
})
