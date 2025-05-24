/**
 * Theme Registry
 * 
 * A central registry for managing themes in the application.
 * This module allows for dynamic registration and retrieval of themes.
 */

import { validateTheme } from './themeInterface';
import { extendThemeWithHighlightColors } from './themeHighlightExtension';

class ThemeRegistry {
  constructor() {
    this.themes = {};
    this.defaultThemeId = null;
  }

  /**
   * Register a new theme
   * @param {import('./themeInterface').Theme} theme - The theme to register
   * @param {boolean} [setAsDefault=false] - Whether to set this theme as the default
   * @returns {boolean} - Whether the registration was successful
   */
  register(theme, setAsDefault = false) {
    // Validate the theme
    if (!validateTheme(theme)) {
      console.error(`Theme validation failed for theme: ${theme?.id || 'unknown'}`);
      return false;
    }

    // Check if theme with this ID already exists
    if (this.themes[theme.id]) {
      console.warn(`Theme with ID "${theme.id}" already registered. Overwriting.`);
    }

    // Extend the theme with highlight colors based on its type
    const extendedTheme = extendThemeWithHighlightColors(theme);
    
    // Register the extended theme
    this.themes[theme.id] = extendedTheme;
    
    // Set as default if requested or if it's the first theme
    if (setAsDefault || this.defaultThemeId === null) {
      this.defaultThemeId = theme.id;
    }
    
    return true;
  }

  /**
   * Get a theme by ID
   * @param {string} themeId - ID of the theme to retrieve
   * @returns {import('./themeInterface').Theme|null} - The requested theme or null if not found
   */
  getTheme(themeId) {
    return this.themes[themeId] || null;
  }

  /**
   * Get the default theme
   * @returns {import('./themeInterface').Theme|null} - The default theme or null if no themes are registered
   */
  getDefaultTheme() {
    return this.defaultThemeId ? this.themes[this.defaultThemeId] : null;
  }

  /**
   * Get all registered themes
   * @returns {Object.<string, import('./themeInterface').Theme>} - All registered themes
   */
  getAllThemes() {
    return { ...this.themes };
  }

  /**
   * Get an array of all registered themes
   * @returns {Array<import('./themeInterface').Theme>} - Array of all registered themes
   */
  getThemesList() {
    return Object.values(this.themes);
  }

  /**
   * Set the default theme
   * @param {string} themeId - ID of the theme to set as default
   * @returns {boolean} - Whether setting the default was successful
   */
  setDefaultTheme(themeId) {
    if (!this.themes[themeId]) {
      console.error(`Cannot set default theme: Theme with ID "${themeId}" not found`);
      return false;
    }
    
    this.defaultThemeId = themeId;
    return true;
  }

  /**
   * Unregister a theme
   * @param {string} themeId - ID of the theme to unregister
   * @returns {boolean} - Whether the unregistration was successful
   */
  unregister(themeId) {
    if (!this.themes[themeId]) {
      console.warn(`Cannot unregister theme: Theme with ID "${themeId}" not found`);
      return false;
    }
    
    // If we're removing the default theme, set a new default if possible
    if (themeId === this.defaultThemeId) {
      const remainingThemes = Object.keys(this.themes).filter(id => id !== themeId);
      this.defaultThemeId = remainingThemes.length > 0 ? remainingThemes[0] : null;
    }
    
    delete this.themes[themeId];
    return true;
  }
}

// Create and export a singleton instance
const themeRegistry = new ThemeRegistry();
export default themeRegistry;
