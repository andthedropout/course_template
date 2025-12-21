import { createFileRoute } from '@tanstack/react-router';
import MyCourses from '@/pages/app/MyCourses';

export const Route = createFileRoute('/app/courses')({
  component: MyCourses,
});
