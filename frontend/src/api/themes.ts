import { getCSRFToken } from '@/lib/getCookie';

// Types for theme API responses
export interface ThemeApiResponse {
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

export interface ThemeListResponse {
  count: number;
  results: Array<{
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system_theme: boolean;
    version: string;
  }>;
}

export interface ThemeSettingResponse {
  id: number;
  current_theme: ThemeApiResponse;
  fallback_theme: ThemeApiResponse;
  updated_at: string;
}

class ThemeApiService {
  private baseUrl = '/api/v1';

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const csrfToken = getCSRFToken();
    
    return this.makeRequest(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
        ...options.headers,
      },
      ...options,
    });
  }

  // Get all available themes (lightweight data)
  async getThemes(): Promise<ThemeListResponse> {
    return this.makeRequest('/themes/');
  }

  // Check if backend themes are available
  async areThemesAvailable(): Promise<{ available: boolean }> {
    return this.makeRequest('/themes/available/');
  }

  // Get current active theme with full CSS variables
  async getCurrentTheme(): Promise<ThemeApiResponse> {
    return this.makeRequest('/themes/current/');
  }

  // Get specific theme by name with full CSS variables
  async getTheme(name: string): Promise<ThemeApiResponse> {
    return this.makeRequest(`/themes/${name}/`);
  }

  // Get current theme setting (includes both current and fallback themes)
  async getCurrentThemeSetting(): Promise<ThemeSettingResponse> {
    return this.makeRequest('/themes/current-setting/');
  }

  // Set current active theme (admin only)
  async setCurrentTheme(themeName: string): Promise<ThemeSettingResponse> {
    return this.makeAuthenticatedRequest('/themes/set-current/', {
      method: 'POST',
      body: JSON.stringify({
        theme_name: themeName
      }),
    });
  }

  // Create new theme (from theme customizer)
  async createTheme(themeData: {
    name: string;
    display_name: string;
    description: string;
    css_vars: {
      theme: Record<string, string>;
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    version?: string;
  }): Promise<ThemeApiResponse> {
    return this.makeAuthenticatedRequest('/themes/', {
      method: 'POST',
      body: JSON.stringify(themeData),
    });
  }

  // Generate AI theme
  async generateTheme(prompt: string, themeMentions?: string[]): Promise<ThemeApiResponse> {
    return this.makeAuthenticatedRequest('/themes/generate/', {
      method: 'POST',
      body: JSON.stringify({
        prompt: prompt,
        theme_mentions: themeMentions || []
      }),
    });
  }

  // Duplicate existing theme
  async duplicateTheme(themeName: string, newName: string, newDisplayName?: string): Promise<ThemeApiResponse> {
    return this.makeAuthenticatedRequest(`/themes/${themeName}/duplicate/`, {
      method: 'POST',
      body: JSON.stringify({
        new_name: newName,
        new_display_name: newDisplayName,
      }),
    });
  }

  // Update existing theme (admin only)
  async updateTheme(themeName: string, themeData: Partial<{
    display_name: string;
    description: string;
    css_vars: {
      theme: Record<string, string>;
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    version: string;
  }>): Promise<ThemeApiResponse> {
    return this.makeAuthenticatedRequest(`/themes/${themeName}/`, {
      method: 'PUT',
      body: JSON.stringify(themeData),
    });
  }

  // Delete theme (admin only)
  async deleteTheme(themeName: string): Promise<void> {
    const csrfToken = getCSRFToken();
    
    const response = await fetch(`${this.baseUrl}/themes/${themeName}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken || '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Don't try to parse JSON for DELETE responses - they're often empty
  }
}

// Export singleton instance
export const themeApi = new ThemeApiService(); 