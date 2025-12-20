import type { ReactNode } from 'react'
import { createRootRoute, Outlet, Scripts, HeadContent } from '@tanstack/react-router'
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

  // CSS-based loading: content is always rendered (for SSR/SEO) but hidden until fonts ready
  // This prevents hydration mismatches and eliminates the flash
  const contentReady = !isLoading && fontsReady

  return (
    <html>
      <head>
        <HeadContent />
        <style>{`
          /* Hide content with CSS until fonts are ready - prevents FOUT */
          .font-loading {
            opacity: 0;
            visibility: hidden;
          }
          .font-ready {
            opacity: 1;
            visibility: visible;
            transition: opacity 0.2s ease-out;
          }
        `}</style>
      </head>
      <body>
        <div
          className={`min-h-screen bg-background flex flex-col ${contentReady ? 'font-ready' : 'font-loading'}`}
        >
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
