import { createFileRoute } from '@tanstack/react-router';
import LessonView from '@/pages/app/LessonView';

export const Route = createFileRoute('/app/courses/$slug/$lessonSlug')({
  component: LessonView,
});
