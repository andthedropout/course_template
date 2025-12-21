import { createFileRoute } from '@tanstack/react-router'
import LessonBuilder from '@/pages/courses/LessonBuilder'

export const Route = createFileRoute('/courses/$slug/$lessonSlug')({
  component: LessonBuilder,
  ssr: false, // Client-only for editor (requires auth)
})
