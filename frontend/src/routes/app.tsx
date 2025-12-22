import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    // Skip auth check during SSR
    if (typeof window === 'undefined') return;

    // Check if user is authenticated
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw redirect({
        to: '/login',
        search: { redirect: '/app/dashboard' },
      });
    }
  },
  component: () => <Outlet />,
});
