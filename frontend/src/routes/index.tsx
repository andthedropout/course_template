import { createFileRoute } from '@tanstack/react-router'
import Home from '@/pages/static/Home'

const SSR_ENABLED = false  // ❌ SSR is DISABLED for this route (client-only rendering)

function HomeWrapper() {
  return <Home />
}

export const Route = createFileRoute('/')({
  ssr: SSR_ENABLED,
  component: HomeWrapper,
  head: () => ({
    meta: [
      {
        name: 'description',
        content: 'Your clean Django + React starter template - build modern web applications with ease',
      },
      {
        name: 'keywords',
        content: 'django, react, vite, starter template, web development',
      },
      {
        property: 'og:title',
        content: 'Welcome | My App',
      },
      {
        property: 'og:description',
        content: 'Your clean Django + React starter template',
      },
    ],
  }),
})