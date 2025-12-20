import { createFileRoute } from '@tanstack/react-router'
import Logout from '@/pages/auth/Logout'

export const Route = createFileRoute('/logout')({
  ssr: false,  // CLIENT-ONLY - auth pages typically stay SPA
  component: Logout,
})
