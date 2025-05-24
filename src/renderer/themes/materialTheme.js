/**
 * Material Theme
 * 
 * The most epic theme for Visual Studio Code.
 * Based on the Material Theme by Mattia Astorino.
 * @see https://marketplace.visualstudio.com/items?itemName=Equinusocio.vsc-material-theme
 */

const materialTheme = {
  id: 'material',
  name: 'Material',
  colors: {
    // Base colors (using Material Palenight)
    background: '#292D3E',
    text: '#A6ACCD',
    textSecondary: '#676E95',
    primary: '#82AAFF',
    secondary: '#444267',
    border: '#676E95',
    
    // Status colors
    error: '#FF5370',
    errorLight: '#44252B',
    info: '#82AAFF',
    infoLight: '#2B4452',
    success: '#C3E88D',
    successLight: '#2B4434',
    warning: '#FFCB6B',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#C3E88D',
    removedText: '#FF5370',
    unchanged: '#292D3E',
    
    // Navigation
    sidebar: '#1B1E2B',
    sidebarText: '#A6ACCD',
    sidebarHover: '#444267',
    sidebarActive: '#82AAFF',
    headerBackground: '#444267',
    headerText: '#A6ACCD',
    
    // Buttons
    buttonBackground: '#82AAFF',
    buttonText: '#292D3E',
    buttonHover: '#6B8EDB',
    buttonSecondary: '#444267',
    buttonSecondaryText: '#A6ACCD',
    buttonSecondaryHover: '#676E95',
    
    // Inputs
    inputBackground: '#1B1E2B',
    inputText: '#A6ACCD',
    inputBorder: '#676E95',
    inputFocusBorder: '#82AAFF',
    checkboxChecked: '#82AAFF',
    
    // Search components
    searchBarBackground: '#444267',
    searchPlaceholderBackground: '#1B1E2B',
    searchPlaceholderShadow: 'rgba(130, 170, 255, 0.2)',
    searchPlaceholderHeading: '#82AAFF',
    searchPlaceholderText: '#676E95',
    searchPlaceholderIcon: '#82AAFF',
    searchResultBackground: '#444267',
    searchResultBackgroundHover: '#676E95',
    searchResultFilenameText: '#A6ACCD',
    searchResultFilenameBackground: 'rgba(130, 170, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(130, 170, 255, 0.2)',
    
    // Modal
    modalBackground: '#292D3E',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#444267',
    modalHeaderText: '#A6ACCD',
    modalFooterBackground: '#444267',
  }
};

export default materialTheme;
