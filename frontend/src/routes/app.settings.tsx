import { createFileRoute } from '@tanstack/react-router';
import Settings from '@/pages/app/Settings';

export const Route = createFileRoute('/app/settings')({
  component: Settings,
});
