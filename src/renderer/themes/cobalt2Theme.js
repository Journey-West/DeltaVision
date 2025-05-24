/**
 * Cobalt2 Theme
 * 
 * A Cobalt2 theme for VS Code.
 * Based on the Cobalt2 theme by Wes Bos.
 * @see https://marketplace.visualstudio.com/items?itemName=wesbos.theme-cobalt2
 */

const cobalt2Theme = {
  id: 'cobalt2',
  name: 'Cobalt2',
  colors: {
    // Base colors
    background: '#193549',
    text: '#FFFFFF',
    textSecondary: '#7D8CA6',
    primary: '#FFC600',
    secondary: '#15232D',
    border: '#7D8CA6',
    
    // Status colors
    error: '#FF2C96',
    errorLight: '#44252B',
    info: '#9EFFFF',
    infoLight: '#2B4452',
    success: '#3AD900',
    successLight: '#2B4434',
    warning: '#FF9D00',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#3AD900',
    removedText: '#FF2C96',
    unchanged: '#193549',
    
    // Navigation
    sidebar: '#15232D',
    sidebarText: '#FFFFFF',
    sidebarHover: '#0D3A58',
    sidebarActive: '#FFC600',
    headerBackground: '#15232D',
    headerText: '#FFFFFF',
    
    // Buttons
    buttonBackground: '#FFC600',
    buttonText: '#193549',
    buttonHover: '#FF9D00',
    buttonSecondary: '#15232D',
    buttonSecondaryText: '#FFFFFF',
    buttonSecondaryHover: '#0D3A58',
    
    // Inputs
    inputBackground: '#15232D',
    inputText: '#FFFFFF',
    inputBorder: '#7D8CA6',
    inputFocusBorder: '#FFC600',
    checkboxChecked: '#FFC600',
    
    // Search components
    searchBarBackground: '#15232D',
    searchPlaceholderBackground: '#15232D',
    searchPlaceholderShadow: 'rgba(255, 198, 0, 0.2)',
    searchPlaceholderHeading: '#FFC600',
    searchPlaceholderText: '#7D8CA6',
    searchPlaceholderIcon: '#9EFFFF',
    searchResultBackground: '#15232D',
    searchResultBackgroundHover: '#0D3A58',
    searchResultFilenameText: '#FFFFFF',
    searchResultFilenameBackground: 'rgba(255, 198, 0, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(255, 198, 0, 0.2)',
    
    // Modal
    modalBackground: '#193549',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#15232D',
    modalHeaderText: '#FFFFFF',
    modalFooterBackground: '#15232D',
  }
};

export default cobalt2Theme;
