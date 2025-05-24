/**
 * Witch Hazel Theme
 * 
 * A dark, feminine color theme with vibrant purples, pinks, and teals.
 * Based on Thea Flowers' Witch Hazel theme.
 * @see https://witchhazel.thea.codes/
 */

const witchHazelTheme = {
  id: 'witch-hazel',
  name: 'Witch Hazel',
  colors: {
    // Base colors
    background: '#433E56',       // Dark purple background
    text: '#F8F8F2',            // Light text
    textSecondary: '#B0BEC5',    // Comment color
    primary: '#1BC5E0',          // Bright teal
    secondary: '#716799',        // Mid purple
    border: '#8077A8',           // Lighter purple
    
    // Status colors
    error: '#FF79C6',            // Pink
    errorLight: '#66334C',
    info: '#1BC5E0',             // Bright teal
    infoLight: '#1A535C',
    success: '#C5A3FF',          // Light purple
    successLight: '#574473',
    warning: '#FFB86C',          // Orange
    warningLight: '#664932',
    
    // Diff colors
    added: '#2F5C45',            // Dark green
    removed: '#7F5C68',          // Dark pink
    addedText: '#C2FFDF',        // Light green
    removedText: '#FFBBD0',      // Light pink
    unchanged: '#433E56',        // Background color
    addedBackground: 'rgba(194, 255, 223, 0.15)',  // Transparent light green
    removedBackground: 'rgba(255, 187, 208, 0.15)', // Transparent light pink
    
    // Navigation
    sidebar: '#372F47',          // Darker purple
    sidebarText: '#F8F8F2',
    sidebarHover: '#555166',
    sidebarActive: '#8077A8',
    headerBackground: '#716799',
    headerText: '#F8F8F2',
    
    // Buttons
    buttonBackground: '#1BC5E0',  // Bright teal
    buttonText: '#2D2039',        // Very dark purple
    buttonHover: '#31DCF8',      // Lighter teal
    buttonSecondary: '#C990A5',   // Pink
    buttonSecondaryText: '#2D2039',
    buttonSecondaryHover: '#E1A8BD',
    
    // Inputs
    inputBackground: '#372F47',    // Darker purple
    inputText: '#F8F8F2',
    inputBorder: '#8077A8',
    inputFocusBorder: '#1BC5E0',   // Bright teal
    checkboxChecked: '#1BC5E0',    // Bright teal
    
    // Search components
    searchBarBackground: '#372F47',
    searchPlaceholderBackground: '#2D2039',
    searchPlaceholderShadow: 'rgba(27, 197, 224, 0.2)',
    searchPlaceholderHeading: '#1BC5E0',
    searchPlaceholderText: '#B0BEC5',
    searchPlaceholderIcon: '#1BC5E0',
    searchResultBackground: '#372F47',
    searchResultBackgroundHover: '#555166',
    searchResultFilenameText: '#F8F8F2',
    searchResultFilenameBackground: 'rgba(27, 197, 224, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(27, 197, 224, 0.1)',
    
    // Modal
    modalBackground: '#372F47',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#716799',
    modalHeaderText: '#F8F8F2',
    modalFooterBackground: '#716799',
  }
};

export default witchHazelTheme;
