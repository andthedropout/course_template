import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/components/app';

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    // Check if user is authenticated
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw redirect({
        to: '/login',
        search: { redirect: '/app/dashboard' },
      });
    }
  },
  component: AppLayout,
});
