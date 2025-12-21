import { createFileRoute } from '@tanstack/react-router';
import CoursePlayer from '@/pages/app/CoursePlayer';

export const Route = createFileRoute('/app/courses/$slug')({
  component: CoursePlayer,
});
