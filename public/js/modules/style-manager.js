/**
 * Style Manager Module
 * Handles keyword highlighting style selection and management
 */

export function initStyleManager() {
    // Current highlighting style
    let currentStyle = 'style-underline';
    
    // Available style options
    const styles = [
        { id: 'style-underline', icon: '—', name: 'Underline', description: 'Classic underline style' },
        { id: 'style-background', icon: '■', name: 'Background', description: 'Colored background highlight' },
        { id: 'style-bold', icon: 'B', name: 'Bold', description: 'Bold colored text' },
        { id: 'style-dotted', icon: '···', name: 'Dotted', description: 'Dotted underline style' },
        { id: 'style-wavy', icon: '∼', name: 'Wavy', description: 'Wavy underline style' },
        { id: 'style-glow', icon: '★', name: 'Glow', description: 'Text with a glow effect' }
    ];
    
    // Create and append style selector to the DOM
    function createStyleSelector() {
        // Create the style tools panel
        const stylesPanel = document.createElement('div');
        stylesPanel.id = 'highlightStylesPanel';
        stylesPanel.className = 'tools-panel';
        stylesPanel.innerHTML = `
            <div class="panel-header">
                <h3>Keyword Highlighting</h3>
                <div class="tooltip">
                    <span class="tooltip-icon">?</span>
                    <span class="tooltip-text">Choose how keywords are highlighted in text. Different styles can help you distinguish between types of keywords.</span>
                </div>
            </div>
            <div class="panel-content">
                <div id="styleOptions" class="style-options"></div>
                <div class="style-preview">
                    <h4>Preview: <span id="stylePreviewName">Underline</span></h4>
                    <div id="stylePreview" class="preview-box">
                        <p>This is a <span class="highlighted-keyword style-underline" style="border-bottom-color: #1976d2;">sample keyword</span> with highlighting.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after main tools
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.appendChild(stylesPanel);
                
                // Add the style options
                const styleOptions = document.getElementById('styleOptions');
                if (styleOptions) {
                    styles.forEach(style => {
                        const option = document.createElement('div');
                        option.className = `style-option ${style.id === currentStyle ? 'active' : ''}`;
                        option.setAttribute('data-style', style.id);
                        option.setAttribute('title', style.description);
                        
                        // Create option content
                        option.innerHTML = `
                            <span class="style-icon">${style.icon}</span>
                            <span class="style-name">${style.name}</span>
                        `;
                        
                        // Add click event
                        option.addEventListener('click', () => {
                            // Update active style
                            document.querySelectorAll('.style-option').forEach(el => {
                                el.classList.remove('active');
                            });
                            option.classList.add('active');
                            
                            // Update current style
                            currentStyle = style.id;
                            
                            // Update the preview
                            updatePreview(style);
                            
                            // Update the actual highlighting style if keyword system is available
                            if (window.keywordHighlight && window.keywordHighlight.setHighlightingStyle) {
                                window.keywordHighlight.setHighlightingStyle(style.id);
                            }
                            
                            // If a file is currently open, reload it to apply the new style
                            if (window.loadFileComparison && window.currentComparison) {
                                const { oldPath, newPath } = window.currentComparison;
                                window.loadFileComparison(oldPath, newPath);
                            }
                        });
                        
                        styleOptions.appendChild(option);
                    });
                }
            }
        }
    }
    
    // Update the preview when a style is selected
    function updatePreview(style) {
        const preview = document.getElementById('stylePreview');
        const previewName = document.getElementById('stylePreviewName');
        
        if (preview && previewName) {
            // Update preview name
            previewName.textContent = style.name;
            
            // Update preview content based on style
            let previewHtml = '';
            
            switch (style.id) {
                case 'style-background':
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="background-color: #1976d2; color: white;">sample keyword</span> with highlighting.</p>`;
                    break;
                case 'style-bold':
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="color: #1976d2; font-weight: bold;">sample keyword</span> with highlighting.</p>`;
                    break;
                case 'style-glow':
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="color: #1976d2; text-shadow: 0 0 3px #1976d2;">sample keyword</span> with highlighting.</p>`;
                    break;
                case 'style-dotted':
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="border-bottom-color: #1976d2; border-bottom-style: dotted;">sample keyword</span> with highlighting.</p>`;
                    break;
                case 'style-wavy':
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="border-bottom-color: #1976d2; border-bottom-style: wavy;">sample keyword</span> with highlighting.</p>`;
                    break;
                case 'style-underline':
                default:
                    previewHtml = `<p>This is a <span class="highlighted-keyword ${style.id}" style="border-bottom-color: #1976d2;">sample keyword</span> with highlighting.</p>`;
                    break;
            }
            
            preview.innerHTML = previewHtml;
        }
    }
    
    // Initialize the style manager
    function init() {
        // Add CSS for the styles panel
        addStyles();
        
        // Create the style selector panel
        setTimeout(() => {
            createStyleSelector();
            
            // Update style if the keyword system already has a preference
            if (window.keywordHighlight && window.keywordHighlight.getHighlightingStyle) {
                const style = window.keywordHighlight.getHighlightingStyle();
                if (style) {
                    currentStyle = style;
                    updateActiveStyle(style);
                }
            }
        }, 500); // Delay to ensure DOM is ready
    }
    
    // Update the active style indicator
    function updateActiveStyle(styleId) {
        document.querySelectorAll('.style-option').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-style') === styleId);
        });
        
        // Update preview
        const style = styles.find(s => s.id === styleId);
        if (style) {
            updatePreview(style);
        }
    }
    
    // Add CSS styles for the highlighting tools
    function addStyles() {
        if (!document.getElementById('style-manager-css')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'style-manager-css';
            styleElement.textContent = `
                #highlightStylesPanel {
                    margin-top: 20px;
                    border-radius: 8px;
                    background-color: var(--container-bg);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                #highlightStylesPanel .panel-header {
                    padding: 10px 15px;
                    background-color: var(--keyword-panel-header-bg);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                #highlightStylesPanel .panel-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                #highlightStylesPanel .panel-content {
                    padding: 15px;
                }
                
                .style-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 15px;
                }
                
                .style-option {
                    display: flex;
                    align-items: center;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    background: var(--file-entry-bg);
                    border: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                }
                
                .style-option:hover {
                    background: var(--file-entry-hover);
                }
                
                .style-option.active {
                    border-color: var(--primary-color);
                    background: var(--primary-transparent);
                }
                
                .style-icon {
                    margin-right: 8px;
                    font-size: 14px;
                    width: 18px;
                    text-align: center;
                }
                
                .style-name {
                    font-size: 12px;
                }
                
                .style-preview {
                    background-color: var(--bg-secondary);
                    border-radius: 4px;
                    padding: 10px;
                    margin-top: 15px;
                }
                
                .style-preview h4 {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .preview-box {
                    background-color: var(--bg-color);
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid var(--border-color);
                }
                
                .preview-box p {
                    margin: 0;
                    font-size: 13px;
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Initialize
    init();
    
    // Return public methods
    return {
        setStyle: function(styleId) {
            if (styles.some(s => s.id === styleId)) {
                currentStyle = styleId;
                updateActiveStyle(styleId);
                return true;
            }
            return false;
        },
        getCurrentStyle: function() {
            return currentStyle;
        },
        getAvailableStyles: function() {
            return [...styles];
        }
    };
}
