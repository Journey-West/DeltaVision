/**
 * Solarized Light Theme
 * 
 * A light theme with carefully selected colors and consistent contrast ratios.
 * Based on the popular Solarized color scheme by Ethan Schoonover.
 */

const solarizedLightTheme = {
  id: 'solarizedLight',
  name: 'Solarized Light',
  colors: {
    // Base colors
    background: '#fdf6e3', // base3
    text: '#657b83', // base00
    textSecondary: '#93a1a1', // base1
    primary: '#268bd2', // blue
    secondary: '#eee8d5', // base2
    border: '#93a1a1', // base1
    
    // Status colors
    error: '#dc322f', // red
    errorLight: '#fdf6e3', // base3 with red tint
    info: '#268bd2', // blue
    infoLight: '#eee8d5', // base2 with blue tint
    success: '#859900', // green
    successLight: '#eee8d5', // base2 with green tint
    warning: '#b58900', // yellow
    warningLight: '#eee8d5', // base2 with yellow tint
    
    // Diff colors
    added: '#e6ffed',
    removed: '#ffeef0',
    addedText: '#859900', // green
    removedText: '#dc322f', // red
    unchanged: '#fdf6e3', // base3
    
    // Navigation
    sidebar: '#eee8d5', // base2
    sidebarText: '#657b83', // base00
    sidebarHover: '#fdf6e3', // base3
    sidebarActive: '#93a1a1', // base1
    headerBackground: '#073642', // base02
    headerText: '#fdf6e3', // base3
    
    // Buttons
    buttonBackground: '#268bd2', // blue
    buttonText: '#fdf6e3', // base3
    buttonHover: '#2aa198', // cyan
    buttonSecondary: '#eee8d5', // base2
    buttonSecondaryText: '#657b83', // base00
    buttonSecondaryHover: '#fdf6e3', // base3
    
    // Inputs
    inputBackground: '#fdf6e3', // base3
    inputText: '#657b83', // base00
    inputBorder: '#93a1a1', // base1
    inputFocusBorder: '#268bd2', // blue
    checkboxChecked: '#268bd2', // blue
    
    // Search components
    searchBarBackground: '#eee8d5', // base2
    searchPlaceholderBackground: '#fdf6e3', // base3
    searchPlaceholderShadow: 'rgba(0, 0, 0, 0.05)',
    searchPlaceholderHeading: '#657b83', // base00
    searchPlaceholderText: '#93a1a1', // base1
    searchPlaceholderIcon: '#268bd2', // blue
    searchResultBackground: '#fdf6e3', // base3
    searchResultBackgroundHover: '#eee8d5', // base2
    searchResultFilenameText: '#657b83', // base00
    searchResultFilenameBackground: 'rgba(38, 139, 210, 0.1)', // blue with transparency
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    
    // Modal
    modalBackground: '#fdf6e3', // base3
    modalOverlay: 'rgba(0, 43, 54, 0.5)', // base03 with transparency
    modalHeaderBackground: '#eee8d5', // base2
    modalHeaderText: '#657b83', // base00
    modalFooterBackground: '#eee8d5', // base2
  }
};

export default solarizedLightTheme;
