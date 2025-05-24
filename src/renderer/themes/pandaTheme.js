/**
 * Panda Syntax Theme
 * 
 * A superminimal, dark syntax theme for VS Code.
 * Based on the Panda Syntax theme by Siamak Mokhtari.
 * @see https://marketplace.visualstudio.com/items?itemName=tinkertrain.theme-panda
 */

const pandaTheme = {
  id: 'panda',
  name: 'Panda',
  colors: {
    // Base colors
    background: '#292A2B',
    text: '#E6E6E6',
    textSecondary: '#676B79',
    primary: '#FF75B5',
    secondary: '#34353A',
    border: '#676B79',
    
    // Status colors
    error: '#FF4B82',
    errorLight: '#44252B',
    info: '#6FC1FF',
    infoLight: '#2B4452',
    success: '#19F9D8',
    successLight: '#2B4434',
    warning: '#FFB86C',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#19F9D8',
    removedText: '#FF4B82',
    unchanged: '#292A2B',
    
    // Navigation
    sidebar: '#1D1E1F',
    sidebarText: '#E6E6E6',
    sidebarHover: '#34353A',
    sidebarActive: '#FF75B5',
    headerBackground: '#34353A',
    headerText: '#E6E6E6',
    
    // Buttons
    buttonBackground: '#FF75B5',
    buttonText: '#292A2B',
    buttonHover: '#FF4B82',
    buttonSecondary: '#34353A',
    buttonSecondaryText: '#E6E6E6',
    buttonSecondaryHover: '#676B79',
    
    // Inputs
    inputBackground: '#1D1E1F',
    inputText: '#E6E6E6',
    inputBorder: '#676B79',
    inputFocusBorder: '#FF75B5',
    checkboxChecked: '#FF75B5',
    
    // Search components
    searchBarBackground: '#34353A',
    searchPlaceholderBackground: '#1D1E1F',
    searchPlaceholderShadow: 'rgba(255, 117, 181, 0.2)',
    searchPlaceholderHeading: '#FF75B5',
    searchPlaceholderText: '#676B79',
    searchPlaceholderIcon: '#6FC1FF',
    searchResultBackground: '#34353A',
    searchResultBackgroundHover: '#676B79',
    searchResultFilenameText: '#E6E6E6',
    searchResultFilenameBackground: 'rgba(255, 117, 181, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(255, 117, 181, 0.2)',
    
    // Modal
    modalBackground: '#292A2B',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#34353A',
    modalHeaderText: '#E6E6E6',
    modalFooterBackground: '#34353A',
  }
};

export default pandaTheme;
