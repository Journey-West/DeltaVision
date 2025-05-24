/**
 * Shades of Purple Theme
 * 
 * A professional theme with hand-picked & bold shades of purple for your VS Code editor.
 * Based on the Shades of Purple theme by Ahmad Awais.
 * @see https://marketplace.visualstudio.com/items?itemName=ahmadawais.shades-of-purple
 */

const shadesOfPurpleTheme = {
  id: 'shades-of-purple',
  name: 'Shades of Purple',
  colors: {
    // Base colors
    background: '#2D2B55',
    text: '#FFFFFF',
    textSecondary: '#A599E9',
    primary: '#FAD000',
    secondary: '#1E1E3F',
    border: '#A599E9',
    
    // Status colors
    error: '#FF628C',
    errorLight: '#44252B',
    info: '#9EFFFF',
    infoLight: '#2B4452',
    success: '#3AD900',
    successLight: '#2B4434',
    warning: '#FAD000',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#3AD900',
    removedText: '#FF628C',
    unchanged: '#2D2B55',
    
    // Navigation
    sidebar: '#1E1E3F',
    sidebarText: '#FFFFFF',
    sidebarHover: '#4D21FC',
    sidebarActive: '#FAD000',
    headerBackground: '#1E1E3F',
    headerText: '#FFFFFF',
    
    // Buttons
    buttonBackground: '#FAD000',
    buttonText: '#1E1E3F',
    buttonHover: '#FF9D00',
    buttonSecondary: '#1E1E3F',
    buttonSecondaryText: '#FFFFFF',
    buttonSecondaryHover: '#4D21FC',
    
    // Inputs
    inputBackground: '#1E1E3F',
    inputText: '#FFFFFF',
    inputBorder: '#A599E9',
    inputFocusBorder: '#FAD000',
    checkboxChecked: '#FAD000',
    
    // Search components
    searchBarBackground: '#1E1E3F',
    searchPlaceholderBackground: '#1E1E3F',
    searchPlaceholderShadow: 'rgba(250, 208, 0, 0.2)',
    searchPlaceholderHeading: '#FAD000',
    searchPlaceholderText: '#A599E9',
    searchPlaceholderIcon: '#9EFFFF',
    searchResultBackground: '#1E1E3F',
    searchResultBackgroundHover: '#4D21FC',
    searchResultFilenameText: '#FFFFFF',
    searchResultFilenameBackground: 'rgba(250, 208, 0, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(250, 208, 0, 0.2)',
    
    // Modal
    modalBackground: '#2D2B55',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#1E1E3F',
    modalHeaderText: '#FFFFFF',
    modalFooterBackground: '#1E1E3F',
  }
};

export default shadesOfPurpleTheme;
