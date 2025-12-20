import { useEffect, useState } from 'react';
import { ThemeData, apiThemeToThemeData } from '@/lib/themeTypes';
import { useDynamicFonts, initializeFontPreloading } from './useDynamicFonts';
import { themeApi } from '@/api/themes';

// Fallback theme definition
const getFallbackTheme = (): ThemeData => ({
  name: 'fallback',
  display_name: 'Fallback Theme',
  css_vars: {
    theme: {
      'font-sans': 'system-ui, sans-serif',
      'font-serif': 'Georgia, serif',
      'font-mono': 'monospace',
      'radius': '0.375rem'
    },
    light: {
      'background': 'oklch(1.0000 0 0)',
      'foreground': 'oklch(0.15 0 0)',
      'primary': 'oklch(0.6231 0.1880 259.8145)',
      'secondary': 'oklch(0.9670 0.0029 264.5419)',
      'accent': 'oklch(0.9514 0.0250 236.8242)',
      'muted': 'oklch(0.9608 0.0155 264.5380)',
      'card': 'oklch(1.0000 0 0)',
      'border': 'oklch(0.9216 0.0266 264.5312)'
    },
    dark: {
      'background': 'oklch(0.0902 0 0)',
      'foreground': 'oklch(0.9216 0.0266 264.5312)',
      'primary': 'oklch(0.6231 0.1880 259.8145)',
      'secondary': 'oklch(0.1725 0.0118 264.5419)',
      'accent': 'oklch(0.1686 0.0157 236.8242)',
      'muted': 'oklch(0.1412 0.0166 264.5380)',
      'card': 'oklch(0.0902 0 0)',
      'border': 'oklch(0.1725 0.0118 264.5419)'
    }
  }
});

export const useTheme = () => {
  const [themeSettings, setThemeSettings] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightMode, setLightMode] = useState<boolean>(() => {
    // SSR safe: only access localStorage in browser
    if (typeof window === 'undefined') return true; // default to light mode on server

    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme-mode');
    if (stored) return stored === 'light';
    return !window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Dynamic font loading based on theme variables
  const fontVariables = themeSettings?.css_vars?.theme || {};
  const { fontsReady, loadedFonts } = useDynamicFonts(fontVariables);

  useEffect(() => {
    const loadAndApplyTheme = async () => {
      const useBackendThemes = import.meta.env.VITE_USE_BACKEND_THEMES === 'true';

      // If not using backend themes, load from design-system
      if (!useBackendThemes) {
        setIsLoading(true);
        setError(null);
        const frontendTheme = import.meta.env.VITE_FRONTEND_THEME || 'vercel';

        try {
          // Fetch theme JSON from static assets (works in both dev and prod)
          const response = await fetch(`/static/themes/${frontendTheme}.json`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const themeJson = await response.json();

          // Convert camelCase to snake_case for ThemeData interface
          const theme: ThemeData = {
            name: themeJson.theme_name,
            display_name: themeJson.display_name,
            css_vars: {
              theme: themeJson.cssVars.theme,
              light: themeJson.cssVars.light,
              dark: themeJson.cssVars.dark,
            }
          };

          // Initialize font preloading BEFORE applying theme
          await initializeFontPreloading(theme.css_vars.theme);

          // Apply theme to DOM BEFORE updating state to prevent color flash
          applyThemeToDOM(theme);

          // Update state after DOM is ready (prevents loading screen color change)
          setThemeSettings(theme);
          setError(null);
        } catch (err) {
          const fallbackTheme = getFallbackTheme();
          await initializeFontPreloading(fallbackTheme.css_vars.theme);
          applyThemeToDOM(fallbackTheme);
          setThemeSettings(fallbackTheme);
          setError('Failed to load frontend theme, using fallback');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Backend themes enabled - try to fetch from API
      try {
        setIsLoading(true);
        setError(null);

        // Get current theme from backend API
        const apiResponse = await themeApi.getCurrentTheme();

        // Check if backend returned a fallback instruction
        if ('fallback' in apiResponse && apiResponse.fallback) {
          // Backend says to use frontend theme JSON
          const frontendTheme = apiResponse.theme_name || 'vercel';

          // Fetch frontend theme JSON from static assets
          const response = await fetch(`/static/themes/${frontendTheme}.json`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const themeJson = await response.json();
          const theme: ThemeData = {
            name: themeJson.theme_name,
            display_name: themeJson.display_name,
            css_vars: {
              theme: themeJson.cssVars.theme,
              light: themeJson.cssVars.light,
              dark: themeJson.cssVars.dark,
            }
          };

          await initializeFontPreloading(theme.css_vars.theme);
          applyThemeToDOM(theme);
          setThemeSettings(theme);
          setError(null);
        } else {
          // Normal backend theme response
          const theme = apiThemeToThemeData(apiResponse as any);

          // Initialize font preloading for this theme
          await initializeFontPreloading(theme.css_vars.theme);

          // Apply theme to DOM BEFORE updating state to prevent color flash
          applyThemeToDOM(theme);

          // Update state after DOM is ready (prevents loading screen color change)
          setThemeSettings(theme);
          setError(null);
        }
      } catch (err) {
        // Fallback to frontend theme if backend fails (e.g., fresh deployment with no themes yet)
        const frontendTheme = import.meta.env.VITE_FRONTEND_THEME || 'vercel';

        try {
          // Fetch theme JSON from static assets
          const response = await fetch(`/static/themes/${frontendTheme}.json`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const themeJson = await response.json();

          // Convert camelCase to snake_case for ThemeData interface
          const theme: ThemeData = {
            name: themeJson.theme_name,
            display_name: themeJson.display_name,
            css_vars: {
              theme: themeJson.cssVars.theme,
              light: themeJson.cssVars.light,
              dark: themeJson.cssVars.dark,
            }
          };

          // Initialize font preloading for fallback theme
          await initializeFontPreloading(theme.css_vars.theme);

          // Apply theme to DOM
          applyThemeToDOM(theme);

          // Update state
          setThemeSettings(theme);
          setError(`Backend themes unavailable, using ${frontendTheme} theme`);
        } catch (fallbackErr) {
          // Final fallback to hardcoded theme
          const hardcodedFallback = getFallbackTheme();
          await initializeFontPreloading(hardcodedFallback.css_vars.theme);
          applyThemeToDOM(hardcodedFallback);
          setThemeSettings(hardcodedFallback);
          setError('Failed to load all themes, using hardcoded fallback');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAndApplyTheme();
  }, []);

  // Apply light/dark mode class to document
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safe

    const root = document.documentElement;
    if (lightMode) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('theme-mode', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  // Toggle function
  const toggleLightMode = () => {
    setLightMode(prev => !prev);
  };

  // Helper function to apply theme CSS to DOM
  const applyThemeToDOM = (theme: ThemeData) => {
    const root = document.documentElement;

    // Apply theme variables (fonts, radius, etc.) as inline styles - these don't change between light/dark
    Object.entries(theme.css_vars.theme).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, String(value));
      
      // For font-size, also set the html element font-size for global scaling
      if (property === 'font-size') {
        document.documentElement.style.fontSize = String(value);
      }
    });
    
    // Create CSS rules for both light and dark mode (not inline styles)
    const themeStyleId = 'tweakcn-theme-styles';
    let themeStyleElement = document.getElementById(themeStyleId) as HTMLStyleElement;
    
    if (!themeStyleElement) {
      themeStyleElement = document.createElement('style');
      themeStyleElement.id = themeStyleId;
      document.head.appendChild(themeStyleElement);
    }
    
    // Generate CSS for both light and dark modes
    // For OKLCH colors, we need to set the variable without the oklch() wrapper
    // so Tailwind can add opacity modifiers
    const processColorValue = (value: string): string => {
      // If it's an oklch color like "oklch(0.6231 0.1880 259.8145)"
      // Extract just the values: "0.6231 0.1880 259.8145"
      const oklchMatch = value.match(/oklch\(([^)]+)\)/);
      if (oklchMatch) {
        return oklchMatch[1];
      }
      return value;
    };

    const lightCSS = `:root {
      ${Object.entries(theme.css_vars.light).map(([property, value]) => {
        const processedValue = processColorValue(String(value));
        return `--${property}: ${processedValue};`;
      }).join('\n  ')}
    }`;

    const darkCSS = `.dark {
      ${Object.entries(theme.css_vars.dark).map(([property, value]) => {
        const processedValue = processColorValue(String(value));
        return `--${property}: ${processedValue};`;
      }).join('\n  ')}
    }`;

    const fullCSS = lightCSS + '\n\n' + darkCSS;

    themeStyleElement.textContent = fullCSS;
  };

  const refreshTheme = async () => {
    setIsLoading(true);
    try {
      // Fetch current theme from backend
      const apiTheme = await themeApi.getCurrentTheme();
      const theme = apiThemeToThemeData(apiTheme);
      
      setThemeSettings(theme);
      
      // Re-initialize font preloading for this theme
      await initializeFontPreloading(theme.css_vars.theme);
      
      // Re-apply theme to DOM
      applyThemeToDOM(theme);
      
      setError(null);
    } catch (err) {
      console.error('Failed to refresh theme:', err);
      setError('Failed to refresh theme');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to switch themes
  const switchTheme = async (themeName: string) => {
    setIsLoading(true);
    try {
      // Set the new theme as current in backend
      await themeApi.setCurrentTheme(themeName);
      
      // Refresh to apply the new theme
      await refreshTheme();
    } catch (err) {
      console.error('Failed to switch theme:', err);
      setError('Failed to switch theme');
      setIsLoading(false);
    }
  };

  return {
    themeSettings,
    isLoading: isLoading || !fontsReady,
    error,
    refreshTheme,
    switchTheme,
    loadedFonts,
    fontsReady,
    lightMode,
    toggleLightMode
  };
}; 