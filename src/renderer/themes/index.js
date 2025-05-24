/**
 * Themes Module
 * 
 * This is the main entry point for the themes system.
 * It registers all available themes and exports the theme registry and store.
 */

import { writable } from 'svelte/store';
import themeRegistry from './themeRegistry';
import { validateTheme } from './themeInterface';
import { applyAllThemeExtensions } from './themeExtensions';

// Import existing themes
import draculaTheme from './draculaTheme';
import { githubTheme, githubLightTheme } from './githubTheme';
import monokaiProTheme from './monokaiProTheme';
import oneDarkProTheme from './oneDarkProTheme';
import { nightOwlTheme, lightOwlTheme } from './nightOwlTheme';
import tokyoNightTheme from './tokyoNightTheme';
import nordTheme from './nordTheme';
import rougeTheme from './rougeTheme';

// Import new themes
import ayuTheme from './ayuTheme';
import noctisTheme from './noctisTheme';
import blulocoDarkTheme from './blulocoDarkTheme';
import shadesOfPurpleTheme from './shadesOfPurpleTheme';
import slackTheme from './slackTheme';
import cobalt2Theme from './cobalt2Theme';
import materialTheme from './materialTheme';
import pandaTheme from './pandaTheme';
import poimandresTheme from './poimandresTheme';
import flateTheme from './flateTheme';
import ohLucyTheme from './ohLucyTheme';

// Apply extensions to all themes
const extendedDraculaTheme = applyAllThemeExtensions(draculaTheme);
const extendedGithubTheme = applyAllThemeExtensions(githubTheme);
const extendedGithubLightTheme = applyAllThemeExtensions(githubLightTheme);
const extendedMonokaiProTheme = applyAllThemeExtensions(monokaiProTheme);
const extendedOneDarkProTheme = applyAllThemeExtensions(oneDarkProTheme);
const extendedNightOwlTheme = applyAllThemeExtensions(nightOwlTheme);
const extendedLightOwlTheme = applyAllThemeExtensions(lightOwlTheme);
const extendedTokyoNightTheme = applyAllThemeExtensions(tokyoNightTheme);
const extendedNordTheme = applyAllThemeExtensions(nordTheme);
const extendedRougeTheme = applyAllThemeExtensions(rougeTheme);

const extendedAyuTheme = applyAllThemeExtensions(ayuTheme);
const extendedNoctisTheme = applyAllThemeExtensions(noctisTheme);
const extendedBlulocoDarkTheme = applyAllThemeExtensions(blulocoDarkTheme);
const extendedShadesOfPurpleTheme = applyAllThemeExtensions(shadesOfPurpleTheme);
const extendedSlackTheme = applyAllThemeExtensions(slackTheme);
const extendedCobalt2Theme = applyAllThemeExtensions(cobalt2Theme);
const extendedMaterialTheme = applyAllThemeExtensions(materialTheme);
const extendedPandaTheme = applyAllThemeExtensions(pandaTheme);
const extendedPoimandresTheme = applyAllThemeExtensions(poimandresTheme);
const extendedFlateTheme = applyAllThemeExtensions(flateTheme);
const extendedOhLucyTheme = applyAllThemeExtensions(ohLucyTheme);

// Register One Dark Pro theme as default
themeRegistry.register(extendedOneDarkProTheme, true); // One Dark Pro theme as default

// Register all themes
themeRegistry.register(extendedDraculaTheme);
themeRegistry.register(extendedGithubTheme);
themeRegistry.register(extendedGithubLightTheme);
themeRegistry.register(extendedMonokaiProTheme);
themeRegistry.register(extendedNightOwlTheme);
themeRegistry.register(extendedLightOwlTheme);
themeRegistry.register(extendedTokyoNightTheme);
themeRegistry.register(extendedNordTheme);
themeRegistry.register(extendedRougeTheme);

themeRegistry.register(extendedAyuTheme);
themeRegistry.register(extendedNoctisTheme);
themeRegistry.register(extendedBlulocoDarkTheme);
themeRegistry.register(extendedShadesOfPurpleTheme);
themeRegistry.register(extendedSlackTheme);
themeRegistry.register(extendedCobalt2Theme);
themeRegistry.register(extendedMaterialTheme);
themeRegistry.register(extendedPandaTheme);
themeRegistry.register(extendedPoimandresTheme);
themeRegistry.register(extendedFlateTheme);
themeRegistry.register(extendedOhLucyTheme);

// Register specific themes for 'dark' and 'light' IDs used by toggleDarkMode
const genericDarkThemeForToggle = { 
  ...extendedGithubTheme, // Or choose another dark theme like extendedOneDarkProTheme
  id: 'dark', 
  name: 'Dark (Toggle Default)' 
};
themeRegistry.register(genericDarkThemeForToggle);

const genericLightThemeForToggle = { 
  ...extendedGithubLightTheme, 
  id: 'light', 
  name: 'Light (Toggle Default)' 
};
themeRegistry.register(genericLightThemeForToggle);

/**
 * Get the initial theme from localStorage or default to the registry's default theme
 * @returns {import('./themeInterface').Theme} The initial theme
 */
const getInitialTheme = () => {
  if (typeof localStorage !== 'undefined') {
    const savedThemeId = localStorage.getItem('theme');
    if (savedThemeId) {
      const savedTheme = themeRegistry.getTheme(savedThemeId);
      if (savedTheme) return savedTheme;
    }
  }
  return themeRegistry.getDefaultTheme();
};

/**
 * Create the theme store
 * @returns {Object} The theme store with subscribe, setTheme, previewTheme, applyPreview, and cancelPreview methods
 */
const createThemeStore = () => {
  const { subscribe, set, update } = writable(getInitialTheme());
  
  // Store the current theme before preview for restoring if preview is cancelled
  let previousTheme = null;
  let isPreviewActive = false;

  return {
    subscribe,
    
    /**
     * Set the active theme by ID and save it to localStorage
     * @param {string} themeId - ID of the theme to set
     * @returns {boolean} Whether setting the theme was successful
     */
    setTheme: (themeId) => {
      const theme = themeRegistry.getTheme(themeId);
      if (!theme) {
        console.error(`Cannot set theme: Theme with ID "${themeId}" not found`);
        return false;
      }
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', themeId);
      }
      
      // Reset preview state
      previousTheme = null;
      isPreviewActive = false;
      
      set(theme);
      return true;
    },
    
    /**
     * Preview a theme without saving it to localStorage
     * @param {string} themeId - ID of the theme to preview
     * @returns {boolean} Whether previewing the theme was successful
     */
    previewTheme: (themeId) => {
      const theme = themeRegistry.getTheme(themeId);
      if (!theme) {
        console.error(`Cannot preview theme: Theme with ID "${themeId}" not found`);
        return false;
      }
      
      // Store the current theme if this is the first preview
      if (!isPreviewActive) {
        update(currentTheme => {
          previousTheme = currentTheme;
          return currentTheme;
        });
        isPreviewActive = true;
      }
      
      set(theme);
      return true;
    },
    
    /**
     * Apply the current preview theme permanently
     * @returns {boolean} Whether applying the preview was successful
     */
    applyPreview: () => {
      if (!isPreviewActive) return false;
      
      // Get the current theme and save it to localStorage
      let success = false;
      update(currentTheme => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', currentTheme.id);
        }
        success = true;
        return currentTheme;
      });
      
      // Reset preview state
      previousTheme = null;
      isPreviewActive = false;
      
      return success;
    },
    
    /**
     * Cancel the current preview and revert to the previous theme
     * @returns {boolean} Whether cancelling the preview was successful
     */
    cancelPreview: () => {
      if (!isPreviewActive || !previousTheme) return false;
      
      set(previousTheme);
      previousTheme = null;
      isPreviewActive = false;
      return true;
    },
    
    /**
     * Toggle between light and dark mode
     * Falls back to the default theme if the current theme is neither light nor dark
     */
    toggleDarkMode: () => {
      update(currentTheme => {
        const newThemeId = currentTheme.id === 'light' ? 'dark' : 'light';
        const newTheme = themeRegistry.getTheme(newThemeId) || themeRegistry.getDefaultTheme();
        
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', newTheme.id);
        }
        
        return newTheme;
      });
    },
    
    /**
     * Register a new theme
     * @param {import('./themeInterface').Theme} theme - The theme to register
     * @returns {boolean} Whether the registration was successful
     */
    registerTheme: (theme) => {
      return themeRegistry.register(theme);
    },
    
    /**
     * Get all available themes
     * @returns {Array<import('./themeInterface').Theme>} Array of all registered themes
     */
    getAllThemes: () => {
      return themeRegistry.getThemesList();
    }
  };
};

// Create and export the theme store
export const theme = createThemeStore();

// Export the theme registry for advanced usage
export { themeRegistry };

// Export the theme interface and validation function for theme creators
export { validateTheme } from './themeInterface';
