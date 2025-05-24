/**
 * GitHub Theme
 * 
 * A theme that replicates the look and feel of GitHub's interface.
 * Available in light and dark variants.
 * @see https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme
 */

const githubLightTheme = {
  id: 'github-light',
  name: 'GitHub Light',
  colors: {
    // Base colors
    background: '#ffffff',
    text: '#24292e',
    textSecondary: '#6a737d',
    primary: '#0366d6',
    secondary: '#f6f8fa',
    border: '#e1e4e8',
    
    // Status colors
    error: '#d73a49',
    errorLight: '#ffeef0',
    info: '#0366d6',
    infoLight: '#f1f8ff',
    success: '#22863a',
    successLight: '#f0fff4',
    warning: '#b08800',
    warningLight: '#fffbdd',
    
    // Diff colors
    added: '#d4f7dd',
    removed: '#ffd7d5',
    addedText: '#044e1a',
    removedText: '#9a0c1c',
    unchanged: '#ffffff',
    
    // Navigation
    sidebar: '#f6f8fa',
    sidebarText: '#24292e',
    sidebarHover: '#e1e4e8',
    sidebarActive: '#0366d6',
    sidebarActiveText: '#ffffff',
    headerBackground: '#24292e',
    headerText: '#ffffff',
    headerButtonText: '#000000',
    
    // Buttons
    buttonBackground: '#0366d6',
    buttonText: '#ffffff',
    buttonHover: '#0250a0',
    buttonSecondary: '#fafbfc',
    buttonSecondaryText: '#24292e',
    buttonSecondaryHover: '#e1e4e8',
    
    // Inputs
    inputBackground: '#ffffff',
    inputText: '#24292e',
    inputBorder: '#e1e4e8',
    inputFocusBorder: '#0366d6',
    checkboxChecked: '#0366d6',
    
    // Search components
    searchBarBackground: '#f6f8fa',
    searchPlaceholderBackground: '#ffffff',
    searchPlaceholderShadow: 'rgba(3, 102, 214, 0.2)',
    searchPlaceholderHeading: '#0366d6',
    searchPlaceholderText: '#6a737d',
    searchPlaceholderIcon: '#0366d6',
    searchResultBackground: '#f6f8fa',
    searchResultBackgroundHover: '#e1e4e8',
    searchResultFilenameText: '#24292e',
    searchResultFilenameBackground: 'rgba(3, 102, 214, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    shadowLight: 'rgba(3, 102, 214, 0.1)',
    
    // Modal
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalHeaderBackground: '#f6f8fa',
    modalHeaderText: '#24292e',
    modalFooterBackground: '#f6f8fa',
  }
};

const githubDarkTheme = {
  id: 'github-dark',
  name: 'GitHub Dark',
  colors: {
    // Base colors
    background: '#0d1117',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    primary: '#58a6ff',
    secondary: '#161b22',
    border: '#30363d',
    
    // Status colors
    error: '#f85149',
    errorLight: '#3d1e20',
    info: '#58a6ff',
    infoLight: '#1e324d',
    success: '#3fb950',
    successLight: '#1e3426',
    warning: '#d29922',
    warningLight: '#3d2e1e',
    
    // Diff colors
    added: '#0a4d20',
    removed: '#7a1119',
    addedText: '#b9ffc8',
    removedText: '#ffcccf',
    unchanged: '#0d1117',
    
    // Navigation
    sidebar: '#161b22',
    sidebarText: '#c9d1d9',
    sidebarHover: '#21262d',
    sidebarActive: '#58a6ff',
    headerBackground: '#161b22',
    headerText: '#c9d1d9',
    headerButtonText: '#000000',
    
    // Buttons
    buttonBackground: '#238636',
    buttonText: '#ffffff',
    buttonHover: '#2ea043',
    buttonSecondary: '#21262d',
    buttonSecondaryText: '#c9d1d9',
    buttonSecondaryHover: '#30363d',
    
    // Inputs
    inputBackground: '#0d1117',
    inputText: '#c9d1d9',
    inputBorder: '#30363d',
    inputFocusBorder: '#58a6ff',
    checkboxChecked: '#58a6ff',
    
    // Search components
    searchBarBackground: '#161b22',
    searchPlaceholderBackground: '#0d1117',
    searchPlaceholderShadow: 'rgba(88, 166, 255, 0.2)',
    searchPlaceholderHeading: '#58a6ff',
    searchPlaceholderText: '#8b949e',
    searchPlaceholderIcon: '#58a6ff',
    searchResultBackground: '#161b22',
    searchResultBackgroundHover: '#21262d',
    searchResultFilenameText: '#c9d1d9',
    searchResultFilenameBackground: 'rgba(88, 166, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(88, 166, 255, 0.1)',
    
    // Modal
    modalBackground: '#0d1117',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalHeaderBackground: '#161b22',
    modalHeaderText: '#c9d1d9',
    modalFooterBackground: '#161b22',
  }
};

const githubTheme = githubDarkTheme; // Use the dark variant as the main GitHub theme

export { githubTheme, githubLightTheme, githubDarkTheme };
