// Legacy theme interface for JSON files (being phased out)
export interface TweakcnTheme {
  theme_name: string;
  display_name: string;
  cssVars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  success: boolean;
}

// New theme interface matching backend API
export interface ApiTheme {
  id: number;
  name: string;
  display_name: string;
  description: string;
  css_vars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  is_system_theme: boolean;
  is_active: boolean;
  version: string;
  created_at: string;
  updated_at: string;
}

// Unified theme interface for frontend use
export interface ThemeData {
  name: string;
  display_name: string;
  description?: string;
  css_vars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  is_system_theme?: boolean;
  version?: string;
}

// Helper function to convert API theme to unified format
export function apiThemeToThemeData(apiTheme: ApiTheme): ThemeData {
  return {
    name: apiTheme.name,
    display_name: apiTheme.display_name,
    description: apiTheme.description,
    css_vars: apiTheme.css_vars,
    is_system_theme: apiTheme.is_system_theme,
    version: apiTheme.version
  };
}

// Helper function to convert legacy JSON theme to unified format  
export function legacyThemeToThemeData(legacyTheme: TweakcnTheme): ThemeData {
  return {
    name: legacyTheme.theme_name,
    display_name: legacyTheme.display_name,
    css_vars: legacyTheme.cssVars,
    is_system_theme: true,
    version: '1.0.0'
  };
} 