import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AIChatToggle } from '@/components/chat/AIChatSidebar';

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Icon name="Bell" className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <CartDrawer />
        <AIChatToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
