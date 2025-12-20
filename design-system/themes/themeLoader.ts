import { TweakcnTheme } from '../lib/themeTypes.js';
import { THEME_REGISTRY } from './themeConfig.js';

/**
 * Import all theme JSON files
 */
import modernMinimal from './modern-minimal.json';
import t3Chat from './t3-chat.json';
import twitter from './twitter.json';
import mono from './mono.json';
import mochaMousse from './mocha-mousse.json';
import bubblegum from './bubblegum.json';
import amethystHaze from './amethyst-haze.json';
import notebook from './notebook.json';
import doom64 from './doom-64.json';
import catppuccin from './catppuccin.json';
import graphite from './graphite.json';
import perpetuity from './perpetuity.json';
import kodamaGrove from './kodama-grove.json';
import cosmicNight from './cosmic-night.json';
import tangerine from './tangerine.json';
import quantumRose from './quantum-rose.json';
import nature from './nature.json';
import boldTech from './bold-tech.json';
import elegantLuxury from './elegant-luxury.json';
import amberMinimal from './amber-minimal.json';
import supabase from './supabase.json';
import neoBrutalism from './neo-brutalism.json';
import solarDusk from './solar-dusk.json';
import claymorphism from './claymorphism.json';
import cyberpunk from './cyberpunk.json';
import pastelDreams from './pastel-dreams.json';
import cleanSlate from './clean-slate.json';
import caffeine from './caffeine.json';
import oceanBreeze from './ocean-breeze.json';
import retroArcade from './retro-arcade.json';
import midnightBloom from './midnight-bloom.json';
import candyland from './candyland.json';
import northernLights from './northern-lights.json';
import vintagePaper from './vintage-paper.json';
import sunsetHorizon from './sunset-horizon.json';
import starryNight from './starry-night.json';
import claude from './claude.json';
import vercel from './vercel.json';
import popstar from './popstar.json';
import ghibliStudio from './ghibli-studio.json';

/**
 * Theme imports registry
 */
const themeImports: Record<string, any> = {
  'modern-minimal': modernMinimal,
  't3-chat': t3Chat,
  'twitter': twitter,
  'mono': mono,
  'mocha-mousse': mochaMousse,
  'bubblegum': bubblegum,
  'amethyst-haze': amethystHaze,
  'notebook': notebook,
  'doom-64': doom64,
  'catppuccin': catppuccin,
  'graphite': graphite,
  'perpetuity': perpetuity,
  'kodama-grove': kodamaGrove,
  'cosmic-night': cosmicNight,
  'tangerine': tangerine,
  'quantum-rose': quantumRose,
  'nature': nature,
  'bold-tech': boldTech,
  'elegant-luxury': elegantLuxury,
  'amber-minimal': amberMinimal,
  'supabase': supabase,
  'neo-brutalism': neoBrutalism,
  'solar-dusk': solarDusk,
  'claymorphism': claymorphism,
  'cyberpunk': cyberpunk,
  'pastel-dreams': pastelDreams,
  'clean-slate': cleanSlate,
  'caffeine': caffeine,
  'ocean-breeze': oceanBreeze,
  'retro-arcade': retroArcade,
  'midnight-bloom': midnightBloom,
  'candyland': candyland,
  'northern-lights': northernLights,
  'vintage-paper': vintagePaper,
  'sunset-horizon': sunsetHorizon,
  'starry-night': starryNight,
  'claude': claude,
  'vercel': vercel,
  'popstar': popstar,
  'ghibli-studio': ghibliStudio,
};

/**
 * Load all themes into the registry
 * This function processes the imported JSON files and adds them to THEME_REGISTRY
 */
export function loadThemes(): void {
  console.log('Loading local themes...');
  
  let loadedCount = 0;
  
  Object.entries(themeImports).forEach(([themeName, themeData]) => {
    try {
      // Validate theme data structure
      if (validateThemeData(themeData)) {
        THEME_REGISTRY[themeName] = normalizeThemeData(themeData);
        loadedCount++;
      } else {
        console.warn(`Invalid theme data for: ${themeName}`, themeData);
      }
    } catch (error) {
      console.error(`Error loading theme ${themeName}:`, error);
    }
  });
  
  console.log(`Loaded ${loadedCount} themes locally`);
  
  if (loadedCount === 0) {
    console.warn('No themes loaded. Make sure JSON files are imported in themeLoader.ts');
  }
}

/**
 * Validate theme data structure
 */
function validateThemeData(themeData: any): boolean {
  return (
    themeData &&
    typeof themeData === 'object' &&
    (themeData.theme_name || themeData.name) &&
    themeData.display_name &&
    themeData.cssVars &&
    themeData.cssVars.theme &&
    themeData.cssVars.light &&
    themeData.cssVars.dark
  );
}

/**
 * Normalize theme data to ensure consistent structure
 */
function normalizeThemeData(themeData: any): TweakcnTheme {
  // Ensure theme_name is present (use name as fallback)
  if (!themeData.theme_name && themeData.name) {
    themeData.theme_name = themeData.name;
  }
  
  // Ensure success property is present
  if (themeData.success === undefined) {
    themeData.success = true;
  }
  
  return themeData as TweakcnTheme;
}

/**
 * Get theme registry status
 */
export function getThemeRegistryStatus() {
  const themes = Object.keys(THEME_REGISTRY);
  return {
    totalThemes: themes.length,
    themes: themes,
    isEmpty: themes.length === 0
  };
} 