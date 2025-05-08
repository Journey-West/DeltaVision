// UI components module
export function initUiComponents() {
    // Initialize settings panel
    function initSettingsPanel() {
        const settingsButton = document.getElementById('settingsButton');
        const settingsPanel = document.getElementById('settingsPanel');
        const closeSettingsButton = document.getElementById('closeSettingsButton');
        const saveSettingsButton = document.getElementById('saveSettingsButton');
        
        if (!settingsButton || !settingsPanel || !closeSettingsButton || !saveSettingsButton) {
            console.warn('Settings panel elements not found');
            return;
        }
        
        // Show settings panel
        settingsButton.addEventListener('click', function() {
            settingsPanel.classList.add('visible');
            
            // Load current folder paths into settings form
            fetchFolderPaths();
        });
        
        // Hide settings panel
        closeSettingsButton.addEventListener('click', function() {
            settingsPanel.classList.remove('visible');
        });
        
        // Save settings
        saveSettingsButton.addEventListener('click', function() {
            const oldFolderInput = document.getElementById('oldFolderPath');
            const newFolderInput = document.getElementById('newFolderPath');
            const keywordFileInput = document.getElementById('keywordFilePath');
            
            if (!oldFolderInput || !newFolderInput || !keywordFileInput) {
                console.error('Settings inputs not found');
                return;
            }
            
            const oldFolderPath = oldFolderInput.value.trim();
            const newFolderPath = newFolderInput.value.trim();
            const keywordFilePath = keywordFileInput.value.trim();
            
            saveFolderPaths(oldFolderPath, newFolderPath, keywordFilePath);
        });
    }
    
    // Fetch current folder paths from server
    async function fetchFolderPaths() {
        try {
            const response = await fetch('/api/folder-paths');
            const data = await response.json();
            
            // Update settings form with current paths
            document.getElementById('oldFolderPath').value = data.oldFolderPath || '';
            document.getElementById('newFolderPath').value = data.newFolderPath || '';
            document.getElementById('keywordFilePath').value = data.keywordFilePath || '';
            
        } catch (error) {
            console.error('Error fetching folder paths:', error);
        }
    }
    
    // Save folder paths to server
    async function saveFolderPaths(oldPath, newPath, keywordPath) {
        try {
            const response = await fetch('/api/folder-paths', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldFolderPath: oldPath,
                    newFolderPath: newPath,
                    keywordFilePath: keywordPath
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                showNotification('Settings saved successfully');
                
                // Hide settings panel
                document.getElementById('settingsPanel').classList.remove('visible');
                
                // Refresh file list
                if (window.fileManager && window.fileManager.refreshFiles) {
                    window.fileManager.refreshFiles();
                }
                
                // Update keyword system
                if (window.keywordHighlight) {
                    // Wait a bit for the server to load the keywords
                    setTimeout(() => {
                        fetch('/api/keywords')
                            .then(res => res.json())
                            .then(keywords => {
                                window.keywordHighlight.setKeywords(keywords);
                                
                                if (window.initKeywordSystem && window.initKeywordSystem.updateKeywordTally) {
                                    window.initKeywordSystem.updateKeywordTally();
                                }
                            });
                    }, 1000);
                }
            } else {
                showNotification('Error saving settings: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving folder paths:', error);
            showNotification('Error saving settings: ' + error.message, 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto-hide after a few seconds
        setTimeout(() => {
            notification.classList.remove('visible');
            
            // Remove from DOM after animation
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Keywords Panel
    function initKeywordsPanel() {
        const openBtn = document.getElementById('openKeywordsPanel');
        const closeBtn = document.getElementById('closeKeywordsPanel');
        const keywordsPanel = document.getElementById('keywordsPanel');
        
        if (openBtn && closeBtn && keywordsPanel) {
            // Ensure panel is hidden on initial load
            keywordsPanel.classList.remove('active');
            
            // Toggle panel visibility when clicking the open button
            openBtn.addEventListener('click', () => {
                // If panel is already open, close it (toggle behavior)
                if (keywordsPanel.classList.contains('active')) {
                    keywordsPanel.classList.remove('active');
                } else {
                    keywordsPanel.classList.add('active');
                }
            });
            
            closeBtn.addEventListener('click', () => {
                keywordsPanel.classList.remove('active');
            });
            
            // Close panel on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && keywordsPanel.classList.contains('active')) {
                    keywordsPanel.classList.remove('active');
                }
            });
            
            // Close panel when clicking outside of it (if not targeting a keywords panel element)
            document.addEventListener('click', (e) => {
                // Only do this if the panel is active
                if (!keywordsPanel.classList.contains('active')) return;
                
                // Don't close if clicking inside the panel or on the toggle button
                if (keywordsPanel.contains(e.target) || openBtn.contains(e.target)) return;
                
                keywordsPanel.classList.remove('active');
            });
        }
    }
    
    // Initialize hotkeys help
    function initHotkeysHelp() {
        const hotkeysButton = document.getElementById('hotkeysButton');
        const hotkeysPanel = document.getElementById('hotkeysPanel');
        const closeHotkeysButton = document.getElementById('closeHotkeysButton');
        
        if (!hotkeysButton || !hotkeysPanel || !closeHotkeysButton) {
            return;
        }
        
        hotkeysButton.addEventListener('click', function() {
            hotkeysPanel.classList.add('visible');
        });
        
        closeHotkeysButton.addEventListener('click', function() {
            hotkeysPanel.classList.remove('visible');
        });
    }
    
    // Initialize all UI components
    initSettingsPanel();
    initKeywordsPanel();
    initHotkeysHelp();
    
    // Return public methods
    return {
        showNotification
    };
}
