import { createFileRoute } from '@tanstack/react-router'
import CourseBuilder from '@/pages/courses/CourseBuilder'

export const Route = createFileRoute('/courses/$slug/')({
  component: CourseBuilder,
  ssr: false, // Client-only for editor (requires auth)
})
