import type { ReactNode } from 'react'
import { createRootRoute, Outlet, Scripts, HeadContent, useRouterState } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { Header } from '@/components/layout/Header'

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
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const hideHeader = pathname === '/checkout' || pathname.startsWith('/app')

  const contentReady = !isLoading && fontsReady

  return (
    <>
      <style>{`
        .font-loading { opacity: 0; visibility: hidden; }
        .font-ready { opacity: 1; visibility: visible; transition: opacity 0.2s ease-out; }
      `}</style>
      <div
        className={`min-h-screen bg-background flex flex-col ${contentReady ? 'font-ready' : 'font-loading'}`}
      >
        {!hideHeader && <Header />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  )
}
