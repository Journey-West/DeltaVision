/**
 * Night Owl/Light Owl Theme
 * 
 * A theme designed specifically for low-light and daylight conditions.
 * Optimized for accessibility and colorblind-friendly.
 * @see https://marketplace.visualstudio.com/items?itemName=sdras.night-owl
 */

const nightOwlTheme = {
  id: 'night-owl',
  name: 'Night Owl',
  colors: {
    // Base colors
    background: '#011627',
    text: '#d6deeb',
    textSecondary: '#637777',
    primary: '#82aaff',
    secondary: '#01121f',
    border: '#5f7e97',
    
    // Status colors
    error: '#ef5350',
    errorLight: '#44252b',
    info: '#82aaff',
    infoLight: '#2b4452',
    success: '#addb67',
    successLight: '#2b4434',
    warning: '#ffeb95',
    warningLight: '#52442b',
    
    // Diff colors
    added: '#2d4a14',
    removed: '#6b2625',
    addedText: '#e8ffcc',
    removedText: '#ffd0d0',
    unchanged: '#011627',
    
    // Navigation
    sidebar: '#011627',
    sidebarText: '#d6deeb',
    sidebarHover: '#0b2942',
    sidebarActive: '#5f7e97',
    headerBackground: '#0b2942',
    headerText: '#d6deeb',
    headerButtonText: '#000000',
    
    // Buttons
    buttonBackground: '#82aaff',
    buttonText: '#011627',
    buttonHover: '#c792ea',
    buttonSecondary: '#01121f',
    buttonSecondaryText: '#d6deeb',
    buttonSecondaryHover: '#0b2942',
    
    // Inputs
    inputBackground: '#0a0f14',
    inputText: '#d6deeb',
    inputBorder: '#5f7e97',
    inputFocusBorder: '#82aaff',
    checkboxChecked: '#82aaff',
    
    // Search components
    searchBarBackground: '#01121f',
    searchPlaceholderBackground: '#0a0f14',
    searchPlaceholderShadow: 'rgba(130, 170, 255, 0.2)',
    searchPlaceholderHeading: '#82aaff',
    searchPlaceholderText: '#637777',
    searchPlaceholderIcon: '#82aaff',
    searchResultBackground: '#01121f',
    searchResultBackgroundHover: '#0b2942',
    searchResultFilenameText: '#d6deeb',
    searchResultFilenameBackground: 'rgba(130, 170, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(130, 170, 255, 0.2)',
    
    // Modal
    modalBackground: '#011627',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    modalHeaderBackground: '#0b2942',
    modalHeaderText: '#d6deeb',
    modalFooterBackground: '#0b2942',
  }
};

const lightOwlTheme = {
  id: 'light-owl',
  name: 'Light Owl',
  colors: {
    // Base colors
    background: '#fbfbfb',
    text: '#403f53',
    textSecondary: '#90a7b2',
    primary: '#2aa298',
    secondary: '#f0f0f0',
    border: '#d9d9d9',
    
    // Status colors
    error: '#e0434c',
    errorLight: '#ffeef0',
    info: '#2aa298',
    infoLight: '#e6f7f5',
    success: '#4d8c4a',
    successLight: '#e8f5e9',
    warning: '#daaa01',
    warningLight: '#fef7e5',
    
    // Diff colors
    added: '#c9f5f0',
    removed: '#ffd0d0',
    addedText: '#0a6b63',
    removedText: '#a02c2c',
    unchanged: '#fbfbfb',
    
    // Navigation
    sidebar: '#F0F0F0',
    sidebarText: '#403f53',
    sidebarHover: '#E5E5E5',
    sidebarActive: '#D0D0D0',
    sidebarActiveText: '#000000',
    headerBackground: '#403f53',
    headerText: '#fbfbfb',
    
    // Buttons
    buttonBackground: '#2aa298',
    buttonText: '#fbfbfb',
    buttonHover: '#0b8b8f',
    buttonSecondary: '#f0f0f0',
    buttonSecondaryText: '#403f53',
    buttonSecondaryHover: '#d9d9d9',
    
    // Inputs
    inputBackground: '#ffffff',
    inputText: '#403f53',
    inputBorder: '#d9d9d9',
    inputFocusBorder: '#2aa298',
    checkboxChecked: '#2aa298',
    
    // Search components
    searchBarBackground: '#f0f0f0',
    searchPlaceholderBackground: '#ffffff',
    searchPlaceholderShadow: 'rgba(42, 162, 152, 0.2)',
    searchPlaceholderHeading: '#2aa298',
    searchPlaceholderText: '#90a7b2',
    searchPlaceholderIcon: '#2aa298',
    searchResultBackground: '#f0f0f0',
    searchResultBackgroundHover: '#d9d9d9',
    searchResultFilenameText: '#403f53',
    searchResultFilenameBackground: 'rgba(42, 162, 152, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(42, 162, 152, 0.1)',
    
    // Modal
    modalBackground: '#fbfbfb',
    modalOverlay: 'rgba(0, 0, 0, 0.4)',
    modalHeaderBackground: '#f0f0f0',
    modalHeaderText: '#403f53',
    modalFooterBackground: '#f0f0f0',
  }
};

export { nightOwlTheme, lightOwlTheme };
