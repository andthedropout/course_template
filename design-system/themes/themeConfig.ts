import { TweakcnTheme } from '../../assets/src/lib/themeTypes';
import { PREFERRED_THEME } from '../../GLOBALSETTINGS';

/**
 * Local theme configuration
 */
export const LOCAL_THEME_CONFIG = {
  // Default theme from frontend settings
  defaultTheme: PREFERRED_THEME,
};

/**
 * Theme registry - will be populated with imported JSON files
 * Structure: { 'theme-name': ThemeData }
 */
export const THEME_REGISTRY: Record<string, TweakcnTheme> = {};

/**
 * Load a theme from the local registry
 */
export function getLocalTheme(themeName: string): TweakcnTheme | null {
  return THEME_REGISTRY[themeName] || null;
}

/**
 * Get the default theme
 */
export function getDefaultTheme(): TweakcnTheme | null {
  return getLocalTheme(LOCAL_THEME_CONFIG.defaultTheme);
}

/**
 * Get all available theme names
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEME_REGISTRY);
}

/**
 * Set the default theme (for runtime changes)
 */
export function setDefaultTheme(themeName: string): void {
  if (THEME_REGISTRY[themeName]) {
    LOCAL_THEME_CONFIG.defaultTheme = themeName;
  } else {
    console.warn(`Theme "${themeName}" not found in registry`);
  }
} 