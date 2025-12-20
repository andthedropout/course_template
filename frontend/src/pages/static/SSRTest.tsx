import { Link } from '@tanstack/react-router'
import PageWrapper from '@/components/layout/PageWrapper'

export default function SSRTest() {
  const isServer = typeof window === 'undefined'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <PageWrapper>
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                SSR Demo
              </h1>
              <p className="text-lg text-muted-foreground">
                This page has server-side rendering enabled.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">Currently rendering on:</p>
              <code className={`px-3 py-1.5 rounded text-sm font-medium ${isServer ? 'bg-green-500/20 text-green-700' : 'bg-blue-500/20 text-blue-700'}`}>
                {isServer ? 'SERVER' : 'CLIENT'}
              </code>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </PageWrapper>
      </div>
    </div>
  )
}
