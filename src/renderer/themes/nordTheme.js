/**
 * Nord Theme
 * 
 * A clean, minimalist theme with a cool blue color palette.
 * Inspired by the Arctic ice and polar night.
 * @see https://marketplace.visualstudio.com/items?itemName=arcticicestudio.nord-visual-studio-code
 */

const nordTheme = {
  id: 'nord',
  name: 'Nord',
  colors: {
    // Base colors
    background: '#2e3440',
    text: '#d8dee9',
    textSecondary: '#4c566a',
    primary: '#88c0d0',
    secondary: '#3b4252',
    border: '#4c566a',
    
    // Status colors
    error: '#bf616a',
    errorLight: '#44252b',
    info: '#88c0d0',
    infoLight: '#2b4452',
    success: '#a3be8c',
    successLight: '#2b4434',
    warning: '#ebcb8b',
    warningLight: '#52442b',
    
    // Diff colors
    added: '#3b4a2c',
    removed: '#4e2529',
    addedText: '#eceff4',
    removedText: '#eceff4',
    unchanged: '#2e3440',
    
    // Navigation
    sidebar: '#2e3440',
    sidebarText: '#d8dee9',
    sidebarHover: '#3b4252',
    sidebarActive: '#4c566a',
    headerBackground: '#3b4252',
    headerText: '#eceff4',
    
    // Buttons
    buttonBackground: '#88c0d0',
    buttonText: '#2e3440',
    buttonHover: '#81a1c1',
    buttonSecondary: '#3b4252',
    buttonSecondaryText: '#d8dee9',
    buttonSecondaryHover: '#4c566a',
    
    // Inputs
    inputBackground: '#2e3440',
    inputText: '#d8dee9',
    inputBorder: '#4c566a',
    inputFocusBorder: '#88c0d0',
    checkboxChecked: '#88c0d0',
    
    // Search components
    searchBarBackground: '#3b4252',
    searchPlaceholderBackground: '#2e3440',
    searchPlaceholderShadow: 'rgba(136, 192, 208, 0.2)',
    searchPlaceholderHeading: '#88c0d0',
    searchPlaceholderText: '#4c566a',
    searchPlaceholderIcon: '#88c0d0',
    searchResultBackground: '#3b4252',
    searchResultBackgroundHover: '#4c566a',
    searchResultFilenameText: '#d8dee9',
    searchResultFilenameBackground: 'rgba(136, 192, 208, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(136, 192, 208, 0.2)',
    
    // Modal
    modalBackground: '#2e3440',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    modalHeaderBackground: '#3b4252',
    modalHeaderText: '#eceff4',
    modalFooterBackground: '#3b4252',
  }
};

export default nordTheme;
