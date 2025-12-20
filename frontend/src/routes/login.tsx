import { createFileRoute } from '@tanstack/react-router'
import Login from '@/pages/auth/Login'

export const Route = createFileRoute('/login')({
  ssr: false,  // CLIENT-ONLY - auth pages typically stay SPA
  component: Login,
})
