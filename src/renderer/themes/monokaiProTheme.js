/**
 * Monokai Pro Theme
 * 
 * A refined theme with carefully selected colors for syntax highlighting clarity.
 * Based on the popular Monokai Pro theme for code editors.
 * @see https://monokai.pro/vscode
 */

const monokaiProTheme = {
  id: 'monokai-pro',
  name: 'Monokai Pro',
  colors: {
    // Base colors
    background: '#2d2a2e',
    text: '#fcfcfa',
    textSecondary: '#939293',
    primary: '#a9dc76',
    secondary: '#403e41',
    border: '#5b595c',
    
    // Status colors
    error: '#ff6188',
    errorLight: '#44252b',
    info: '#78dce8',
    infoLight: '#2b4452',
    success: '#a9dc76',
    successLight: '#2b4434',
    warning: '#fc9867',
    warningLight: '#52442b',
    
    // Diff colors
    added: '#3a4d28',
    removed: '#6e2936',
    addedText: '#e8ffcc',
    removedText: '#ffd0d8',
    unchanged: '#2d2a2e',
    
    // Navigation
    sidebar: '#221f22',
    sidebarText: '#fcfcfa',
    sidebarHover: '#403e41',
    sidebarActive: '#5b595c',
    headerBackground: '#403e41',
    headerText: '#fcfcfa',
    
    // Buttons
    buttonBackground: '#78dce8',
    buttonText: '#2d2a2e',
    buttonHover: '#ab9df2',
    buttonSecondary: '#403e41',
    buttonSecondaryText: '#fcfcfa',
    buttonSecondaryHover: '#5b595c',
    
    // Inputs
    inputBackground: '#221f22',
    inputText: '#fcfcfa',
    inputBorder: '#5b595c',
    inputFocusBorder: '#78dce8',
    checkboxChecked: '#78dce8',
    
    // Search components
    searchBarBackground: '#403e41',
    searchPlaceholderBackground: '#221f22',
    searchPlaceholderShadow: 'rgba(120, 220, 232, 0.2)',
    searchPlaceholderHeading: '#78dce8',
    searchPlaceholderText: '#939293',
    searchPlaceholderIcon: '#78dce8',
    searchResultBackground: '#403e41',
    searchResultBackgroundHover: '#5b595c',
    searchResultFilenameText: '#fcfcfa',
    searchResultFilenameBackground: 'rgba(120, 220, 232, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(120, 220, 232, 0.2)',
    
    // Modal
    modalBackground: '#2d2a2e',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    modalHeaderBackground: '#403e41',
    modalHeaderText: '#fcfcfa',
    modalFooterBackground: '#403e41',
  }
};

export default monokaiProTheme;
