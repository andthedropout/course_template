# Theme API Documentation

## Base URL
All theme API endpoints are available at: `/api/v1/`

## Endpoints

### 1. List Themes
**GET** `/api/v1/themes/`
- **Description**: Get all active themes (lightweight data without full CSS variables)
- **Permissions**: Public
- **Response**:
  ```json
  {
    "count": 40,
    "results": [
      {
        "id": 1,
        "name": "modern-minimal",
        "display_name": "Modern Minimal", 
        "description": "Clean, minimal design...",
        "is_system_theme": true,
        "version": "1.0.0"
      }
    ]
  }
  ```

### 2. Get Current Theme
**GET** `/api/v1/themes/current/`
- **Description**: Get the currently active theme with full CSS variables
- **Permissions**: Public
- **Response**: Full theme object with `css_vars`

### 3. Get Theme by Name
**GET** `/api/v1/themes/{name}/`
- **Description**: Get specific theme by name with full CSS variables
- **Permissions**: Public
- **Parameters**: `name` - Theme name (e.g., "modern-minimal")
- **Response**: Full theme object with `css_vars`

### 4. Get Current Theme Setting
**GET** `/api/v1/themes/current-setting/`
- **Description**: Get current theme setting with both current and fallback themes
- **Permissions**: Public
- **Response**:
  ```json
  {
    "id": 1,
    "current_theme": { /* full theme object */ },
    "fallback_theme": { /* full theme object */ },
    "updated_at": "2024-01-15T10:30:00Z"
  }
  ```

### 5. Create New Theme
**POST** `/api/v1/themes/`
- **Description**: Create new theme (from theme customizer)
- **Permissions**: Authenticated users
- **Request Body**:
  ```json
  {
    "name": "my-custom-theme",
    "display_name": "My Custom Theme",
    "description": "Custom theme created in theme editor",
    "css_vars": {
      "theme": { /* theme variables */ },
      "light": { /* light mode variables */ },
      "dark": { /* dark mode variables */ }
    },
    "version": "1.0.0"
  }
  ```

### 6. Generate AI Theme
**POST** `/api/v1/themes/generate/`
- **Description**: Generate a new theme using AI (OpenRouter + GPT-4.1)
- **Permissions**: Authenticated users
- **Request Body**:
  ```json
  {
    "prompt": "Create a dark cyberpunk theme with neon blue accents and futuristic fonts"
  }
  ```
- **Response**: Full theme object with generated `css_vars`, automatically set as current theme
- **Notes**: 
  - Requires `OPENROUTER_API_KEY` environment variable
  - Generated theme name will be auto-incremented if duplicate
  - Theme is automatically set as current active theme

### 7. Set Current Theme
**POST** `/api/v1/themes/set-current/`
- **Description**: Set the current active theme
- **Permissions**: Authenticated users (admin)
- **Request Body**:
  ```json
  {
    "theme_name": "ghibli-studio"
  }
  ```

### 8. Duplicate Theme
**POST** `/api/v1/themes/{name}/duplicate/`
- **Description**: Duplicate an existing theme with a new name
- **Permissions**: Authenticated users
- **Request Body**:
  ```json
  {
    "new_name": "my-theme-copy",
    "new_display_name": "My Theme Copy" // optional
  }
  ```

### 9. Update Theme
**PUT** `/api/v1/themes/{name}/`
- **Description**: Update an existing theme
- **Permissions**: Authenticated users (admin)
- **Request Body**: Same as create theme

### 10. Delete Theme
**DELETE** `/api/v1/themes/{name}/`
- **Description**: Delete a theme (marks as inactive)
- **Permissions**: Authenticated users (admin)

## Theme Setting Management

### 11. Get Theme Settings
**GET** `/api/v1/settings/`
- **Description**: Get current theme settings
- **Permissions**: Authenticated users (admin)

### 12. Update Theme Settings
**PUT** `/api/v1/settings/{id}/`
- **Description**: Update theme settings
- **Permissions**: Authenticated users (admin)
- **Request Body**:
  ```json
  {
    "current_theme_id": 5,
    "fallback_theme_id": 1
  }
  ```

## Environment Configuration

For AI theme generation to work, add to your environment:

```bash
# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
SITE_URL=http://localhost:8000  # Or your production URL
```

Get your OpenRouter API key from: https://openrouter.ai/keys

## CSS Variables Structure

All themes must include the following structure in `css_vars`:

```json
{
  "theme": {
    "font-sans": "Inter, sans-serif",
    "font-serif": "Source Serif 4, serif", 
    "font-mono": "JetBrains Mono, monospace",
    "radius": "0.375rem"
  },
  "light": {
    "background": "oklch(1.0000 0 0)",
    "foreground": "oklch(0.3211 0 0)",
    "primary": "oklch(0.6231 0.1880 259.8145)",
    "secondary": "oklch(0.9670 0.0029 264.5419)",
    // ... other color variables
  },
  "dark": {
    "background": "oklch(0.2046 0 0)",
    "foreground": "oklch(0.9219 0 0)",
    "primary": "oklch(0.6231 0.1880 259.8145)",
    "secondary": "oklch(0.2686 0 0)",
    // ... other color variables  
  }
}
```

## AI Theme Generation

The AI system uses GPT-4.1 via OpenRouter to generate complete themes based on user prompts. The AI:

- Creates unique theme names (kebab-case)
- Generates appropriate display names and descriptions
- Chooses fonts that match the theme mood
- Creates full light/dark mode color palettes in oklch format
- Ensures accessibility with proper contrast ratios
- Validates all required CSS variables are present

Example prompts:
- "Modern tech startup theme with blue accents"
- "Cozy coffee shop theme with warm browns and cream colors"
- "Minimalist medical practice theme with clean whites and soft blues"
- "Creative agency theme with bold colors and artistic fonts"

## Error Responses

Common error responses include:

```json
{
  "error": "Theme with this name already exists"
}
```

```json
{
  "error": "Theme generation failed: OpenRouter API error"
}
```

```json
{
  "error": "prompt is required"
} 