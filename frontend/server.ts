/**
 * Production Bun SSR Server for TanStack Start
 *
 * Based on: https://www.answeroverflow.com/m/1420484044466159616
 * Credits: Magnus (adverse-sapphire) & notKamui (exotic-emerald) from TanStack Discord
 *
 * Features:
 * - Pre-loads static assets into memory for performance
 * - Lazy loads large files from disk
 * - Generates ETags for caching
 * - Optional gzip compression
 * - Serves SSR-rendered pages from TanStack Start
 */

import { join } from 'path'
import { readdir } from 'fs/promises'
import { createHash } from 'crypto'

// Configuration
// When server.js runs from /app/frontend/dist/server.js, paths are relative to /app/frontend/dist/
const CLIENT_DIR = '.'  // Assets are in the same directory as server.js
const SERVER_ENTRY = './ssr.tsx'  // SSR entry point (not used for client-side routing)
const PORT = parseInt(process.env.PORT || '3000', 10)

// Asset loading configuration
const MAX_ASSET_SIZE = 5 * 1024 * 1024 // 5MB - assets larger than this are lazy-loaded
const ENABLE_GZIP = true
const ENABLE_ETAGS = true
const GZIP_THRESHOLD = 1024 // Only gzip assets larger than 1KB

interface Asset {
  content: Buffer | null // null = lazy load from disk
  type: string
  etag?: string
  gzipped?: Buffer
  path?: string // for lazy loading
}

interface ServerHandler {
  default: {
    fetch: (request: Request) => Promise<Response> | Response
  }
}

// Asset cache
const assets = new Map<string, Asset>()

/**
 * Generate ETag from content
 */
function generateETag(content: Buffer): string {
  return `"${createHash('md5').update(content).digest('hex')}"`
}

/**
 * Gzip compress content
 */
async function gzipContent(content: Buffer): Promise<Buffer> {
  return Bun.gzipSync(content)
}

/**
 * Load all static assets into memory
 */
async function loadStaticAssets() {
  console.log(`📦 Loading static assets from ${CLIENT_DIR}...`)

  const files = await readdir(CLIENT_DIR, { recursive: true })
  let memoryLoaded = 0
  let diskLoaded = 0

  for (const relativePath of files) {
    const filepath = join(CLIENT_DIR, relativePath)
    const file = Bun.file(filepath)

    // Check if it's a file (not directory)
    if (!(await file.exists()) || file.size === 0) continue

    // Normalize route path for URL matching
    const route = `/${relativePath.split('\\').join('/')}`

    const fileSize = file.size
    const shouldLoadInMemory = fileSize <= MAX_ASSET_SIZE

    if (shouldLoadInMemory) {
      // Load small files into memory
      const content = Buffer.from(await file.arrayBuffer())
      const asset: Asset = {
        content,
        type: file.type || 'application/octet-stream',
      }

      // Generate ETag
      if (ENABLE_ETAGS) {
        asset.etag = generateETag(content)
      }

      // Gzip if beneficial
      if (ENABLE_GZIP && content.length > GZIP_THRESHOLD) {
        asset.gzipped = await gzipContent(content)
      }

      assets.set(route, asset)
      memoryLoaded++
    } else {
      // Store reference for lazy loading
      assets.set(route, {
        content: null,
        type: file.type || 'application/octet-stream',
        path: filepath,
      })
      diskLoaded++
    }
  }

  console.log(`✅ Loaded ${memoryLoaded} assets into memory, ${diskLoaded} assets will be lazy-loaded`)
}

/**
 * Serve static asset from memory or disk
 */
function serveAsset(request: Request, route: string): Response | null {
  const asset = assets.get(route)
  if (!asset) return null

  const url = new URL(request.url)
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  const ifNoneMatch = request.headers.get('if-none-match')

  // Handle ETag cache validation
  if (ENABLE_ETAGS && asset.etag && ifNoneMatch === asset.etag) {
    return new Response(null, { status: 304 })
  }

  const headers = new Headers({
    'Content-Type': asset.type,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  if (asset.etag) {
    headers.set('ETag', asset.etag)
  }

  // Serve from memory
  if (asset.content) {
    // Serve gzipped version if available and accepted
    if (asset.gzipped && acceptEncoding.includes('gzip')) {
      headers.set('Content-Encoding', 'gzip')
      return new Response(asset.gzipped, { headers })
    }

    return new Response(asset.content, { headers })
  }

  // Lazy load from disk
  if (asset.path) {
    const file = Bun.file(asset.path)
    return new Response(file, { headers })
  }

  return null
}

/**
 * Main server handler
 */
async function startServer() {
  // Load static assets into memory
  await loadStaticAssets()

  console.log(`🚀 Starting static file server on port ${PORT}...`)

  // Read index.html once at startup
  const indexHtml = await Bun.file(join(CLIENT_DIR, 'index.html')).text()

  Bun.serve({
    port: PORT,
    async fetch(request) {
      const url = new URL(request.url)

      // Try to serve static asset first
      const staticResponse = serveAsset(request, url.pathname)
      if (staticResponse) {
        return staticResponse
      }

      // For all other routes, serve index.html (client-side routing)
      return new Response(indexHtml, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    },
  })

  console.log(`✅ Server running at http://localhost:${PORT}`)
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
