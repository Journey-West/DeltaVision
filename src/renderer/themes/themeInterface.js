/**
 * Theme Interface
 * 
 * This file defines the structure that all themes must follow.
 * It serves as documentation and a reference for creating new themes.
 */

/**
 * @typedef {Object} ThemeColors
 * 
 * Base Colors
 * @property {string} background - Main background color
 * @property {string} text - Main text color
 * @property {string} textSecondary - Secondary text color
 * @property {string} primary - Primary accent color
 * @property {string} secondary - Secondary background color
 * @property {string} border - Border color
 * @property {string} error - Error color
 * @property {string} errorLight - Light error background
 * @property {string} info - Info color
 * @property {string} infoLight - Light info background
 * @property {string} success - Success color
 * @property {string} successLight - Light success background
 * @property {string} warning - Warning color
 * @property {string} warningLight - Light warning background
 * 
 * Diff Specific
 * @property {string} added - Background color for added content
 * @property {string} removed - Background color for removed content
 * @property {string} addedText - Text color for added content
 * @property {string} removedText - Text color for removed content
 * @property {string} unchanged - Background color for unchanged content
 * 
 * Sidebar
 * @property {string} sidebar - Sidebar background color
 * @property {string} sidebarText - Sidebar text color
 * @property {string} sidebarHover - Sidebar hover background color
 * @property {string} sidebarActive - Sidebar active item background color
 * @property {string} sidebarActiveText - Sidebar active item text color
 * 
 * Header
 * @property {string} headerBackground - Header background color
 * @property {string} headerText - Header text color
 * 
 * Buttons
 * @property {string} buttonBackground - Primary button background color
 * @property {string} buttonText - Primary button text color
 * @property {string} buttonHover - Primary button hover background color
 * @property {string} buttonSecondary - Secondary button background color
 * @property {string} buttonSecondaryText - Secondary button text color
 * @property {string} buttonSecondaryHover - Secondary button hover background color
 * @property {string} headerButtonText - Text color for all header buttons
 * 
 * Inputs
 * @property {string} inputBackground - Input field background color
 * @property {string} inputText - Input field text color
 * @property {string} inputBorder - Input field border color
 * @property {string} inputFocusBorder - Input field focused border color
 * @property {string} checkboxChecked - Checkbox checked color
 * 
 * Search Components
 * @property {string} searchBarBackground - Search bar background color
 * @property {string} searchPlaceholderBackground - Search placeholder background color
 * @property {string} searchPlaceholderShadow - Search placeholder shadow color
 * @property {string} searchPlaceholderHeading - Search placeholder heading color
 * @property {string} searchPlaceholderText - Search placeholder text color
 * @property {string} searchPlaceholderIcon - Search placeholder icon color
 * @property {string} searchResultBackground - Search result item background color
 * @property {string} searchResultBackgroundHover - Search result item hover background color
 * @property {string} searchResultFilenameText - Search result filename text color
 * @property {string} searchResultFilenameBackground - Search result filename background color
 * @property {string} shadow - Standard shadow color
 * @property {string} shadowLight - Light shadow color
 * 
 * Modal
 * @property {string} modalBackground - Modal background color
 * @property {string} modalOverlay - Modal overlay color
 * @property {string} modalHeaderBackground - Modal header background color
 * @property {string} modalHeaderText - Modal header text color
 * @property {string} modalFooterBackground - Modal footer background color
 */

/**
 * @typedef {Object} Theme
 * @property {string} id - Unique theme identifier
 * @property {string} name - Human-readable theme name
 * @property {ThemeColors} colors - Theme color definitions
 */

/**
 * Base theme interface that all themes should implement
 * @type {Theme}
 */
export const themeInterface = {
  id: 'base',
  name: 'Base Theme',
  colors: {
    // Base Colors
    background: '',
    text: '',
    textSecondary: '',
    primary: '',
    secondary: '',
    border: '',
    error: '',
    errorLight: '',
    info: '',
    infoLight: '',
    success: '',
    successLight: '',
    warning: '',
    warningLight: '',
    
    // Diff Specific
    added: '',
    removed: '',
    addedText: '',
    removedText: '',
    unchanged: '',
    
    // Sidebar
    sidebar: '',
    sidebarText: '',
    sidebarHover: '',
    sidebarActive: '',
    sidebarActiveText: '',
    
    // Header
    headerBackground: '',
    headerText: '',
    
    // Buttons
    buttonBackground: '',
    buttonText: '',
    buttonHover: '',
    buttonSecondary: '',
    buttonSecondaryText: '',
    buttonSecondaryHover: '',
    headerButtonText: '',
    
    // Inputs
    inputBackground: '',
    inputText: '',
    inputBorder: '',
    inputFocusBorder: '',
    checkboxChecked: '',
    
    // Search Components
    searchBarBackground: '',
    searchPlaceholderBackground: '',
    searchPlaceholderShadow: '',
    searchPlaceholderHeading: '',
    searchPlaceholderText: '',
    searchPlaceholderIcon: '',
    searchResultBackground: '',
    searchResultBackgroundHover: '',
    searchResultFilenameText: '',
    searchResultFilenameBackground: '',
    shadow: '',
    shadowLight: '',
    
    // Modal
    modalBackground: '',
    modalOverlay: '',
    modalHeaderBackground: '',
    modalHeaderText: '',
    modalFooterBackground: '',
  }
};

/**
 * Function to validate if a theme implements the required interface
 * @param {Theme} theme - Theme to validate
 * @returns {boolean} - Whether the theme is valid
 */
export function validateTheme(theme) {
  // Basic structure validation
  if (!theme || typeof theme !== 'object') return false;
  if (!theme.id || !theme.name) return false;
  if (!theme.colors || typeof theme.colors !== 'object') return false;
  
  // Only check core required properties
  // This allows backward compatibility with existing themes
  const coreRequiredColors = [
    'background',
    'text',
    'primary',
    'secondary',
    'border',
    'added',
    'removed',
    'addedText',
    'removedText',
    'unchanged'
  ];
  
  // Check if all core required color properties exist
  return coreRequiredColors.every(color => 
    theme.colors.hasOwnProperty(color) && 
    typeof theme.colors[color] === 'string'
  );
}
