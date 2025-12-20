import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  type: string; // filename without .svg extension
  opacity?: number;
  size?: 'cover' | 'tile'; // How to scale the background
  tileSize?: number; // Tile size in pixels (for tile mode)
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  animateBackground?: boolean; // Enable background animation
  animateContent?: boolean; // Enable content animation with stagger
  backgroundDelay?: number; // Delay for background animation
  contentDelay?: number; // Delay for content animation
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  type,
  opacity = 0.6, // Default opacity, will be used from Home.tsx or this default
  size = 'cover', // Default to cover (stretch to fill)
  tileSize = 800, // Default to 800px tiles
  className = '',
  children,
  style,
  animateBackground = true, // Background fades in by default
  animateContent = true, // Content animates in by default
  backgroundDelay = 0.2, // Background starts AFTER content
  contentDelay = 0, // Content starts immediately
}) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const loadSvgContent = async () => {
      if (!type) return;

      const svgUrl = `/static/images/backgrounds/${type}.svg`;

      try {
        const response = await fetch(svgUrl);

        if (response.ok) {
          let content = await response.text();

          // Remove existing style attribute from SVG tag to prevent conflicts with injected styles
          content = content.replace(/<svg([^>]+)style="[^"]*"([^>]*)>/g, '<svg$1$2>');
          // Remove any inline background declarations within the SVG itself
          content = content.replace(/background:[^;\s"']*/gi, '');
          content = content.replace(/background-color:[^;\s"']*/gi, '');
          // Remove width and height attributes to prevent stretching
          content = content.replace(/\s+width="[^"]*"/g, '');
          content = content.replace(/\s+height="[^"]*"/g, '');

          // Set preserveAspectRatio - always use slice for cover mode
          const preserveAspect = 'xMidYMid slice';
          if (content.includes('preserveAspectRatio')) {
            content = content.replace(/preserveAspectRatio="[^"]*"/g, `preserveAspectRatio="${preserveAspect}"`);
          } else {
            content = content.replace('<svg', `<svg preserveAspectRatio="${preserveAspect}"`);
          }

          // Replace CSS variables with actual visible colors - use split/join for reliability
          content = content.split('var(--primary)').join('rgba(100, 150, 255, 0.8)');
          content = content.split('var(--secondary)').join('rgba(150, 200, 255, 0.6)');

          setSvgContent(content);
        }
      } catch (error) {
        console.error(`AnimatedBackground error:`, error);
      }
    };

    loadSvgContent();
  }, [type, size]);

  const BackgroundWrapper = animateBackground ? motion.div : 'div';
  const ContentWrapper = animateContent ? motion.div : 'div';

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Animated SVG Background - Inline for animations to work */}
      {svgContent && (
        <BackgroundWrapper
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            opacity,
          }}
          {...(animateBackground && {
            initial: { opacity: 0 },
            animate: { opacity },
            transition: { duration: 0.4, delay: backgroundDelay },
          })}
        >
          {size === 'tile' ? (
            // Tile mode - use background-image with repeat at custom size
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${tileSize}px ${tileSize}px`, // Custom tile size in pixels
                backgroundPosition: 'top left',
              }}
            />
          ) : (
            // Cover mode - use inline SVG with transform
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{
                __html: svgContent.replace(
                  '<svg',
                  '<svg style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 100%; min-height: 100%; width: auto; height: auto; display: block !important; visibility: visible !important; background-color: transparent !important; overflow: visible !important;" class="w-full h-full"'
                )
              }}
            />
          )}
        </BackgroundWrapper>
      )}

      {/* Content */}
      <ContentWrapper
        className="relative z-10"
        {...(animateContent && {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.2, delay: contentDelay, ease: 'easeOut' },
        })}
      >
        {children}
      </ContentWrapper>
    </div>
  );
};

export default AnimatedBackground; 