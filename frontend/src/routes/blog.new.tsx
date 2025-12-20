import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/blog/new')({
  component: lazyRouteComponent(() => import('@/pages/blog/BlogEditor')),
  ssr: false, // Client-only for editor (requires auth)
})
