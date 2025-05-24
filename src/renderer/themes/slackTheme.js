/**
 * Slack Theme
 * 
 * A theme inspired by Slack's default dark mode colors.
 * Based on the Slack Theme by Felipe Mendes.
 * @see https://marketplace.visualstudio.com/items?itemName=felipe-mendes.slack-theme
 */

const slackTheme = {
  id: 'slack',
  name: 'Slack',
  colors: {
    // Base colors
    background: '#1F2335',
    text: '#E5E8E8',
    textSecondary: '#9DA5B4',
    primary: '#4A9DF6',
    secondary: '#2C3245',
    border: '#9DA5B4',
    
    // Status colors
    error: '#E01E5A',
    errorLight: '#44252B',
    info: '#4A9DF6',
    infoLight: '#2B4452',
    success: '#2EB67D',
    successLight: '#2B4434',
    warning: '#ECB22E',
    warningLight: '#52442B',
    
    // Diff colors
    added: '#2A5834',
    removed: '#862A33',
    addedText: '#2EB67D',
    removedText: '#E01E5A',
    unchanged: '#1F2335',
    
    // Navigation
    sidebar: '#19202E',
    sidebarText: '#E5E8E8',
    sidebarHover: '#2C3245',
    sidebarActive: '#4A9DF6',
    headerBackground: '#2C3245',
    headerText: '#E5E8E8',
    
    // Buttons
    buttonBackground: '#4A9DF6',
    buttonText: '#1F2335',
    buttonHover: '#3F8AD6',
    buttonSecondary: '#2C3245',
    buttonSecondaryText: '#E5E8E8',
    buttonSecondaryHover: '#9DA5B4',
    
    // Inputs
    inputBackground: '#19202E',
    inputText: '#E5E8E8',
    inputBorder: '#9DA5B4',
    inputFocusBorder: '#4A9DF6',
    checkboxChecked: '#4A9DF6',
    
    // Search components
    searchBarBackground: '#2C3245',
    searchPlaceholderBackground: '#19202E',
    searchPlaceholderShadow: 'rgba(74, 157, 246, 0.2)',
    searchPlaceholderHeading: '#4A9DF6',
    searchPlaceholderText: '#9DA5B4',
    searchPlaceholderIcon: '#4A9DF6',
    searchResultBackground: '#2C3245',
    searchResultBackgroundHover: '#9DA5B4',
    searchResultFilenameText: '#E5E8E8',
    searchResultFilenameBackground: 'rgba(74, 157, 246, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(74, 157, 246, 0.2)',
    
    // Modal
    modalBackground: '#1F2335',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#2C3245',
    modalHeaderText: '#E5E8E8',
    modalFooterBackground: '#2C3245',
  }
};

export default slackTheme;
