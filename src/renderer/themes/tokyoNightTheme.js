/**
 * Tokyo Night Theme
 * 
 * A visually captivating theme inspired by Tokyo's nighttime cityscape.
 * Features low-contrast UI elements to minimize distractions.
 * @see https://marketplace.visualstudio.com/items?itemName=enkia.tokyo-night
 */

const tokyoNightTheme = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  colors: {
    // Base colors
    background: '#1a1b26',
    text: '#a9b1d6',
    textSecondary: '#565f89',
    primary: '#bb9af7',
    secondary: '#24283b',
    border: '#414868',
    
    // Status colors
    error: '#f7768e',
    errorLight: '#44252b',
    info: '#7dcfff',
    infoLight: '#2b4452',
    success: '#9ece6a',
    successLight: '#2b4434',
    warning: '#e0af68',
    warningLight: '#52442b',
    
    // Diff colors
    added: '#1d4e54',
    removed: '#692c3f',
    addedText: '#d8e6ff',
    removedText: '#ffe3eb',
    unchanged: '#1a1b26',
    
    // Navigation
    sidebar: '#16161e',
    sidebarText: '#a9b1d6',
    sidebarHover: '#24283b',
    sidebarActive: '#414868',
    headerBackground: '#24283b',
    headerText: '#c0caf5',
    
    // Buttons
    buttonBackground: '#7aa2f7',
    buttonText: '#1a1b26',
    buttonHover: '#89b4fa',
    buttonSecondary: '#24283b',
    buttonSecondaryText: '#a9b1d6',
    buttonSecondaryHover: '#414868',
    
    // Inputs
    inputBackground: '#16161e',
    inputText: '#a9b1d6',
    inputBorder: '#414868',
    inputFocusBorder: '#7aa2f7',
    checkboxChecked: '#7aa2f7',
    
    // Search components
    searchBarBackground: '#24283b',
    searchPlaceholderBackground: '#16161e',
    searchPlaceholderShadow: 'rgba(122, 162, 247, 0.2)',
    searchPlaceholderHeading: '#7aa2f7',
    searchPlaceholderText: '#565f89',
    searchPlaceholderIcon: '#7dcfff',
    searchResultBackground: '#24283b',
    searchResultBackgroundHover: '#414868',
    searchResultFilenameText: '#a9b1d6',
    searchResultFilenameBackground: 'rgba(122, 162, 247, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(122, 162, 247, 0.2)',
    
    // Modal
    modalBackground: '#1a1b26',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
    modalHeaderBackground: '#24283b',
    modalHeaderText: '#c0caf5',
    modalFooterBackground: '#24283b',
    
    // Accent colors for different buttons
    accent1: '#ff9e64',          // Settings button - Orange
    accent1Text: '#1a1b26',
    accent1Hover: '#ff7a30',
    
    accent2: '#f7768e',          // Search button - Pink/Red
    accent2Text: '#1a1b26',
    accent2Hover: '#e05a7a',
    
    accent3: '#7dcfff',          // Compare button - Light Blue
    accent3Text: '#1a1b26',
    accent3Hover: '#5ab9eb',
    
    // Keywords button - Bright Green
    keywordsButtonBg: '#2ac3de',       // Bright cyan/teal
    keywordsButtonText: '#1a1b26',
    keywordsButtonHover: '#0da2c4',
    keywordsButtonActiveBg: '#0db9d7',
    keywordsButtonActiveText: '#1a1b26',
    keywordsButtonActiveHover: '#0a8fb0',
    
    // Keyword List button - Vibrant Yellow/Gold
    keywordListButtonBg: '#e0af68',    // Gold
    keywordListButtonText: '#1a1b26',
    keywordListButtonHover: '#c99a4f'
  }
};

export default tokyoNightTheme;
