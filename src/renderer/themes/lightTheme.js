/**
 * Light Theme
 * 
 * A clean, light theme for the FileDiff application.
 */

const lightTheme = {
  id: 'light',
  name: 'Light',
  colors: {
    // Base colors
    background: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    primary: '#4a90e2',
    secondary: '#f5f5f5',
    border: '#e0e0e0',
    
    // Status colors
    error: '#dc3545',
    errorLight: '#ffeaea',
    info: '#4a90e2',
    infoLight: '#e8f4ff',
    success: '#28a745',
    successLight: '#e8f8ee',
    warning: '#ffc107',
    warningLight: '#fff8e6',
    
    // Diff colors
    added: '#d4f7dd',
    removed: '#ffd7d5',
    addedText: '#044e1a',
    removedText: '#9a0c1c',
    unchanged: '#ffffff',
    
    // Navigation
    sidebar: '#f8f8f8',
    sidebarText: '#333333',
    sidebarHover: '#e8e8e8',
    sidebarActive: '#e0e0e0',
    headerBackground: '#4a90e2',
    headerText: '#ffffff',
    
    // Buttons
    buttonBackground: '#4a90e2',
    buttonText: '#ffffff',
    buttonHover: '#3a80d2',
    buttonSecondary: '#f0f0f0',
    buttonSecondaryText: '#333333',
    buttonSecondaryHover: '#e0e0e0',
    
    // Inputs
    inputBackground: '#ffffff',
    inputText: '#333333',
    inputBorder: '#d0d0d0',
    inputFocusBorder: '#4a90e2',
    checkboxChecked: '#4a90e2',
    
    // Search components
    searchBarBackground: '#f8f8f8',
    searchPlaceholderBackground: '#ffffff',
    searchPlaceholderShadow: 'rgba(0, 0, 0, 0.08)',
    searchPlaceholderHeading: '#333333',
    searchPlaceholderText: '#666666',
    searchPlaceholderIcon: '#4a90e2',
    searchResultBackground: '#ffffff',
    searchResultBackgroundHover: '#f7fafd',
    searchResultFilenameText: '#333333',
    searchResultFilenameBackground: 'rgba(74, 144, 226, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    
    // Modal
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalHeaderBackground: '#f5f5f5',
    modalHeaderText: '#333333',
    modalFooterBackground: '#f5f5f5',
  }
};

export default lightTheme;
