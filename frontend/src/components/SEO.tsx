import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  type?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string
  twitterCreator?: string
}

export function SEO({
  title = 'My App',
  description = 'Welcome to my application',
  keywords,
  type = 'website',
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title
    }

    // Add DNS prefetch for external resources (performance optimization)
    const addDnsPrefetch = (href: string) => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = href
        document.head.appendChild(link)
      }
    }

    // Prefetch domains for any external resources in OG images
    if (ogImage) {
      try {
        const imageUrl = new URL(ogImage)
        if (imageUrl.hostname !== window.location.hostname) {
          addDnsPrefetch(`//${imageUrl.hostname}`)
        }
      } catch {
        // Invalid URL, skip prefetch
      }
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name'
      let element = document.querySelector(`meta[${attribute}="${name}"]`)

      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }

      element.setAttribute('content', content)
    }

    // Standard meta tags
    if (description) updateMetaTag('description', description)
    if (keywords) updateMetaTag('keywords', keywords)

    // Open Graph tags
    updateMetaTag('og:type', type, true)
    updateMetaTag('og:title', ogTitle || title, true)
    updateMetaTag('og:description', ogDescription || description, true)
    if (ogImage) updateMetaTag('og:image', ogImage, true)
    if (ogUrl) updateMetaTag('og:url', ogUrl, true)

    // Twitter tags
    updateMetaTag('twitter:card', twitterCard)
    updateMetaTag('twitter:title', ogTitle || title)
    updateMetaTag('twitter:description', ogDescription || description)
    if (ogImage) updateMetaTag('twitter:image', ogImage)
    if (twitterSite) updateMetaTag('twitter:site', twitterSite)
    if (twitterCreator) updateMetaTag('twitter:creator', twitterCreator)
  }, [title, description, keywords, type, ogTitle, ogDescription, ogImage, ogUrl, twitterCard, twitterSite, twitterCreator])

  return null
}
