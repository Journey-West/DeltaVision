/**
 * Ayu Theme
 * 
 * A simple, bright theme with vivid colors.
 * Based on the official Ayu theme color palette.
 * @see https://marketplace.visualstudio.com/items?itemName=teabyii.ayu
 */

const ayuTheme = {
  id: 'ayu',
  name: 'Ayu',
  colors: {
    // Base colors (using Ayu Dark)
    background: '#0F1419',
    text: '#E6E1CF',
    textSecondary: '#5C6773',
    primary: '#F29E74',
    secondary: '#1A1F29',
    border: '#5C6773',
    
    // Status colors
    error: '#FF3333',
    errorLight: '#44252B',
    info: '#59C2FF',
    infoLight: '#2B4452',
    success: '#C2D94C',
    successLight: '#2B4434',
    warning: '#FFAE57',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#C2D94C',
    removedText: '#FF3333',
    unchanged: '#0F1419',
    
    // Navigation
    sidebar: '#0D1017',
    sidebarText: '#E6E1CF',
    sidebarHover: '#1A1F29',
    sidebarActive: '#F29E74',
    headerBackground: '#1A1F29',
    headerText: '#E6E1CF',
    
    // Buttons
    buttonBackground: '#F29E74',
    buttonText: '#0F1419',
    buttonHover: '#FF8F40',
    buttonSecondary: '#1A1F29',
    buttonSecondaryText: '#E6E1CF',
    buttonSecondaryHover: '#5C6773',
    
    // Inputs
    inputBackground: '#0D1017',
    inputText: '#E6E1CF',
    inputBorder: '#5C6773',
    inputFocusBorder: '#F29E74',
    checkboxChecked: '#F29E74',
    
    // Search components
    searchBarBackground: '#1A1F29',
    searchPlaceholderBackground: '#0D1017',
    searchPlaceholderShadow: 'rgba(242, 158, 116, 0.2)',
    searchPlaceholderHeading: '#F29E74',
    searchPlaceholderText: '#5C6773',
    searchPlaceholderIcon: '#59C2FF',
    searchResultBackground: '#1A1F29',
    searchResultBackgroundHover: '#5C6773',
    searchResultFilenameText: '#E6E1CF',
    searchResultFilenameBackground: 'rgba(242, 158, 116, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(242, 158, 116, 0.2)',
    
    // Modal
    modalBackground: '#0F1419',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#1A1F29',
    modalHeaderText: '#E6E1CF',
    modalFooterBackground: '#1A1F29',
  }
};

export default ayuTheme;
