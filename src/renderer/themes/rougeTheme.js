/**
 * Rouge Theme
 * 
 * A warm and cozy dark theme with a flushed color palette.
 * Inspired by the Rouge theme for VSCode by Josef Aidt.
 * @see https://marketplace.visualstudio.com/items?itemName=rouge-theme.rouge
 */

const rougeTheme = {
  id: 'rouge',
  name: 'Rouge',
  colors: {
    // Base colors
    background: '#172030',       // Dark blue-gray background
    text: '#E0E0E0',             // Light gray text
    textSecondary: '#7989a1',    // Secondary text color
    primary: '#c6797e',          // Rouge/rose primary color
    secondary: '#1f2a3f',        // Slightly lighter background for contrast
    border: '#2c3852',           // Subtle border color
    
    // Status colors
    error: '#c6797e',            // Rouge/rose for errors
    errorLight: '#44252b',
    info: '#569cd6',             // Blue for info
    infoLight: '#2b4452',
    success: '#4ec9b0',          // Teal for success
    successLight: '#2b4434',
    warning: '#e69a4c',          // Orange for warnings
    warningLight: '#52442b',
    
    // Diff colors
    added: '#133246',            // Muted blue for added content
    removed: '#4b2234',          // Muted red for removed content
    addedText: '#8ec5e0',        // Light blue text for added content
    removedText: '#e0a0b8',      // Light pink text for removed content
    unchanged: '#172030',        // Same as background
    
    // Navigation
    sidebar: '#131a29',          // Darker sidebar
    sidebarText: '#E0E0E0',      // Light gray sidebar text
    sidebarHover: '#1f2a3f',     // Slightly lighter on hover
    sidebarActive: '#2c3852',    // Highlighted when active
    headerBackground: '#1f2a3f', // Slightly lighter header
    headerText: '#E0E0E0',       // Light gray header text
    
    // Buttons
    buttonBackground: '#2c3852', // Default button background
    buttonText: '#E0E0E0',       // Default button text
    buttonHover: '#3a4a6b',      // Lighter on hover
    buttonSecondary: '#1f2a3f',  // Secondary button background
    buttonSecondaryText: '#E0E0E0', // Secondary button text
    buttonSecondaryHover: '#2c3852', // Secondary button hover
    
    // Inputs
    inputBackground: '#131a29',  // Input background
    inputText: '#E0E0E0',        // Input text
    inputBorder: '#2c3852',      // Input border
    inputFocusBorder: '#c6797e', // Input focus border
    checkboxChecked: '#c6797e',  // Checkbox checked
    
    // Search components
    searchBarBackground: '#1f2a3f',
    searchPlaceholderBackground: '#131a29',
    searchPlaceholderShadow: 'rgba(198, 121, 126, 0.2)',
    searchPlaceholderHeading: '#c6797e',
    searchPlaceholderText: '#7989a1',
    searchPlaceholderIcon: '#569cd6',
    searchResultBackground: '#1f2a3f',
    searchResultBackgroundHover: '#2c3852',
    searchResultFilenameText: '#E0E0E0',
    searchResultFilenameBackground: 'rgba(198, 121, 126, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(198, 121, 126, 0.2)',
    
    // Modal
    modalBackground: '#172030',  // Same as main background
    modalOverlay: 'rgba(0, 0, 0, 0.7)', // Darker overlay for modals
    modalHeaderBackground: '#1f2a3f',
    modalHeaderText: '#E0E0E0',
    modalFooterBackground: '#1f2a3f',
    
    // Accent colors for different buttons
    accent1: '#e69a4c',          // Settings button - Orange
    accent1Text: '#ffffff',
    accent1Hover: '#d38a3c',
    
    accent2: '#9a86fd',          // Search button - Purple
    accent2Text: '#ffffff',
    accent2Hover: '#8a76ed',
    
    accent3: '#4ec9b0',          // Compare button - Teal
    accent3Text: '#ffffff',
    accent3Hover: '#3eb9a0',
    
    // Keywords button - Blue
    keywordsButtonBg: '#569cd6',
    keywordsButtonText: '#ffffff',
    keywordsButtonHover: '#4a8cc6',
    keywordsButtonActiveBg: '#4a8cc6',
    keywordsButtonActiveText: '#ffffff',
    keywordsButtonActiveHover: '#3a7cb6',
    
    // Keyword List button - Gold
    keywordListButtonBg: '#d7ba7d',
    keywordListButtonText: '#172030',
    keywordListButtonHover: '#c7aa6d'
  }
};

export default rougeTheme;
