/**
 * Theme Loader for DeltaVision
 * Loads custom themes from the themes directory
 */
export async function initThemeLoader(themeManager) {
    if (!themeManager) {
        console.error('Theme manager required to initialize theme loader');
        return;
    }

    try {
        // Fetch the list of theme files from the server
        const response = await fetch('/api/themes');
        if (!response.ok) {
            throw new Error(`Failed to load theme list: ${response.statusText}`);
        }

        const themeFiles = await response.json();
        
        // Load each theme
        const loadPromises = themeFiles.map(themeFile => 
            themeManager.loadThemeFromFile(`/themes/${themeFile}`)
        );
        
        await Promise.allSettled(loadPromises);
        console.log(`Loaded ${loadPromises.length} custom themes`);
    } catch (error) {
        console.error('Error loading themes:', error);
    }
}

/**
 * Create a custom theme form in the application
 * This allows users to create and save their own themes
 */
export function createThemeEditor(themeManager) {
    const appContainer = document.querySelector('.app-container');
    if (!appContainer || !themeManager) return;
    
    // Create theme editor container
    const editorContainer = document.createElement('div');
    editorContainer.id = 'themeEditorContainer';
    editorContainer.className = 'theme-editor-container';
    
    // Create editor content
    editorContainer.innerHTML = `
        <div class="theme-editor-panel">
            <div class="theme-editor-header">
                <h3>Create Custom Theme</h3>
                <button id="closeThemeEditor" class="close-panel-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="theme-editor-content">
                <form id="themeForm">
                    <div class="form-group">
                        <label for="themeId">Theme ID</label>
                        <input type="text" id="themeId" placeholder="my-custom-theme" required>
                        <small>Use lowercase letters, numbers, and hyphens only</small>
                    </div>
                    <div class="form-group">
                        <label for="themeName">Theme Name</label>
                        <input type="text" id="themeName" placeholder="My Custom Theme" required>
                    </div>
                    <div class="form-group">
                        <label for="themeAuthor">Author</label>
                        <input type="text" id="themeAuthor" placeholder="Your Name">
                    </div>
                    <div class="form-group">
                        <label for="themeDescription">Description</label>
                        <textarea id="themeDescription" placeholder="A brief description of your theme"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="themeCategory">Category</label>
                        <select id="themeCategory">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    
                    <h4>Colors</h4>
                    <div class="color-grid">
                        <div class="color-item">
                            <label for="primaryColor">Primary Color</label>
                            <input type="color" id="primaryColor" data-var="--primary-color">
                        </div>
                        <div class="color-item">
                            <label for="accentColor">Accent Color</label>
                            <input type="color" id="accentColor" data-var="--accent-color">
                        </div>
                        <div class="color-item">
                            <label for="bgColor">Background</label>
                            <input type="color" id="bgColor" data-var="--background-color">
                        </div>
                        <div class="color-item">
                            <label for="textColor">Text Color</label>
                            <input type="color" id="textColor" data-var="--text-color">
                        </div>
                        <div class="color-item">
                            <label for="addedColor">Added Color</label>
                            <input type="color" id="addedColor" data-var="--added-color">
                        </div>
                        <div class="color-item">
                            <label for="removedColor">Removed Color</label>
                            <input type="color" id="removedColor" data-var="--removed-color">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="createThemeBtn" class="primary-button">Create Theme</button>
                        <button type="button" id="exportThemeBtn" class="secondary-button">Export Theme</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Append editor to document
    appContainer.appendChild(editorContainer);
    
    // Add CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .theme-editor-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .theme-editor-container.active {
            display: flex;
        }
        
        .theme-editor-panel {
            background-color: var(--bg-color);
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            width: 500px;
            max-width: 90%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .theme-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--header-bg);
        }
        
        .theme-editor-header h3 {
            margin: 0;
            font-weight: 500;
        }
        
        .theme-editor-content {
            padding: 20px;
            overflow-y: auto;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .form-group input, 
        .form-group select, 
        .form-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background-color: var(--bg-secondary);
            color: var(--text-color);
        }
        
        .form-group small {
            display: block;
            margin-top: 4px;
            color: var(--text-muted);
        }
        
        .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .color-item label {
            display: block;
            margin-bottom: 6px;
        }
        
        .color-item input[type="color"] {
            width: 100%;
            height: 36px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
        }
        
        .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .primary-button, .secondary-button {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .primary-button {
            background-color: var(--primary-color);
            color: white;
        }
        
        .secondary-button {
            background-color: var(--bg-secondary);
            color: var(--text-color);
            border: 1px solid var(--border-color);
        }
        
        .primary-button:hover {
            background-color: var(--primary-darker);
        }
        
        .secondary-button:hover {
            background-color: var(--bg-tertiary);
        }
    `;
    document.head.appendChild(styleElement);
    
    // Add open theme editor button to header
    const header = document.querySelector('header');
    if (header) {
        const createThemeButton = document.createElement('button');
        createThemeButton.id = 'openThemeEditor';
        createThemeButton.className = 'tool-button';
        createThemeButton.setAttribute('title', 'Create Custom Theme');
        createThemeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>';
        
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            header.insertBefore(createThemeButton, themeSelector.nextSibling);
        } else {
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                header.insertBefore(createThemeButton, themeToggle.nextSibling);
            } else {
                header.appendChild(createThemeButton);
            }
        }
    }
    
    // Set up event listeners
    setupThemeEditorEvents(themeManager);
}

function setupThemeEditorEvents(themeManager) {
    // Open editor
    const openBtn = document.getElementById('openThemeEditor');
    const editorContainer = document.getElementById('themeEditorContainer');
    const closeBtn = document.getElementById('closeThemeEditor');
    
    if (openBtn && editorContainer) {
        openBtn.addEventListener('click', () => {
            editorContainer.classList.add('active');
            populateColorInputs();
        });
    }
    
    if (closeBtn && editorContainer) {
        closeBtn.addEventListener('click', () => {
            editorContainer.classList.remove('active');
        });
    }
    
    // Create theme button
    const createBtn = document.getElementById('createThemeBtn');
    if (createBtn && themeManager) {
        createBtn.addEventListener('click', () => {
            const themeId = document.getElementById('themeId').value.trim();
            const themeName = document.getElementById('themeName').value.trim();
            const themeAuthor = document.getElementById('themeAuthor').value.trim() || 'User';
            const themeDescription = document.getElementById('themeDescription').value.trim();
            const themeCategory = document.getElementById('themeCategory').value;
            
            if (!themeId || !themeName) {
                alert('Theme ID and name are required');
                return;
            }
            
            // Create theme from current values
            const success = themeManager.createThemeFromCurrent(themeId, themeName, {
                author: themeAuthor,
                description: themeDescription,
                category: themeCategory
            });
            
            if (success) {
                alert(`Theme "${themeName}" created successfully!`);
                editorContainer.classList.remove('active');
            } else {
                alert('Failed to create theme. Please check the console for errors.');
            }
        });
    }
    
    // Export theme button
    const exportBtn = document.getElementById('exportThemeBtn');
    if (exportBtn && themeManager) {
        exportBtn.addEventListener('click', () => {
            const currentTheme = themeManager.getCurrentTheme();
            const themeJson = themeManager.exportTheme(currentTheme);
            
            if (!themeJson) {
                alert('Failed to export theme');
                return;
            }
            
            // Create a download link
            const blob = new Blob([themeJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${currentTheme}-theme.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }
    
    // Color inputs
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', () => {
            const cssVar = input.getAttribute('data-var');
            if (cssVar) {
                document.documentElement.style.setProperty(cssVar, input.value);
            }
        });
    });
}

function populateColorInputs() {
    const colorInputs = document.querySelectorAll('input[type="color"]');
    const computedStyle = getComputedStyle(document.documentElement);
    
    colorInputs.forEach(input => {
        const cssVar = input.getAttribute('data-var');
        if (cssVar) {
            let color = computedStyle.getPropertyValue(cssVar).trim();
            
            // Convert RGB/RGBA to hex if needed
            if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    const r = parseInt(rgb[0]);
                    const g = parseInt(rgb[1]);
                    const b = parseInt(rgb[2]);
                    color = rgbToHex(r, g, b);
                }
            }
            
            if (color) {
                input.value = color;
            }
        }
    });
}

// Helper function to convert RGB to HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
