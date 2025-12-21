import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopBar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
