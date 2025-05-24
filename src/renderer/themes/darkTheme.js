/**
 * Dark Theme
 * 
 * A sleek, dark theme for the FileDiff application.
 */

const darkTheme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Base colors
    background: '#1e1e1e',
    text: '#e0e0e0',
    primary: '#4a90e2',
    secondary: '#2d2d2d',
    border: '#3a3a3a',
    
    // Text hierarchy
    textPrimary: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textTertiary: '#909090',
    
    // Status colors
    added: '#133929',
    removed: '#3b1d26',
    addedText: '#85e89d',
    removedText: '#f97583',
    unchanged: '#1e1e1e',
    info: '#4a90e2',        // Primary blue for info/actions
    infoLight: '#2a3f5a',   // Lighter blue background for info items
    success: '#28a745',     // Green for success states
    successLight: '#133929', // Light green background
    warning: '#ffc107',     // Yellow for warnings
    warningLight: '#3a3527', // Light yellow background
    error: '#dc3545',       // Red for errors
    errorLight: '#3b1d26',   // Light red background
    
    // UI elements
    sidebar: '#252525',
    sidebarText: '#e0e0e0',
    sidebarHover: '#333333',
    sidebarActive: '#3a3a3a',
    headerBackground: '#252525',
    headerText: '#e0e0e0',
    
    // Buttons and interactive elements
    buttonBackground: '#4a90e2',
    buttonText: '#ffffff',
    buttonHover: '#3a80d2',
    buttonSecondary: '#3a3a3a',
    buttonSecondaryText: '#e0e0e0',
    buttonSecondaryHover: '#4a4a4a',
    
    // Form elements
    inputBackground: '#2d2d2d',
    inputText: '#e0e0e0',
    inputBorder: '#3a3a3a',
    inputFocusBorder: '#4a90e2',
    checkboxBackground: '#2d2d2d',
    checkboxBorder: '#3a3a3a',
    checkboxChecked: '#4a90e2',
    
    // Search specific
    searchHighlight: '#ff8c00',        // Orange for search highlights
    searchHighlightText: '#ffffff',    // White text for search highlights
    searchHighlightBg: 'rgba(255, 140, 0, 0.3)', // Transparent orange background
    searchResultBadge: '#4a90e2',      // Blue for badges
    searchResultBadgeText: '#ffffff',  // White text for badges
    searchContentTag: '#28a745',       // Green for content tags
    searchContentTagText: '#ffffff',   // White text for content tags
    
    // Modals
    modalBackground: '#2d2d2d',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    
    // Misc
    scrollbarThumb: '#4a4a4a',
    scrollbarTrack: '#2d2d2d'
  }
};

export default darkTheme;
