<script>
  import { theme } from '../themes';
  import { onMount, onDestroy } from 'svelte';
  
  // Update CSS variables when the theme changes
  $: if ($theme) {
    updateCssVariables($theme.colors);
  }
  
  function updateCssVariables(colors) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      const app = document.getElementById('app');
      
      // Create a complete colors object with defaults for any missing properties
      const completeColors = {
        // Base colors
        background: '#ffffff',
        text: '#333333',
        primary: '#4a90e2',
        primaryText: 'white',
        primaryHover: '#3a80d2',
        secondary: '#f5f5f5',
        border: '#e0e0e0',
        added: '#e6ffed',
        removed: '#ffeef0',
        addedText: '#22863a',
        removedText: '#cb2431',
        unchanged: '#ffffff',
        sidebar: '#f8f8f8',
        sidebarText: '#333333',
        sidebarHover: '#e8e8e8',
        sidebarActive: '#e0e0e0',
        headerBackground: '#e8e8e8',
        headerText: '#222222',
        buttonBackground: '#4a90e2',
        buttonText: '#ffffff',
        buttonHover: '#3a80d2',
        modalBackground: '#ffffff',
        modalOverlay: 'rgba(0, 0, 0, 0.5)',
        
        // Accent colors for different buttons
        accent1: '#f5923e',          // Settings button - Orange
        accent1Text: 'white',
        accent1Hover: '#e07d2e',
        
        accent2: '#9c27b0',          // Search button - Purple
        accent2Text: 'white',
        accent2Hover: '#7b1fa2',
        
        accent3: '#2196F3',          // Compare button - Blue
        accent3Text: 'white',
        accent3Hover: '#1976D2',
        
        // Keywords button - Cyan
        keywordsButtonBg: '#2ac3de',
        keywordsButtonText: '#1a1b26',
        keywordsButtonHover: '#0da2c4',
        keywordsButtonActiveBg: '#0db9d7',
        keywordsButtonActiveText: '#1a1b26',
        keywordsButtonActiveHover: '#0a8fb0',
        
        // Keyword List button - Gold
        keywordListButtonBg: '#e0af68',
        keywordListButtonText: '#1a1b26',
        keywordListButtonHover: '#c99a4f',
        
        // Apply any colors from the theme
        ...colors
      };
      
      // Set all color variables using the complete colors object
      root.style.setProperty('--background', completeColors.background);
      root.style.setProperty('--text', completeColors.text);
      root.style.setProperty('--primary', completeColors.primary);
      root.style.setProperty('--secondary', completeColors.secondary);
      root.style.setProperty('--border', completeColors.border);
      root.style.setProperty('--added', completeColors.added);
      root.style.setProperty('--removed', completeColors.removed);
      root.style.setProperty('--added-text', completeColors.addedText);
      root.style.setProperty('--removed-text', completeColors.removedText);
      root.style.setProperty('--unchanged', completeColors.unchanged);
      root.style.setProperty('--sidebar', completeColors.sidebar);
      root.style.setProperty('--sidebar-text', completeColors.sidebarText);
      root.style.setProperty('--sidebar-hover', completeColors.sidebarHover);
      root.style.setProperty('--sidebar-active', completeColors.sidebarActive);
      root.style.setProperty('--header-background', completeColors.headerBackground);
      root.style.setProperty('--header-text', completeColors.headerText);
      root.style.setProperty('--button-background', completeColors.buttonBackground);
      root.style.setProperty('--button-text', completeColors.buttonText);
      root.style.setProperty('--button-hover', completeColors.buttonHover);
      
      // Primary button variables
      root.style.setProperty('--primaryText', completeColors.primaryText);
      root.style.setProperty('--primaryHover', completeColors.primaryHover);
      
      // Settings button variables
      root.style.setProperty('--accent1', completeColors.accent1);
      root.style.setProperty('--accent1Text', completeColors.accent1Text);
      root.style.setProperty('--accent1Hover', completeColors.accent1Hover);
      
      // Search button variables
      root.style.setProperty('--accent2', completeColors.accent2);
      root.style.setProperty('--accent2Text', completeColors.accent2Text);
      root.style.setProperty('--accent2Hover', completeColors.accent2Hover);
      
      // Compare button variables
      root.style.setProperty('--accent3', completeColors.accent3);
      root.style.setProperty('--accent3Text', completeColors.accent3Text);
      root.style.setProperty('--accent3Hover', completeColors.accent3Hover);
      
      // Keywords button variables
      root.style.setProperty('--keywordsButtonBg', completeColors.keywordsButtonBg);
      root.style.setProperty('--keywordsButtonText', completeColors.keywordsButtonText);
      root.style.setProperty('--keywordsButtonHover', completeColors.keywordsButtonHover);
      root.style.setProperty('--keywordsButtonActiveBg', completeColors.keywordsButtonActiveBg);
      root.style.setProperty('--keywordsButtonActiveText', completeColors.keywordsButtonActiveText);
      root.style.setProperty('--keywordsButtonActiveHover', completeColors.keywordsButtonActiveHover);
      
      // Keyword List button variables
      root.style.setProperty('--keywordListButtonBg', completeColors.keywordListButtonBg);
      root.style.setProperty('--keywordListButtonText', completeColors.keywordListButtonText);
      root.style.setProperty('--keywordListButtonHover', completeColors.keywordListButtonHover);
      root.style.setProperty('--modal-background', completeColors.modalBackground);
      root.style.setProperty('--modal-overlay', completeColors.modalOverlay);
      
      // Apply direct styling to body and app elements
      if (body) {
        body.style.backgroundColor = completeColors.background;
        body.style.color = completeColors.text;
      }
      
      if (app) {
        app.style.backgroundColor = completeColors.background;
        app.style.color = completeColors.text;
      }
      
      // Add a theme class to the root element
      root.classList.remove('theme-light', 'theme-dark');
      root.classList.add(`theme-${$theme.id}`);
    }
  }
  
  // Clean up function to remove inline styles when component is destroyed
  function cleanupStyles() {
    if (typeof document !== 'undefined') {
      const body = document.body;
      const app = document.getElementById('app');
      
      if (body) {
        body.style.backgroundColor = '';
        body.style.color = '';
      }
      
      if (app) {
        app.style.backgroundColor = '';
        app.style.color = '';
      }
    }
  }
  
  onMount(() => {
    // Apply initial theme
    updateCssVariables($theme.colors);
  });
  
  onDestroy(() => {
    cleanupStyles();
  });
</script>

<div class="theme-provider" style="display: contents;">
  <slot></slot>
</div>

<style>
  :global(body), :global(html) {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  :global(.theme-light) {
    /* Light theme base styles */
    --background: #ffffff;
    --text: #333333;
  }
  
  :global(.theme-dark) {
    /* Dark theme base styles */
    --background: #1e1e1e;
    --text: #e0e0e0;
  }
</style>
