import requests
import json
import re
from django.conf import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class OpenRouterService:
    """Service for making AI API calls to OpenRouter"""
    
    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self._api_key = None
    
    @property
    def api_key(self):
        if self._api_key is None:
            self._api_key = getattr(settings, 'OPENROUTER_API_KEY', None)
            if not self._api_key:
                raise ValueError("OPENROUTER_API_KEY not configured in settings")
        return self._api_key
    
    def generate_theme(self, user_prompt: str, referenced_themes: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a complete theme using OpenRouter AI
        Returns theme data ready for Theme model creation
        """
        try:
            # Build the AI prompt
            full_prompt = self._build_theme_prompt(user_prompt, referenced_themes)
            
            # Make API call to OpenRouter
            response = self._make_openrouter_request(full_prompt)
            
            # Parse and validate the AI response
            theme_data = self._parse_ai_response(response)
            
            # Validate the theme structure
            self._validate_theme_data(theme_data)
            
            return theme_data
            
        except Exception as e:
            logger.error(f"Theme generation failed: {str(e)}")
            raise
    
    def _build_theme_prompt(self, user_prompt: str, referenced_themes: Dict[str, Any] = None) -> str:
        """Build the complete prompt for theme generation"""
        logger.info(f"Building prompt with user_prompt: '{user_prompt}', referenced_themes: {referenced_themes}")
        
        if user_prompt is None:
            logger.error("user_prompt is None in _build_theme_prompt!")
            raise ValueError("user_prompt cannot be None")
        
        # Start with base prompt
        prompt = f"""You are an expert UI/UX theme designer. Generate a complete theme based on this request: "{user_prompt}"
        
REFERENCED THEMES:"""
        
        # Add referenced theme data if provided
        if referenced_themes:
            for mention, theme_data in referenced_themes.items():
                prompt += f"""

@{mention} theme "{theme_data['display_name']}":
{json.dumps(theme_data['css_vars'], indent=2)}
"""
            prompt += f"""

CRITICAL MODIFICATION RULES - FOLLOW EXACTLY:
1. START by copying EVERY SINGLE CSS variable from the referenced theme above EXACTLY as-is
2. DO NOT change ANY colors, fonts, spacing, or other values UNLESS specifically mentioned in the user prompt
3. If user says "change only the font" - ONLY modify font-sans, font-serif, font-mono. Keep ALL colors identical
4. If user says "make more vibrant" - ONLY adjust color saturation. Keep ALL fonts, spacing, radius identical
5. If user says "change nothing but X" - ONLY modify X. Everything else MUST remain identical

VIOLATION OF THESE RULES WILL RESULT IN REJECTION. 

PRESERVATION REQUIREMENT:
- Copy the exact oklch() values from the referenced theme
- Copy the exact font names from the referenced theme  
- Copy the exact radius value from the referenced theme
- Copy ALL other properties unchanged
- Apply ONLY the specific modification requested

MODIFICATION EXAMPLES:
- "change only font" = keep all colors, radius, spacing identical, only change font-sans/serif/mono
- "make darker" = keep all fonts, radius, spacing identical, only reduce lightness in oklch values
- "more vibrant" = keep all fonts, radius, spacing identical, only increase chroma in oklch values
"""
        else:
            prompt += " None provided - create an entirely new theme from scratch.\n"
        
        prompt += f"""

CRITICAL REQUIREMENTS:
1. Use ONLY oklch() color format for all colors (e.g., "oklch(0.7686 0.1647 70.0804)")
2. Ensure proper contrast ratios for accessibility
3. Include both light and dark mode variants
4. Choose fonts that match the theme mood
5. Generate a unique theme name (lowercase, hyphens only)

THEME STRUCTURE:
When modifying a referenced theme, you MUST start with its exact structure and values.
Return a JSON object with this EXACT structure:

{{
  "name": "unique-theme-name",
  "display_name": "Theme Display Name", 
  "description": "Brief description of the theme's style and mood",
  "css_vars": {{
    "theme": {{
      "font-sans": "Font Name, sans-serif",
      "font-mono": "Mono Font, monospace", 
      "font-serif": "Serif Font, serif",
      "font-size": "16px",
      "radius": "Rem value"
    }},
    "light": {{
      "background": "oklch(...)",
      "foreground": "oklch(...)",
      "card": "oklch(...)",
      "card-foreground": "oklch(...)",
      "popover": "oklch(...)",
      "popover-foreground": "oklch(...)",
      "primary": "oklch(...)",
      "primary-foreground": "oklch(...)",
      "secondary": "oklch(...)", 
      "secondary-foreground": "oklch(...)",
      "muted": "oklch(...)",
      "muted-foreground": "oklch(...)",
      "accent": "oklch(...)",
      "accent-foreground": "oklch(...)",
      "destructive": "oklch(...)",
      "destructive-foreground": "oklch(...)",
      "border": "oklch(...)",
      "input": "oklch(...)",
      "ring": "oklch(...)",
      "radius": "Rem value",
      "sidebar": "oklch(...)",
      "sidebar-foreground": "oklch(...)",
      "sidebar-primary": "oklch(...)",
      "sidebar-primary-foreground": "oklch(...)",
      "sidebar-accent": "oklch(...)",
      "sidebar-accent-foreground": "oklch(...)",
      "sidebar-border": "oklch(...)",
      "sidebar-ring": "oklch(...)"
    }},
    "dark": {{
      "background": "oklch(...)",
      "foreground": "oklch(...)",
      "card": "oklch(...)",
      "card-foreground": "oklch(...)",
      "popover": "oklch(...)",
      "popover-foreground": "oklch(...)",
      "primary": "oklch(...)",
      "primary-foreground": "oklch(...)",
      "secondary": "oklch(...)",
      "secondary-foreground": "oklch(...)",
      "muted": "oklch(...)",
      "muted-foreground": "oklch(...)",
      "accent": "oklch(...)",
      "accent-foreground": "oklch(...)",
      "destructive": "oklch(...)",
      "destructive-foreground": "oklch(...)",
      "border": "oklch(...)",
      "input": "oklch(...)",
      "ring": "oklch(...)",
      "radius": "Rem value",
      "sidebar": "oklch(...)",
      "sidebar-foreground": "oklch(...)",
      "sidebar-primary": "oklch(...)",
      "sidebar-primary-foreground": "oklch(...)",
      "sidebar-accent": "oklch(...)",
      "sidebar-accent-foreground": "oklch(...)",
      "sidebar-border": "oklch(...)",
      "sidebar-ring": "oklch(...)"
    }}
  }}
}}

FONTS AND TYPOGRAPHY - CRITICAL REQUIREMENTS:
You MUST only choose fonts from this exact list of available fonts:

SANS-SERIF FONTS:
Inter, Source Sans Pro, Work Sans, Lato, Open Sans, Roboto, IBM Plex Sans, Libre Franklin, PT Sans, Chivo, DM Sans, Space Grotesk, Manrope, Outfit, Plus Jakarta Sans, Fira Sans, Karla, Rubik, Overpass, Spartan, Instrument Sans, Bricolage Grotesque, Syne, Archivo Narrow, Josefin Sans, Raleway, Nunito Sans, Barlow Condensed, Oswald, Fjalla One, Familjen Grotesk, Poppins, Montserrat, Alegreya Sans, Proza Libre, Varela Round, Bitter, Pathway Gothic One, Rajdhani, Bebas Neue, Anton, Righteous, Fredoka One, Bungee, Nunito, Comfortaa, Quicksand, Mukti, Hind, Dosis, Catamaran, Noto Sans, M PLUS 1p, Sarabun, Kanit, Prompt, Titillium Web, Exo 2, PT Sans Caption, Archivo Black, Squada One, Geist, Architects Daughter, Oxanium

SERIF FONTS:
Playfair Display, Cormorant, Libre Baskerville, Fraunces, Abril Fatface, Ultra, Rozha One, DM Serif Display, DM Serif Text, Source Serif Pro, Source Serif 4, PT Serif, Spectral, Literata, Newsreader, Roboto Serif, Merriweather, Lora, Alegreya, Cardo, Old Standard TT, Gentium Basic, Eczar, BioRhyme, Inknut Antiqua, Neuton, Zilla Slab, Josefin Slab, Instrument Serif, Dancing Script, Pacifico, Kaushan Script, Satisfy, Caveat, Sacramento, Great Vibes, Tangerine, Roboto Slab, Arvo, Crimson Text, Volkhov, Rokkitt, Slabo 27px, Yeseva One, Cinzel, Playfair Display SC, Sorts Mill Goudy, Crimson Pro

MONOSPACE FONTS:
Fira Code, JetBrains Mono, Source Code Pro, IBM Plex Mono, Geist Mono, Azeret Mono, Roboto Mono, Ubuntu Mono, Space Mono, Inconsolata

DO NOT use any fonts not in these lists - they will not work in our system.
Format as: "Font Name, sans-serif", "Font Name, serif", or "Font Name, monospace"

FONT SELECTION PRINCIPLES:
- Professional themes: Inter, Source Sans Pro, Work Sans, Roboto, DM Sans
- Creative themes: Space Grotesk, Syne, Architects Daughter, Bricolage Grotesque
- Technical themes: IBM Plex Sans, Geist, JetBrains Mono, Source Code Pro
- Elegant themes: Playfair Display, Cormorant, Libre Baskerville, Merriweather
- Modern themes: Inter, Manrope, Plus Jakarta Sans, Instrument Sans

COLOR THEORY:
- Ensure sufficient contrast (4.5:1 minimum)
- Dark mode should invert lightness while maintaining hue relationships
- Use consistent color temperature throughout
- Primary colors should be vibrant, secondary more muted

BORDER CONTRAST REQUIREMENTS:
- Border colors MUST have strong contrast against background colors
- Light mode borders should be significantly darker than light backgrounds
- Dark mode borders should be significantly lighter than dark backgrounds
- NEVER use subtle borders that are barely visible
- Test: If border is hard to see, increase the lightness difference by at least 0.2 in oklch
- Borders should be clearly distinguishable from their background context
- Use sufficient saturation in borders to ensure visibility

FINAL REMINDER: If modifying a referenced theme, START with its exact values and change ONLY what the user specifically requested.

Return ONLY the JSON object, no additional text."""
        
        logger.info(f"Built prompt length: {len(prompt)}")
        return prompt

    def _make_openrouter_request(self, prompt: str) -> Dict[str, Any]:
        """Make the actual API request to OpenRouter"""
        if prompt is None:
            logger.error("Prompt is None!")
            raise ValueError("Prompt cannot be None")
        
        logger.info(f"Making OpenRouter request with prompt length: {len(prompt)}")
        logger.debug(f"Full prompt: {prompt[:500]}...")  # Log first 500 chars
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": getattr(settings, 'SITE_URL', 'http://localhost:8000'),
            "X-Title": "Theme Generator"
        }
        
        payload = {
            "model": "openai/gpt-4.1",
            "messages": [
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.7,
            "max_tokens": 4000
        }
        
        logger.info(f"Payload content length: {len(payload['messages'][0]['content'])}")
        
        response = requests.post(
            self.base_url,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if not response.ok:
            logger.error(f"OpenRouter API error response: {response.text}")
            raise Exception(f"OpenRouter API error: {response.status_code} - {response.text}")
        
        return response.json()
    
    def _parse_ai_response(self, openrouter_response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse the OpenRouter response and extract theme data"""
        try:
            # Extract the content from OpenRouter response
            content = openrouter_response['choices'][0]['message']['content']
            
            # Parse JSON from the AI response
            theme_data = json.loads(content)
            
            # Ensure name is valid (lowercase, hyphens only)
            if 'name' in theme_data:
                theme_data['name'] = re.sub(r'[^a-z0-9-]', '', theme_data['name'].lower())
            
            # Add default version if not present
            if 'version' not in theme_data:
                theme_data['version'] = '1.0.0'
            
            return theme_data
            
        except (KeyError, json.JSONDecodeError, IndexError) as e:
            raise Exception(f"Failed to parse AI response: {str(e)}")
    
    def _validate_theme_data(self, theme_data: Dict[str, Any]) -> None:
        """Validate that the theme data has all required fields"""
        required_fields = ['name', 'display_name', 'description', 'css_vars']
        for field in required_fields:
            if field not in theme_data:
                raise ValueError(f"Missing required field: {field}")
        
        css_vars = theme_data['css_vars']
        required_sections = ['theme', 'light', 'dark']
        for section in required_sections:
            if section not in css_vars:
                raise ValueError(f"Missing required CSS section: {section}")
        
        # Validate required colors in light/dark modes
        required_colors = ['background', 'foreground', 'primary', 'secondary']
        for mode in ['light', 'dark']:
            mode_vars = css_vars.get(mode, {})
            for color in required_colors:
                if color not in mode_vars:
                    raise ValueError(f"Missing required color '{color}' in {mode} mode")
                
                # Basic oklch format validation
                color_value = mode_vars[color]
                if not isinstance(color_value, str) or not color_value.startswith('oklch('):
                    raise ValueError(f"Invalid color format for {color} in {mode} mode: {color_value}")


# Singleton instance
openrouter_service = OpenRouterService() 