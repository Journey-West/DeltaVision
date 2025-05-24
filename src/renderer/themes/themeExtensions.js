/**
 * Theme Extensions
 * 
 * This module provides extensions for themes to derive component-specific
 * variables from base theme colors. This helps ensure consistency across
 * themes and components.
 */

/**
 * Apply search component theme extensions
 * Derives search-specific variables from base theme colors if they're not already defined
 * 
 * @param {import('./themeInterface').Theme} theme - The theme to extend
 * @returns {import('./themeInterface').Theme} - The extended theme
 */
export function applySearchThemeExtension(theme) {
  const { colors } = theme;
  
  // Only set values if they're not already defined in the theme
  return {
    ...theme,
    colors: {
      ...colors,
      // Base colors (ensure all are defined)
      textSecondary: colors.textSecondary || (colors.text + '99'),
      error: colors.error || '#dc3545',
      errorLight: colors.errorLight || '#3b1d26',
      info: colors.info || '#4a90e2',
      infoLight: colors.infoLight || '#2a3f5a',
      success: colors.success || '#28a745',
      successLight: colors.successLight || '#1e4a2e',
      warning: colors.warning || '#ffc107',
      warningLight: colors.warningLight || '#4d3c10',
      
      // Search bar
      searchBarBackground: colors.searchBarBackground || colors.secondary,
      
      // Search placeholder
      searchPlaceholderBackground: colors.searchPlaceholderBackground || 
        (colors.secondary + 'CC'), // Add transparency to secondary color
      searchPlaceholderShadow: colors.searchPlaceholderShadow || 
        'rgba(0, 0, 0, 0.3)',
      searchPlaceholderHeading: colors.searchPlaceholderHeading || 
        colors.text,
      searchPlaceholderText: colors.searchPlaceholderText || 
        colors.textSecondary || (colors.text + '99'),
      searchPlaceholderIcon: colors.searchPlaceholderIcon || 
        colors.primary,
        
      // Search results
      searchResultBackground: colors.searchResultBackground || 
        colors.secondary || '#2d2d2d',
      searchResultBackgroundHover: colors.searchResultBackgroundHover || 
        (colors.secondary ? adjustColor(colors.secondary, 10) : '#3d3d3d'),
      searchResultFilenameText: colors.searchResultFilenameText || 
        colors.text || '#ffffff',
      searchResultFilenameBackground: colors.searchResultFilenameBackground || 
        (colors.primary + '20') || 'rgba(74, 144, 226, 0.15)',
      shadow: colors.shadow || 'rgba(0, 0, 0, 0.2)',
      shadowLight: colors.shadowLight || 'rgba(0, 0, 0, 0.1)',
      
      // Inputs
      inputBackground: colors.inputBackground || colors.background,
      inputText: colors.inputText || colors.text,
      inputBorder: colors.inputBorder || colors.border,
      inputFocusBorder: colors.inputFocusBorder || colors.primary,
      checkboxChecked: colors.checkboxChecked || colors.primary,
      
      // Buttons
      buttonSecondary: colors.buttonSecondary || colors.secondary,
      buttonSecondaryText: colors.buttonSecondaryText || colors.text,
      buttonSecondaryHover: colors.buttonSecondaryHover || 
        (colors.secondary !== '' ? adjustColor(colors.secondary, 20) : '#4a4a4a'),
      buttonHover: colors.buttonHover || 
        (colors.buttonBackground !== '' ? adjustColor(colors.buttonBackground, -10) : '#3a80d2'),
      buttonText: colors.buttonText || '#ffffff'
    }
  };
}

/**
 * Apply modal theme extensions
 * Derives modal-specific variables from base theme colors
 * 
 * @param {import('./themeInterface').Theme} theme - The theme to extend
 * @returns {import('./themeInterface').Theme} - The extended theme
 */
export function applyModalThemeExtension(theme) {
  const { colors } = theme;
  
  return {
    ...theme,
    colors: {
      ...colors,
      // Modal backgrounds
      modalBackground: colors.modalBackground || colors.background || '#1e1e1e',
      modalOverlay: colors.modalOverlay || 'rgba(0, 0, 0, 0.7)',
      modalHeaderBackground: colors.modalHeaderBackground || colors.secondary || '#2d2d2d',
      modalHeaderText: colors.modalHeaderText || colors.text || '#e0e0e0',
      modalFooterBackground: colors.modalFooterBackground || colors.secondary || '#2d2d2d'
    }
  };
}

/**
 * Apply all theme extensions
 * 
 * @param {import('./themeInterface').Theme} theme - The theme to extend
 * @returns {import('./themeInterface').Theme} - The fully extended theme
 */
export function applyAllThemeExtensions(theme) {
  let extendedTheme = theme;
  
  // Apply each extension in sequence
  extendedTheme = applySearchThemeExtension(extendedTheme);
  extendedTheme = applyModalThemeExtension(extendedTheme);
  
  return extendedTheme;
}

/**
 * Utility function to adjust a color's brightness
 * 
 * @param {string} color - Hex color code
 * @param {number} amount - Amount to adjust brightness (positive = lighter, negative = darker)
 * @returns {string} - Adjusted hex color
 */
function adjustColor(color, amount) {
  // Return empty string if color is empty
  if (!color) return '';
  
  // Handle non-hex colors by returning them unchanged
  if (!color.startsWith('#')) return color;
  
  let hex = color.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
