/**
 * Dracula Theme
 * 
 * A popular dark theme with vibrant colors.
 * Based on the official Dracula theme color palette.
 * @see https://draculatheme.com/
 */

const draculaTheme = {
  id: 'dracula',
  name: 'Dracula',
  colors: {
    // Base colors
    background: '#282a36',
    text: '#f8f8f2',
    textSecondary: '#6272a4',
    primary: '#bd93f9',
    secondary: '#44475a',
    border: '#6272a4',
    
    // Status colors
    error: '#ff5555',
    errorLight: '#44252b',
    info: '#8be9fd',
    infoLight: '#2b4452',
    success: '#50fa7b',
    successLight: '#2b4434',
    warning: '#ffb86c',
    warningLight: '#52442b',
    
    // Diff colors
    added: '#2a5834',
    removed: '#862a33',
    addedText: '#50fa7b',
    removedText: '#ff5555',
    unchanged: '#282a36',
    
    // Navigation
    sidebar: '#21222c',
    sidebarText: '#f8f8f2',
    sidebarHover: '#44475a',
    sidebarActive: '#6272a4',
    headerBackground: '#6272a4',
    headerText: '#f8f8f2',
    headerButtonText: '#000000',
    
    // Buttons
    buttonBackground: '#bd93f9',
    buttonText: '#282a36',
    buttonHover: '#ff79c6',
    buttonSecondary: '#44475a',
    buttonSecondaryText: '#f8f8f2',
    buttonSecondaryHover: '#6272a4',
    
    // Inputs
    inputBackground: '#21222c',
    inputText: '#f8f8f2',
    inputBorder: '#6272a4',
    inputFocusBorder: '#bd93f9',
    checkboxChecked: '#bd93f9',
    
    // Search components
    searchBarBackground: '#44475a',
    searchPlaceholderBackground: '#21222c',
    searchPlaceholderShadow: 'rgba(189, 147, 249, 0.2)',
    searchPlaceholderHeading: '#bd93f9',
    searchPlaceholderText: '#6272a4',
    searchPlaceholderIcon: '#8be9fd',
    searchResultBackground: '#44475a',
    searchResultBackgroundHover: '#6272a4',
    searchResultFilenameText: '#f8f8f2',
    searchResultFilenameBackground: 'rgba(189, 147, 249, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(189, 147, 249, 0.2)',
    
    // Modal
    modalBackground: '#282a36',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#44475a',
    modalHeaderText: '#f8f8f2',
    modalFooterBackground: '#44475a',
  }
};

export default draculaTheme;
