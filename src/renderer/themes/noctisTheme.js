/**
 * Noctis Theme
 * 
 * A collection of light & dark themes with a well balanced blend of warm and cold colors.
 * Based on the Noctis theme by Liviu Schera.
 * @see https://marketplace.visualstudio.com/items?itemName=liviuschera.noctis
 */

const noctisTheme = {
  id: 'noctis',
  name: 'Noctis',
  colors: {
    // Base colors (using Noctis Azureus)
    background: '#1B2932',
    text: '#D3E8F8',
    textSecondary: '#6A7D87',
    primary: '#7AABD4',
    secondary: '#26353F',
    border: '#6A7D87',
    
    // Status colors
    error: '#E34F8C',
    errorLight: '#44252B',
    info: '#7AABD4',
    infoLight: '#2B4452',
    success: '#87D68A',
    successLight: '#2B4434',
    warning: '#DBBC98',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#87D68A',
    removedText: '#E34F8C',
    unchanged: '#1B2932',
    
    // Navigation
    sidebar: '#152029',
    sidebarText: '#D3E8F8',
    sidebarHover: '#26353F',
    sidebarActive: '#7AABD4',
    headerBackground: '#26353F',
    headerText: '#D3E8F8',
    
    // Buttons
    buttonBackground: '#7AABD4',
    buttonText: '#1B2932',
    buttonHover: '#5A8BB4',
    buttonSecondary: '#26353F',
    buttonSecondaryText: '#D3E8F8',
    buttonSecondaryHover: '#6A7D87',
    
    // Inputs
    inputBackground: '#152029',
    inputText: '#D3E8F8',
    inputBorder: '#6A7D87',
    inputFocusBorder: '#7AABD4',
    checkboxChecked: '#7AABD4',
    
    // Search components
    searchBarBackground: '#26353F',
    searchPlaceholderBackground: '#152029',
    searchPlaceholderShadow: 'rgba(122, 171, 212, 0.2)',
    searchPlaceholderHeading: '#7AABD4',
    searchPlaceholderText: '#6A7D87',
    searchPlaceholderIcon: '#7AABD4',
    searchResultBackground: '#26353F',
    searchResultBackgroundHover: '#6A7D87',
    searchResultFilenameText: '#D3E8F8',
    searchResultFilenameBackground: 'rgba(122, 171, 212, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(122, 171, 212, 0.2)',
    
    // Modal
    modalBackground: '#1B2932',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#26353F',
    modalHeaderText: '#D3E8F8',
    modalFooterBackground: '#26353F',
  }
};

export default noctisTheme;
