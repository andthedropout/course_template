# Theme System

This project uses a comprehensive theme system with 35+ pre-built themes. The system is built on CSS variables and provides automatic dark/light mode support.

## Quick Start

1. **Choose your theme**: Browse available themes in the theme selector or view the complete list below.

2. **Set your preferred theme**: 
   ```typescript
   // In globalSettings.ts (root directory):
   export const PREFERRED_THEME = 'your-theme-name';
   ```

3. **Theme applies automatically**: The theme system will load your preferred theme on app startup.

## Setting Your Theme

In `globalSettings.ts`:

## How It Works

The theme system is completely self-contained in the frontend:

1. **Theme Selection**: Set your preferred theme in `frontendSettings.ts`
2. **Theme Loading**: All themes are imported and loaded automatically
3. **Theme Application**: CSS variables are applied to the document root
4. **Dark Mode**: Handled entirely by the frontend using CSS classes

## Configuration

### Available Themes

Choose from any of these 38 themes:
- modern-minimal, t3-chat, twitter, mono, mocha-mousse
- bubblegum, amethyst-haze, notebook, doom-64, catppuccin
- graphite, perpetuity, kodama-grove, cosmic-night, tangerine
- quantum-rose, nature, bold-tech, elegant-luxury, amber-minimal
- supabase, neo-brutalism, solar-dusk, claymorphism, cyberpunk
- pastel-dreams, clean-slate, caffeine, ocean-breeze, retro-arcade
- midnight-bloom, candyland, northern-lights, vintage-paper
- sunset-horizon, starry-night, claude, vercel

## Runtime Theme Switching

```typescript
import { setDefaultTheme, getAvailableThemes } from '@/themes/themeConfig';

// Get all available themes
const themes = getAvailableThemes();

// Switch to a different theme
setDefaultTheme('cyberpunk');

// Refresh the theme (if using useTheme hook)
refreshTheme();
```

## File Structure

```
assets/src/themes/
├── README.md              # This file
├── themeConfig.ts         # Theme configuration and selection
├── themeLoader.ts         # JSON import and validation
├── modern-minimal.json    # Theme JSON files
├── cyberpunk.json
├── neo-brutalism.json
└── ... (all 38 themes)
```

## Adding New Themes

1. Add the theme JSON file to this folder
2. Import it in `themeLoader.ts`:
   ```typescript
   import newTheme from './new-theme.json';
   ```
3. Add it to the `themeImports` object:
   ```typescript
   const themeImports = {
     'new-theme': newTheme,
     // ... other themes
   };
   ```

## Theme JSON Structure

Each theme file contains:

```json
{
  "theme_name": "theme-name",
  "display_name": "Theme Display Name",
  "cssVars": {
    "theme": {
      "font-sans": "Inter, sans-serif",
      "radius": "0.375rem"
    },
    "light": {
      "background": "oklch(1 0 0)",
      "foreground": "oklch(0.15 0 0)",
      "primary": "oklch(0.6 0.2 280)"
    },
    "dark": {
      "background": "oklch(0.05 0 0)",
      "foreground": "oklch(0.95 0 0)",
      "primary": "oklch(0.7 0.2 280)"
    }
  }
}
```

This system provides a complete, self-contained theming solution that works entirely in the frontend. 