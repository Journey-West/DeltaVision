/**
 * Flate Theme
 * 
 * A minimal flat theme for VS Code.
 * Based on the Flate theme by Hiukky.
 * @see https://marketplace.visualstudio.com/items?itemName=hiukky.flate
 */

const flateTheme = {
  id: 'flate',
  name: 'Flate',
  colors: {
    // Base colors
    background: '#1E2127',
    text: '#D8DEE9',
    textSecondary: '#8C92A3',
    primary: '#88C0D0',
    secondary: '#2E3440',
    border: '#8C92A3',
    
    // Status colors
    error: '#BF616A',
    errorLight: '#44252B',
    info: '#88C0D0',
    infoLight: '#2B4452',
    success: '#A3BE8C',
    successLight: '#2B4434',
    warning: '#EBCB8B',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#A3BE8C',
    removedText: '#BF616A',
    unchanged: '#1E2127',
    
    // Navigation
    sidebar: '#191C21',
    sidebarText: '#D8DEE9',
    sidebarHover: '#2E3440',
    sidebarActive: '#88C0D0',
    headerBackground: '#2E3440',
    headerText: '#D8DEE9',
    
    // Buttons
    buttonBackground: '#88C0D0',
    buttonText: '#1E2127',
    buttonHover: '#6D99A6',
    buttonSecondary: '#2E3440',
    buttonSecondaryText: '#D8DEE9',
    buttonSecondaryHover: '#8C92A3',
    
    // Inputs
    inputBackground: '#191C21',
    inputText: '#D8DEE9',
    inputBorder: '#8C92A3',
    inputFocusBorder: '#88C0D0',
    checkboxChecked: '#88C0D0',
    
    // Search components
    searchBarBackground: '#2E3440',
    searchPlaceholderBackground: '#191C21',
    searchPlaceholderShadow: 'rgba(136, 192, 208, 0.2)',
    searchPlaceholderHeading: '#88C0D0',
    searchPlaceholderText: '#8C92A3',
    searchPlaceholderIcon: '#88C0D0',
    searchResultBackground: '#2E3440',
    searchResultBackgroundHover: '#8C92A3',
    searchResultFilenameText: '#D8DEE9',
    searchResultFilenameBackground: 'rgba(136, 192, 208, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(136, 192, 208, 0.2)',
    
    // Modal
    modalBackground: '#1E2127',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#2E3440',
    modalHeaderText: '#D8DEE9',
    modalFooterBackground: '#2E3440',
  }
};

export default flateTheme;
