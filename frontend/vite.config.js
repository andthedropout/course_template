import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Load env from root directory instead of frontend/
  envDir: '../',
  publicDir: '../public',  // Use root public folder, not frontend/public

  build: {
    // Disable file watching during production builds to prevent infinite loops
    watch: null,
    // Enable aggressive minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        passes: 2, // Run compression twice for better results
      },
      mangle: {
        safari10: true, // Fix Safari 10+ issues
      },
    },
    cssMinify: true,
    // Specify the entry point for TanStack Router (client-side)
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Manual chunking to separate vendor code from app code
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router', '@tanstack/react-start'],
        },
      },
    },
  },

  server: {
    host: true,
    port: parseInt(process.env.VITE_PORT || "3000", 10),
    watch: {
      usePolling: true,
      interval: 500,  // Increased from 100ms - too aggressive polling can miss changes in Docker
      ignored: ['**/src/routeTree.gen.ts'],  // Ignore TanStack Router generated file to prevent infinite loops
    },
    hmr: {
      overlay: true,
      clientPort: 5173,
      protocol: 'ws',
    },
    middlewareMode: false,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://web:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          "*": ""
        }
      },
      '/admin': {
        target: 'http://web:8000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://web:8000',
        changeOrigin: true,
      },
    }
  },

  plugins: [
    // Completely skip TanStack Start plugin if:
    // - DISABLE_ROUTE_GEN is set (Docker environment)
    // - OR building for production (use pre-generated routeTree.gen.ts from git)
    ...(process.env.DISABLE_ROUTE_GEN || mode === 'production' ? [] : [
      tanstackStart({
        router: {
          autoCodeSplitting: true,
          generatedRouteTree: 'routeTree.gen.ts',
        },
        enableRouteGeneration: true,
      }),
    ]),
    react(),
    {
      name: 'no-cache',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')
          next()
        })
      },
    },
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
