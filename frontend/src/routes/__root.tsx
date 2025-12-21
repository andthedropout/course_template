import type { ReactNode } from 'react'
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { AppSidebar } from '@/components/app/AppSidebar'
import { AppTopBar } from '@/components/app/AppTopBar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChatProvider } from '@/contexts/ChatContext'
import { AIChatPanel } from '@/components/chat/AIChatSidebar'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Django React Start',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const { isLoading, fontsReady } = useTheme()
  const { user } = useAuth()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const isCheckout = pathname === '/checkout'
  const isHome = pathname === '/'
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/logout'
  const showSidebar = user && !isCheckout && !isHome && !isAuthPage

  const contentReady = !isLoading && fontsReady

  // Checkout: no header, no sidebar
  if (isCheckout) {
    return (
      <>
        <style>{`
          .font-loading { opacity: 0; visibility: hidden; }
          .font-ready { opacity: 1; visibility: visible; transition: opacity 0.2s ease-out; }
        `}</style>
        <div className={`min-h-screen bg-background ${contentReady ? 'font-ready' : 'font-loading'}`}>
          {children}
        </div>
      </>
    )
  }

  // Logged in (except home/checkout/auth pages): show sidebar layout
  if (showSidebar) {
    return (
      <>
        <style>{`
          .font-loading { opacity: 0; visibility: hidden; }
          .font-ready { opacity: 1; visibility: visible; transition: opacity 0.2s ease-out; }
        `}</style>
        <div className={`min-h-screen bg-background ${contentReady ? 'font-ready' : 'font-loading'}`}>
          <ChatProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="flex flex-col">
                <AppTopBar />
                <div className="flex flex-1 overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                  </main>
                  <AIChatPanel />
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ChatProvider>
        </div>
      </>
    )
  }

  // Home page or not logged in: show public header
  return (
    <>
      <style>{`
        .font-loading { opacity: 0; visibility: hidden; }
        .font-ready { opacity: 1; visibility: visible; transition: opacity 0.2s ease-out; }
      `}</style>
      <div
        className={`min-h-screen bg-background flex flex-col ${contentReady ? 'font-ready' : 'font-loading'}`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  )
}
