class ThemeManager {
  constructor() {
    // Available themes with their names and css files
    this.themes = {
      'light': { name: 'Light', file: '/themes/light-theme.css' },
      'dark': { name: 'Dark', file: '/themes/dark-theme.css' },
      'vscode-dark': { name: 'VS Code Dark', file: '/themes/vscode-dark-theme.css' },
      'github-light': { name: 'GitHub Light', file: '/themes/github-light-theme.css' },
      'github-dark': { name: 'GitHub Dark', file: '/themes/github-dark-theme.css' },
      'solarized-light': { name: 'Solarized Light', file: '/themes/solarized-light-theme.css' },
      'solarized-dark': { name: 'Solarized Dark', file: '/themes/solarized-dark-theme.css' },
      'high-contrast': { name: 'High Contrast', file: '/themes/high-contrast-dark-theme.css' },
      'nord': { name: 'Nord', file: '/themes/nord-theme.css' },
      'synthwave': { name: 'Synthwave', file: '/themes/synthwave-theme.css' },
      'material': { name: 'Material', file: '/themes/material-theme.css' },
      // New themes
      'dracula': { name: 'Dracula', file: '/themes/dracula-theme.css' },
      'one-dark-pro': { name: 'One Dark Pro', file: '/themes/one-dark-pro-theme.css' },
      'tokyo-night': { name: 'Tokyo Night', file: '/themes/tokyo-night-theme.css' },
      'night-owl': { name: 'Night Owl', file: '/themes/night-owl-theme.css' },
      'ayu-light': { name: 'Ayu Light', file: '/themes/ayu-light-theme.css' },
      'quiet-light': { name: 'Quiet Light', file: '/themes/quiet-light-theme.css' },
      'monochrome': { name: 'Monochrome', file: '/themes/monochrome-theme.css' },
      'colorblind-friendly': { name: 'Colorblind Friendly', file: '/themes/colorblind-friendly-theme.css' },
      'winter': { name: 'Winter', file: '/themes/winter-theme.css' },
      'summer': { name: 'Summer', file: '/themes/summer-theme.css' },
      'autumn': { name: 'Autumn', file: '/themes/autumn-theme.css' },
      'witch-hazel': { name: 'Witch Hazel', file: '/themes/witch-hazel-theme.css' }
    };
    
    // Get saved theme or use default
    this.currentTheme = localStorage.getItem('selectedTheme') || 'nord';
    
    // Create theme stylesheet link
    this.themeLink = document.createElement('link');
    this.themeLink.rel = 'stylesheet';
    this.themeLink.id = 'theme-stylesheet';
    document.head.appendChild(this.themeLink);
    
    // Set up the existing theme button
    this.setupExistingThemeButton();
    
    // Load the saved or default theme
    this.loadTheme(this.currentTheme);
  }
  
  loadTheme(themeKey) {
    if (!this.themes[themeKey]) return;
    
    // Update theme stylesheet
    this.themeLink.href = this.themes[themeKey].file;
    
    // Save the selected theme
    localStorage.setItem('selectedTheme', themeKey);
    this.currentTheme = themeKey;
    
    // Update theme text if theme toggle exists
    const themeText = document.getElementById('theme-text');
    if (themeText) {
      themeText.textContent = this.themes[themeKey].name;
    }
  }
  
  setupExistingThemeButton() {
    // Find the existing theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      // Remove existing click events
      const newThemeToggle = themeToggle.cloneNode(true);
      themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);
      
      // Add click event to show theme selector modal
      newThemeToggle.addEventListener('click', () => this.showThemeSelector());
    }
  }
  
  showThemeSelector() {
    // Remove any existing modal
    const existingModal = document.getElementById('theme-selector-modal');
    if (existingModal) existingModal.remove();
    
    // Create modal backdrop
    const modal = document.createElement('div');
    modal.id = 'theme-selector-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'flex-start';
    modal.style.zIndex = '9999999';
    modal.style.padding = '60px 20px 20px 20px';
    
    // Create theme selector container
    const container = document.createElement('div');
    container.style.backgroundColor = 'var(--container-bg)';
    container.style.borderRadius = '8px';
    container.style.padding = '15px';
    container.style.minWidth = '300px';
    container.style.maxWidth = '400px';
    container.style.maxHeight = '80vh';
    container.style.overflowY = 'auto';
    container.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    container.style.position = 'absolute';
    container.style.top = '50px';
    container.style.right = '140px'; // Match the right position of the theme button
    
    // Add header
    const header = document.createElement('div');
    header.textContent = 'Select Theme';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.paddingBottom = '10px';
    header.style.marginBottom = '10px';
    header.style.fontWeight = 'bold';
    header.style.color = 'var(--text-primary)';
    container.appendChild(header);
    
    // Group the themes by categories
    const themeCategories = {
      'Dark Themes': ['dark', 'vscode-dark', 'github-dark', 'solarized-dark', 'dracula', 'one-dark-pro', 'tokyo-night', 'night-owl', 'nord', 'witch-hazel'],
      'Light Themes': ['light', 'github-light', 'solarized-light', 'ayu-light', 'quiet-light'],
      'Special Themes': ['high-contrast', 'monochrome', 'colorblind-friendly', 'synthwave', 'material'],
      'Seasonal': ['winter', 'summer', 'autumn']
    };
    
    // Add theme categories
    Object.entries(themeCategories).forEach(([categoryName, themeKeys]) => {
      // Add category header
      const categoryHeader = document.createElement('div');
      categoryHeader.textContent = categoryName;
      categoryHeader.style.fontWeight = 'bold';
      categoryHeader.style.fontSize = '0.9rem';
      categoryHeader.style.padding = '8px 0 4px 0';
      categoryHeader.style.color = 'var(--text-secondary)';
      categoryHeader.style.borderBottom = '1px solid var(--border-color)';
      categoryHeader.style.marginTop = '10px';
      container.appendChild(categoryHeader);
      
      // Add theme options in this category
      themeKeys.forEach(themeKey => {
        if (!this.themes[themeKey]) return; // Skip if theme doesn't exist
        
        const option = document.createElement('div');
        option.textContent = this.themes[themeKey].name;
        option.style.padding = '8px 10px';
        option.style.cursor = 'pointer';
        option.style.borderRadius = '4px';
        option.style.color = 'var(--text-primary)';
        option.style.display = 'flex';
        option.style.alignItems = 'center';
        option.style.justifyContent = 'space-between';
        option.style.margin = '2px 0';
        
        // Highlight current theme
        if (themeKey === this.currentTheme) {
          option.style.backgroundColor = 'var(--accent-color-transparent)';
          
          // Add checkmark
          const check = document.createElement('span');
          check.innerHTML = '✓';
          check.style.marginLeft = '10px';
          check.style.fontWeight = 'bold';
          option.appendChild(check);
        }
        
        option.addEventListener('mouseover', () => {
          option.style.backgroundColor = 'var(--hover-bg)';
        });
        
        option.addEventListener('mouseout', () => {
          if (themeKey === this.currentTheme) {
            option.style.backgroundColor = 'var(--accent-color-transparent)';
          } else {
            option.style.backgroundColor = '';
          }
        });
        
        option.addEventListener('click', () => {
          this.loadTheme(themeKey);
          modal.remove();
        });
        
        container.appendChild(option);
      });
    });
    
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    // Close when clicking outside the container
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();
