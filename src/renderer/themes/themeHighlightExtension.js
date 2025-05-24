/**
 * Theme Highlight Extension
 * 
 * This module provides highlight-related color variables for each theme type.
 * It ensures consistent and accessible highlighting across all themes.
 */

// Extension for light themes
export const lightThemeHighlightExtension = {
  // Basic highlight colors
  highlightColor: 'rgba(255, 213, 0, 0.3)',
  highlightText: '#000000',
  highlightBorder: 'rgba(255, 170, 0, 0.6)',
  highlightLineNumber: 'rgba(255, 213, 0, 0.2)',
  
  // Active highlight colors
  highlightActive: 'rgba(255, 140, 0, 0.7)',
  highlightActiveText: '#000000',
  highlightActiveShadow: 'rgba(255, 140, 0, 0.4)',
  highlightActiveBorder: '#ff6a00',
  highlightActiveLineNumber: 'rgba(255, 140, 0, 0.3)',
  
  // Pulse animation colors
  highlightPulseStart: 'rgba(255, 140, 0, 0.6)',
  highlightPulseMid: 'rgba(255, 140, 0, 0)',
  highlightPulseEnd: 'rgba(255, 140, 0, 0)',
  
  // Navigation elements
  navigationBg: 'rgba(74, 144, 226, 0.1)',
  navigationText: '#333333',
  badgeBg: '#4a90e2',
  badgeText: '#ffffff',
  badgeBorder: 'transparent',
  
  // Settings button colors
  settingsButtonBg: '#f5923e',
  settingsButtonText: '#ffffff',
  settingsButtonHover: '#e07d2e'
};

// Extension for dark themes
export const darkThemeHighlightExtension = {
  // Basic highlight colors
  highlightColor: 'rgba(255, 213, 0, 0.25)',
  highlightText: '#ffffff',
  highlightBorder: 'rgba(255, 170, 0, 0.5)',
  highlightLineNumber: 'rgba(255, 213, 0, 0.15)',
  
  // Active highlight colors
  highlightActive: 'rgba(255, 140, 0, 0.6)',
  highlightActiveText: '#ffffff',
  highlightActiveShadow: 'rgba(255, 140, 0, 0.4)',
  highlightActiveBorder: '#ff6a00',
  highlightActiveLineNumber: 'rgba(255, 140, 0, 0.25)',
  
  // Pulse animation colors
  highlightPulseStart: 'rgba(255, 140, 0, 0.5)',
  highlightPulseMid: 'rgba(255, 140, 0, 0)',
  highlightPulseEnd: 'rgba(255, 140, 0, 0)',
  
  // Navigation elements
  navigationBg: 'rgba(74, 144, 226, 0.15)',
  navigationText: '#e0e0e0',
  badgeBg: '#4a90e2',
  badgeText: '#ffffff',
  badgeBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Settings button colors
  settingsButtonBg: '#f5923e',
  settingsButtonText: '#ffffff',
  settingsButtonHover: '#e07d2e'
};

// Extension for high contrast themes
export const highContrastThemeHighlightExtension = {
  // Basic highlight colors
  highlightColor: '#ffff00',
  highlightText: '#000000',
  highlightBorder: '#ff8c00',
  highlightLineNumber: '#ffffaa',
  
  // Active highlight colors
  highlightActive: '#ff8c00',
  highlightActiveText: '#000000',
  highlightActiveShadow: 'rgba(255, 140, 0, 0.8)',
  highlightActiveBorder: '#ff4500',
  highlightActiveLineNumber: '#ffcc80',
  
  // Pulse animation colors
  highlightPulseStart: 'rgba(255, 140, 0, 0.9)',
  highlightPulseMid: 'rgba(255, 140, 0, 0.2)',
  highlightPulseEnd: 'rgba(255, 140, 0, 0)',
  
  // Navigation elements
  navigationBg: '#000080',
  navigationText: '#ffffff',
  badgeBg: '#ff0000',
  badgeText: '#ffffff',
  badgeBorder: '#ffffff',
  
  // Settings button colors
  settingsButtonBg: '#ff8000',
  settingsButtonText: '#000000',
  settingsButtonHover: '#ff6000'
};

// Function to extend a theme with highlight colors based on its type
export function extendThemeWithHighlightColors(theme) {
  // Determine which extension to use based on theme characteristics
  let extension;
  
  if (theme.id === 'highContrast') {
    extension = highContrastThemeHighlightExtension;
  } else if (
    theme.id.includes('dark') || 
    theme.id === 'dracula' || 
    theme.id === 'monokai' || 
    theme.id === 'nightOwl' ||
    theme.id === 'oneDarkPro' ||
    theme.id === 'tokyoNight' ||
    theme.id === 'nord' ||
    theme.colors.background.match(/#[0-9a-f]{6}/i) && 
    parseInt(theme.colors.background.substring(1), 16) < 0x808080
  ) {
    extension = darkThemeHighlightExtension;
  } else {
    extension = lightThemeHighlightExtension;
  }
  
  // Return a new theme object with the extension applied
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...extension
    }
  };
}
