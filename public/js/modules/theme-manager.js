// Theme manager module
export function initThemeManager() {
    // Default themes will be merged with any loaded themes
    const defaultThemes = {
        'tokyo-night': {
            name: 'Tokyo Night',
            author: 'DeltaVision',
            description: 'A dark theme inspired by Tokyo at night',
            category: 'dark',
            variables: {
                '--background-color': '#1a1b26',
                '--container-bg': '#24283b',
                '--header-bg': '#16161e',
                '--header-text': '#a9b1d6',
                '--text-color': '#a9b1d6',
                '--text-muted': '#787c99',
                '--accent-color': '#7aa2f7',
                '--primary-color': '#7aa2f7',
                '--primary-darker': '#5a7ad2',
                '--primary-rgb': '122, 162, 247',
                '--primary-transparent': 'rgba(122, 162, 247, 0.1)',
                '--secondary-color': '#9ece6a',
                '--border-color': '#3b4261',
                '--sidebar-bg': '#16161e',
                '--file-entry-bg': '#1a1b26',
                '--file-entry-hover': '#292e42',
                '--card-shadow': '0 2px 10px rgba(0, 0, 0, 0.3)',
                '--tooltip-bg': '#24283b',
                '--tooltip-text': '#a9b1d6',
                '--transition-speed': '0.3s',
                '--added-color': '#9ece6a',
                '--removed-color': '#f7768e',
                '--bg-secondary': '#1f2335',
                '--bg-tertiary': '#292e42',
                
                /* Keywords panel specific variables */
                '--keyword-panel-bg': 'linear-gradient(to bottom, #24283b 0%, #1f2335 100%)',
                '--keyword-panel-header-bg': '#16161e',
                '--keyword-panel-border': '#3b4261',
                '--keyword-panel-shadow': '0 4px 20px rgba(0, 0, 0, 0.35)',
                '--keyword-item-bg': 'rgba(255, 255, 255, 0.05)',
                '--keyword-item-hover-bg': '#292e42',
                '--keyword-item-active-bg': 'rgba(122, 162, 247, 0.1)',
                '--keyword-count-bg': 'rgba(255, 255, 255, 0.1)',
                '--keyword-count-old': '#f7768e',
                '--keyword-count-new': '#9ece6a',
                '--keyword-count-separator': '#787c99'
            }
        },
        'dracula': {
            name: 'Dracula',
            author: 'DeltaVision',
            description: 'A dark theme based on the Dracula color scheme',
            category: 'dark',
            variables: {
                '--background-color': '#282a36',
                '--container-bg': '#2d313b',
                '--header-bg': '#22212c',
                '--header-text': '#f8f8f2',
                '--text-color': '#f8f8f2',
                '--text-muted': '#999999',
                '--accent-color': '#ff79c6',
                '--primary-color': '#bd93f9',
                '--primary-darker': '#9e72f9',
                '--primary-rgb': '189, 147, 249',
                '--primary-transparent': 'rgba(189, 147, 249, 0.1)',
                '--secondary-color': '#50fa7b',
                '--border-color': '#44475a',
                '--sidebar-bg': '#22212c',
                '--file-entry-bg': '#282a36',
                '--file-entry-hover': '#32343f',
                '--card-shadow': '0 2px 10px rgba(0, 0, 0, 0.3)',
                '--tooltip-bg': '#2d313b',
                '--tooltip-text': '#f8f8f2',
                '--transition-speed': '0.3s',
                '--added-color': '#50fa7b',
                '--removed-color': '#ff5555',
                '--bg-secondary': '#2d313b',
                '--bg-tertiary': '#383a47',
                
                /* Keywords panel specific variables */
                '--keyword-panel-bg': 'linear-gradient(to bottom, #2d313b 0%, #383a47 100%)',
                '--keyword-panel-header-bg': '#22212c',
                '--keyword-panel-border': '#44475a',
                '--keyword-panel-shadow': '0 4px 20px rgba(0, 0, 0, 0.35)',
                '--keyword-item-bg': 'rgba(255, 255, 255, 0.05)',
                '--keyword-item-hover-bg': '#32343f',
                '--keyword-item-active-bg': 'rgba(189, 147, 249, 0.1)',
                '--keyword-count-bg': 'rgba(255, 255, 255, 0.1)',
                '--keyword-count-old': '#ff5555',
                '--keyword-count-new': '#50fa7b',
                '--keyword-count-separator': '#999999'
            }
        },
        'ayu-light': {
            name: 'Ayu Light',
            author: 'DeltaVision',
            description: 'A light theme inspired by the Ayu color scheme',
            category: 'light',
            variables: {
                '--background-color': '#fcfcfc',
                '--container-bg': '#ffffff',
                '--header-bg': '#fafafa',
                '--header-text': '#5c6773',
                '--text-color': '#5c6773',
                '--text-muted': '#8a9199',
                '--accent-color': '#ff9940',
                '--primary-color': '#55b4d4',
                '--primary-darker': '#399cbf',
                '--primary-rgb': '85, 180, 212',
                '--primary-transparent': 'rgba(85, 180, 212, 0.1)',
                '--secondary-color': '#86b300',
                '--border-color': '#e2e4e7',
                '--sidebar-bg': '#f0f0f0',
                '--file-entry-bg': '#ffffff',
                '--file-entry-hover': '#f5f5f5',
                '--card-shadow': '0 2px 10px rgba(0, 0, 0, 0.05)',
                '--tooltip-bg': '#ffffff',
                '--tooltip-text': '#5c6773',
                '--transition-speed': '0.3s',
                '--added-color': '#86b300',
                '--removed-color': '#ff3333',
                '--bg-secondary': '#f0f0f0',
                '--bg-tertiary': '#e8e8e8',
                
                /* Keywords panel specific variables */
                '--keyword-panel-bg': 'linear-gradient(to bottom, #fafbff 0%, #f5f7fc 100%)',
                '--keyword-panel-header-bg': '#f5f8ff',
                '--keyword-panel-border': '#e0e4f0',
                '--keyword-panel-shadow': '0 4px 20px rgba(0, 0, 0, 0.1)',
                '--keyword-item-bg': 'rgba(0, 0, 0, 0.05)',
                '--keyword-item-hover-bg': '#f0f0f0',
                '--keyword-item-active-bg': 'rgba(85, 180, 212, 0.1)',
                '--keyword-count-bg': 'rgba(0, 0, 0, 0.1)',
                '--keyword-count-old': '#b71c1c',
                '--keyword-count-new': '#1b5e20',
                '--keyword-count-separator': '#8a9199'
            }
        }
    };
    
    // Store all available themes (default + loaded)
    let availableThemes = { ...defaultThemes };
    
    // Function to register a new theme
    function registerTheme(themeId, themeConfig) {
        if (!themeId || typeof themeId !== 'string') {
            console.error('Invalid theme ID provided');
            return false;
        }
        
        if (!themeConfig || typeof themeConfig !== 'object') {
            console.error('Invalid theme configuration');
            return false;
        }
        
        if (!themeConfig.name || !themeConfig.variables) {
            console.error('Theme must include a name and variables');
            return false;
        }
        
        // Add default metadata if not provided
        themeConfig.author = themeConfig.author || 'Unknown';
        themeConfig.description = themeConfig.description || '';
        themeConfig.category = themeConfig.category || 'custom';
        
        // Register the theme
        availableThemes[themeId] = themeConfig;
        
        // If theme selector exists, update it
        updateThemeSelector();
        
        return true;
    }
    
    // Function to load a theme from an external JSON file
    async function loadThemeFromFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load theme: ${response.statusText}`);
            }
            
            const themeData = await response.json();
            if (!themeData.id || !themeData.theme) {
                throw new Error('Invalid theme format: missing id or theme object');
            }
            
            return registerTheme(themeData.id, themeData.theme);
        } catch (error) {
            console.error('Error loading theme:', error);
            return false;
        }
    }
    
    // Function to apply a theme
    function applyTheme(themeId) {
        const theme = availableThemes[themeId];
        if (!theme) {
            console.error(`Theme not found: ${themeId}`);
            return false;
        }
        
        // Apply CSS variables to root
        const root = document.documentElement;
        for (const [property, value] of Object.entries(theme.variables)) {
            root.style.setProperty(property, value);
        }
        
        // Save selected theme to localStorage
        localStorage.setItem('selectedTheme', themeId);
        
        // Update theme toggle button
        updateThemeToggle(themeId);
        
        // Mark the selected theme in the selector
        updateSelectedThemeInSelector(themeId);
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themechange', { 
            detail: { themeId, theme } 
        }));
        
        return true;
    }
    
    // Function to get theme toggle button icon based on theme category
    function getThemeToggleIcon(themeId) {
        const theme = availableThemes[themeId];
        if (!theme) return '';
        
        // Use sun icon for light themes, moon for dark themes
        if (theme.category === 'light') {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        } else {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        }
    }
    
    // Update the theme toggle button
    function updateThemeToggle(themeId) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = getThemeToggleIcon(themeId);
            
            // Update tooltip to show current theme name
            const themeName = availableThemes[themeId]?.name || themeId;
            themeToggle.setAttribute('title', `Current theme: ${themeName}`);
        }
    }
    
    // Create and manage a theme selector dropdown
    function createThemeSelector() {
        // Check if selector already exists
        let themeSelector = document.getElementById('themeSelector');
        
        if (!themeSelector) {
            // Create the theme selector element
            themeSelector = document.createElement('div');
            themeSelector.id = 'themeSelector';
            themeSelector.className = 'theme-selector';
            
            // Add it to the header after the theme toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle && themeToggle.parentNode) {
                themeToggle.parentNode.insertBefore(themeSelector, themeToggle.nextSibling);
            } else {
                // Fallback - add to the header
                const header = document.querySelector('header');
                if (header) {
                    header.appendChild(themeSelector);
                }
            }
        }
        
        return themeSelector;
    }
    
    // Update the theme selector with available themes
    function updateThemeSelector() {
        const themeSelector = createThemeSelector();
        if (!themeSelector) return;
        
        // Clear existing content
        themeSelector.innerHTML = '';
        
        // Create select element
        const select = document.createElement('select');
        select.className = 'theme-select';
        select.setAttribute('aria-label', 'Select theme');
        
        // Group themes by category
        const categories = {};
        Object.entries(availableThemes).forEach(([id, theme]) => {
            const category = theme.category || 'custom';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ id, theme });
        });
        
        // Create option groups
        Object.entries(categories).forEach(([category, themes]) => {
            const group = document.createElement('optgroup');
            group.label = category.charAt(0).toUpperCase() + category.slice(1);
            
            // Add theme options
            themes.forEach(({ id, theme }) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = theme.name;
                option.title = theme.description;
                group.appendChild(option);
            });
            
            select.appendChild(group);
        });
        
        // Add change event listener
        select.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
        
        // Update selected value
        const currentTheme = getCurrentTheme();
        select.value = currentTheme;
        
        themeSelector.appendChild(select);
    }
    
    // Update the selected theme in the selector
    function updateSelectedThemeInSelector(themeId) {
        const select = document.querySelector('.theme-select');
        if (select) {
            select.value = themeId;
        }
    }
    
    // Get the current theme
    function getCurrentTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        return savedTheme && availableThemes[savedTheme] ? savedTheme : 'tokyo-night';
    }
    
    // Set up the theme toggle button
    function initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                const currentTheme = getCurrentTheme();
                const themeIds = Object.keys(availableThemes);
                
                // Find current theme index
                const currentIndex = themeIds.indexOf(currentTheme);
                
                // Get next theme (or first theme if at the end)
                const nextIndex = (currentIndex + 1) % themeIds.length;
                const nextTheme = themeIds[nextIndex];
                
                applyTheme(nextTheme);
            });
        }
    }
    
    // Export theme to JSON
    function exportTheme(themeId) {
        const theme = availableThemes[themeId];
        if (!theme) return null;
        
        return JSON.stringify({
            id: themeId,
            theme: {
                name: theme.name,
                author: theme.author,
                description: theme.description,
                category: theme.category,
                variables: { ...theme.variables }
            }
        }, null, 2);
    }
    
    // Create a new theme based on current CSS variables
    function createThemeFromCurrent(themeId, themeName, options = {}) {
        if (!themeId || !themeName) {
            console.error('Theme ID and name are required');
            return false;
        }
        
        const variables = {};
        const computedStyle = getComputedStyle(document.documentElement);
        
        // Get all CSS variables starting with '--'
        for (const prop of computedStyle) {
            if (prop.startsWith('--')) {
                variables[prop] = computedStyle.getPropertyValue(prop).trim();
            }
        }
        
        return registerTheme(themeId, {
            name: themeName,
            author: options.author || 'User',
            description: options.description || 'Custom theme',
            category: options.category || 'custom',
            variables
        });
    }
    
    // Initialize the theme manager
    function init() {
        // Load and apply the saved theme or default
        const savedTheme = getCurrentTheme();
        applyTheme(savedTheme);
        
        // Initialize the theme toggle
        initThemeToggle();
        
        // Initialize the theme selector
        updateThemeSelector();
        
        // Create and inject the theme stylesheet
        const styleSheet = document.createElement('style');
        styleSheet.id = 'theme-stylesheet';
        document.head.appendChild(styleSheet);
        
        // Inject CSS for theme selector
        styleSheet.textContent = `
            .theme-selector {
                margin-left: 8px;
                position: relative;
            }
            
            .theme-select {
                background-color: var(--bg-secondary);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                outline: none;
                max-width: 150px;
                transition: all 0.2s ease;
            }
            
            .theme-select:hover {
                background-color: var(--bg-tertiary);
            }
            
            .theme-select optgroup {
                background-color: var(--bg-secondary);
                color: var(--text-muted);
                font-weight: bold;
            }
            
            .theme-select option {
                background-color: var(--bg-color);
                color: var(--text-color);
                padding: 8px;
            }
        `;
    }
    
    // Initialize
    init();
    
    // Return public methods for external use
    return {
        applyTheme,
        registerTheme,
        loadThemeFromFile,
        getAvailableThemes: () => Object.keys(availableThemes),
        getCurrentTheme,
        exportTheme,
        createThemeFromCurrent
    };
}
