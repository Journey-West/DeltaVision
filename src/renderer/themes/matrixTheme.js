/**
 * Matrix Theme
 * 
 * A theme inspired by the iconic green code and dark aesthetic 
 * of "The Matrix" movie, featuring various shades of green on black.
 */

const matrixTheme = {
  id: 'matrix',
  name: 'Matrix',
  colors: {
    // Base colors
    background: '#0D0208',
    text: '#00FF41',
    textSecondary: '#008F11',
    primary: '#00FF41',
    secondary: '#0D1912',
    border: '#003B00',
    
    // Status colors
    error: '#FF3333',
    errorLight: '#330F0F',
    info: '#33CCFF',
    infoLight: '#0F2A33',
    success: '#00FF41',
    successLight: '#0F330F',
    warning: '#FFCC00',
    warningLight: '#332A0F',
    
    // Diff colors
    added: '#0F330F',
    removed: '#330F0F',
    addedText: '#00FF41',
    removedText: '#FF3333',
    unchanged: '#0D0208',
    
    // Navigation
    sidebar: '#050505',
    sidebarText: '#00FF41',
    sidebarHover: '#0F1F0F',
    sidebarActive: '#003B00',
    headerBackground: '#0D1912',
    headerText: '#00FF41',
    
    // Buttons
    buttonBackground: '#00FF41',
    buttonText: '#0D0208',
    buttonHover: '#00CC33',
    buttonSecondary: '#003B00',
    buttonSecondaryText: '#00FF41',
    buttonSecondaryHover: '#004D00',
    
    // Inputs
    inputBackground: '#050505',
    inputText: '#00FF41',
    inputBorder: '#003B00',
    inputFocusBorder: '#00FF41',
    checkboxChecked: '#00FF41',
    
    // Search components
    searchBarBackground: '#0D1912',
    searchPlaceholderBackground: '#050505',
    searchPlaceholderShadow: 'rgba(0, 255, 65, 0.2)',
    searchPlaceholderHeading: '#00FF41',
    searchPlaceholderText: '#008F11',
    searchPlaceholderIcon: '#00FF41',
    searchResultBackground: '#0D1912',
    searchResultBackgroundHover: '#0F1F0F',
    searchResultFilenameText: '#00FF41',
    searchResultFilenameBackground: 'rgba(0, 255, 65, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.7)',
    shadowLight: 'rgba(0, 255, 65, 0.1)',
    
    // Modal
    modalBackground: '#0D0208',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',
    modalHeaderBackground: '#0D1912',
    modalHeaderText: '#00FF41',
    modalFooterBackground: '#0D1912',
  }
};

export default matrixTheme;
