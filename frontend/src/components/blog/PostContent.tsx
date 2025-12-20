import { useEffect } from 'react'

interface Component {
  id: string
  type: string
  data: string
}

interface PostContentProps {
  html: string
  components: Component[]
}

export function PostContent({ html, components }: PostContentProps) {
  useEffect(() => {
    // Replace placeholder divs with actual React components
    components.forEach(component => {
      const element = document.getElementById(component.id)
      if (!element) return

      // Render component based on type
      switch (component.type) {
        case 'youtube':
          renderYouTube(element, component.data)
          break
        case 'image':
          renderImage(element, component.data)
          break
        // Add more component types as needed
      }
    })
  }, [components])

  return (
    <div
      className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-code:text-primary"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function renderYouTube(element: HTMLElement, videoId: string) {
  element.innerHTML = `
    <div class="aspect-video rounded-lg overflow-hidden my-6">
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube-nocookie.com/embed/${videoId}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="w-full h-full"
      ></iframe>
    </div>
  `
}

function renderImage(element: HTMLElement, src: string) {
  const [url, alt] = src.split('|alt=')
  element.innerHTML = `
    <img
      src="${url}"
      alt="${alt || ''}"
      loading="lazy"
      class="w-full rounded-lg my-6"
    />
  `
}
