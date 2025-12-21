import { createFileRoute } from '@tanstack/react-router'
import CourseDashboard from '@/pages/courses/CourseDashboard'

export const Route = createFileRoute('/courses/dashboard')({
  component: CourseDashboard,
  ssr: false, // Client-only for dashboard (requires auth)
})
