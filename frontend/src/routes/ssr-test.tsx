import { createFileRoute } from '@tanstack/react-router'
import SSRTest from '@/pages/static/SSRTest'

const SSR_ENABLED = true  // ✅ SSR is ENABLED for this route

function SSRTestWrapper() {
  return <SSRTest />
}

export const Route = createFileRoute('/ssr-test')({
  ssr: SSR_ENABLED,
  component: SSRTestWrapper,
})
