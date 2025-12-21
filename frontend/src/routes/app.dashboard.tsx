import { createFileRoute } from '@tanstack/react-router';
import Dashboard from '@/pages/app/Dashboard';

export const Route = createFileRoute('/app/dashboard')({
  component: Dashboard,
});
