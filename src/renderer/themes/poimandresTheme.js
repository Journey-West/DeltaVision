/**
 * Poimandres Theme
 * 
 * A minimal, clean, dark theme inspired by the Poimandres color scheme.
 * Based on the Poimandres theme by the Poimandres team.
 * @see https://marketplace.visualstudio.com/items?itemName=poimandres.poimandres
 */

const poimandresTheme = {
  id: 'poimandres',
  name: 'Poimandres',
  colors: {
    // Base colors
    background: '#1B1E28',
    text: '#E4F0FB',
    textSecondary: '#A7B8C4',
    primary: '#5DE4C7',
    secondary: '#252B37',
    border: '#A7B8C4',
    
    // Status colors
    error: '#D0679D',
    errorLight: '#44252B',
    info: '#ADD7FF',
    infoLight: '#2B4452',
    success: '#5DE4C7',
    successLight: '#2B4434',
    warning: '#FFFAC2',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#5DE4C7',
    removedText: '#D0679D',
    unchanged: '#1B1E28',
    
    // Navigation
    sidebar: '#171922',
    sidebarText: '#E4F0FB',
    sidebarHover: '#252B37',
    sidebarActive: '#5DE4C7',
    headerBackground: '#252B37',
    headerText: '#E4F0FB',
    
    // Buttons
    buttonBackground: '#5DE4C7',
    buttonText: '#1B1E28',
    buttonHover: '#91F0DB',
    buttonSecondary: '#252B37',
    buttonSecondaryText: '#E4F0FB',
    buttonSecondaryHover: '#A7B8C4',
    
    // Inputs
    inputBackground: '#171922',
    inputText: '#E4F0FB',
    inputBorder: '#A7B8C4',
    inputFocusBorder: '#5DE4C7',
    checkboxChecked: '#5DE4C7',
    
    // Search components
    searchBarBackground: '#252B37',
    searchPlaceholderBackground: '#171922',
    searchPlaceholderShadow: 'rgba(93, 228, 199, 0.2)',
    searchPlaceholderHeading: '#5DE4C7',
    searchPlaceholderText: '#A7B8C4',
    searchPlaceholderIcon: '#ADD7FF',
    searchResultBackground: '#252B37',
    searchResultBackgroundHover: '#A7B8C4',
    searchResultFilenameText: '#E4F0FB',
    searchResultFilenameBackground: 'rgba(93, 228, 199, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(93, 228, 199, 0.2)',
    
    // Modal
    modalBackground: '#1B1E28',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#252B37',
    modalHeaderText: '#E4F0FB',
    modalFooterBackground: '#252B37',
  }
};

export default poimandresTheme;
