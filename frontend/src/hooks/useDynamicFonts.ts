import { useEffect, useState } from 'react';

// Font name normalization for fontsource URLs
const normalizeFontName = (fontName: string): string => {
  return fontName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// Check if font is a web font that needs loading
const isWebFont = (fontName: string): boolean => {
  const systemFonts = [
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', '-apple-system', 'blinkmacsystemfont',
    'arial', 'helvetica', 'times', 'courier', 'verdana',
    'ui-sans-serif', 'ui-monospace', 'ui-serif',
    // Common serif fonts
    'georgia', 'times new roman', 'cambria',
    // Common sans-serif fonts
    'arial', 'calibri', 'segoe ui', 'tahoma',
    // Common monospace fonts
    'courier new', 'consolas', 'monaco'
  ];

  const normalizedFont = fontName.toLowerCase().trim();

  return !systemFonts.some(sysFont =>
    normalizedFont === sysFont || normalizedFont.includes(sysFont)
  );
};

// Cache for loaded fonts to avoid duplicates
const loadedFonts = new Set<string>();
const preloadedFonts = new Set<string>();
const fontLoadingPromises = new Map<string, Promise<void>>();

// Load font and return promise (non-blocking)
const preloadFont = (fontName: string): Promise<void> => {
  const normalizedName = normalizeFontName(fontName);

  if (preloadedFonts.has(normalizedName)) {
    return fontLoadingPromises.get(normalizedName) || Promise.resolve();
  }

  preloadedFonts.add(normalizedName);

  // Try Google Fonts first (has all weights), fallback to Fontsource
  // Fire and forget - don't block rendering
  const promise = loadFontWithSwap(fontName, true).catch(() => {
    return loadFontWithSwap(fontName, false);
  }).catch(() => {
  });

  fontLoadingPromises.set(normalizedName, promise);

  // Immediately mark as "loaded" to not block rendering
  loadedFonts.add(normalizedName);

  return Promise.resolve();
};

const loadFontWithSwap = (fontName: string, useGoogleFonts = false): Promise<void> => {
  const normalizedName = normalizeFontName(fontName);

  if (loadedFonts.has(normalizedName)) {
    return Promise.resolve();
  }

  // Return existing promise if already loading
  if (fontLoadingPromises.has(normalizedName)) {
    return fontLoadingPromises.get(normalizedName)!;
  }

  const loadingPromise = new Promise<void>((resolve, reject) => {
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';

      // Check for locally downloaded fonts first (from build-time download script)
      const localFontPath = `/static/fonts/${normalizedName}/font.css`;

      // Try local font first, fallback to CDN
      if (useGoogleFonts) {
        link.href = localFontPath;
        link.setAttribute('data-font-loader', 'local');

        // Fallback to Google Fonts CDN if local font fails to load
        link.onerror = () => {
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
          link.setAttribute('data-font-loader', 'google-fonts');
        };
      } else {
        link.href = `https://cdn.jsdelivr.net/npm/@fontsource/${normalizedName}@latest/index.css`;
        link.setAttribute('data-font-loader', 'fontsource');
      }

      link.setAttribute('data-font-name', normalizedName);

      // Add font-display swap for better performance - allows fallback fonts while loading
      if (!useGoogleFonts) {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: '${fontName}';
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }

      link.onload = () => {
        // Don't block - just mark as loaded when CSS is ready
        loadedFonts.add(normalizedName);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load font: ${fontName}`));
      };

      document.head.appendChild(link);

    } catch (error) {
      console.error(`Error loading font ${fontName}:`, error);
      reject(error);
    }
  });

  fontLoadingPromises.set(normalizedName, loadingPromise);
  return loadingPromise;
};

// Extract fonts from current theme only
const getThemeFonts = (fontVariables: Record<string, string>): string[] => {
  const themeFonts = new Set<string>();

  Object.entries(fontVariables).forEach(([key, value]) => {
    if (key.startsWith('font-') && typeof value === 'string') {
      const fontFamily = value.split(',')[0].trim().replace(/['"]/g, '');

      if (fontFamily) {
        const isWeb = isWebFont(fontFamily);

        if (isWeb) {
          themeFonts.add(fontFamily);
        }
      }
    }
  });

  return Array.from(themeFonts);
};

// Initialize font preloading for specific theme (non-blocking)
export const initializeFontPreloading = async (fontVariables: Record<string, string>): Promise<void> => {
  const fontsToPreload = getThemeFonts(fontVariables);

  // Fire and forget - start loading fonts but don't wait
  fontsToPreload.forEach((font) => {
    preloadFont(font).catch((error) => {
    });
  });

  // Return immediately - fonts load in background
  return Promise.resolve();
};

export const useDynamicFonts = (fontVariables: Record<string, string>) => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const themeFonts = getThemeFonts(fontVariables);

    if (themeFonts.length === 0) {
      setFontsReady(true);
      return;
    }

    // Since we immediately mark fonts as "loaded" in preloadFont,
    // we can set ready immediately without polling
    setFontsReady(true);
  }, [fontVariables]);

  return {
    fontsReady,
    loadedFonts: Array.from(loadedFonts)
  };
};
