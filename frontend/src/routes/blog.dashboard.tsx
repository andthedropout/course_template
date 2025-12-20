import { createFileRoute } from '@tanstack/react-router'
import BlogDashboard from '@/pages/blog/BlogDashboard'

export const Route = createFileRoute('/blog/dashboard')({
  component: BlogDashboard,
  ssr: false, // Client-only for dashboard (requires auth)
})
