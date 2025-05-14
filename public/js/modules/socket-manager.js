/**
 * Socket Manager Module
 * Handles real-time updates through Socket.IO
 */

// Setup real-time connection manager for DeltaVision
export function initSocketManager(refreshCallback) {
    let socket = null;
    let autoRefreshEnabled = true;
    
    // Initialize Socket.IO connection
    function connect() {
        try {
            // Connect to the server's Socket.IO endpoint
            socket = io();
            
            console.log('Connecting to real-time updates service...');
            
            // Handle connection events
            socket.on('connect', () => {
                console.log('Connected to real-time updates service');
                showNotification('Real-time file updates enabled', 'success');
            });
            
            socket.on('disconnect', () => {
                console.log('Disconnected from real-time updates service');
            });
            
            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
            
            // Handle file update events
            socket.on('file-added', (data) => {
                console.log(`Real-time notification: File added - ${data.path}`);
                if (autoRefreshEnabled) {
                    showNotification('New file detected. Refreshing...', 'info');
                    setTimeout(() => refreshCallback(), 500); // Small delay to ensure file is properly indexed
                } else {
                    showNotification('New file detected. Click refresh to update', 'info');
                }
            });
            
            socket.on('file-changed', (data) => {
                console.log(`Real-time notification: File changed - ${data.path}`);
                if (autoRefreshEnabled) {
                    showNotification('File updated. Refreshing...', 'info');
                    setTimeout(() => refreshCallback(), 500);
                }
            });
            
            socket.on('file-removed', (data) => {
                console.log(`Real-time notification: File removed - ${data.path}`);
                if (autoRefreshEnabled) {
                    showNotification('File removed. Refreshing...', 'info');
                    setTimeout(() => refreshCallback(), 500);
                }
            });
            
        } catch (error) {
            console.error('Error initializing Socket.IO:', error);
        }
    }
    
    // Show notification to the user
    function showNotification(message, type = 'info') {
        // Check if notification element exists
        let notification = document.querySelector('.notification');
        
        // Create if it doesn't exist
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set notification properties
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Add visible class to trigger animation
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto-hide after timeout
        setTimeout(() => {
            notification.classList.remove('visible');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Add stylesheet for notifications if not already present
    function addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'notification-styles';
            styleElement.textContent = `
                .notification {
                    position: fixed;
                    bottom: -100px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: 4px;
                    color: white;
                    font-weight: 500;
                    z-index: 3000;
                    transition: bottom 0.3s ease;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                }
                
                .notification.info {
                    background-color: #2196F3;
                }
                
                .notification.success {
                    background-color: #4CAF50;
                }
                
                .notification.error {
                    background-color: #F44336;
                }
                
                .notification.visible {
                    bottom: 20px;
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Setup toggle for auto-refresh feature in settings panel
    function setupAutoRefreshToggle() {
        // Add the styles for notifications
        addNotificationStyles();
        
        // Get or create the settings container
        const settingsContainer = document.querySelector('#settingsContainer .settings-content') || 
                                  document.querySelector('#settingsPanel .settings-content');
        
        if (settingsContainer) {
            // Create toggle element if it doesn't exist
            if (!document.getElementById('autoRefreshToggle')) {
                const toggleContainer = document.createElement('div');
                toggleContainer.className = 'setting-row';
                toggleContainer.innerHTML = `
                    <div class="setting-info">
                        <div class="setting-label">
                            <i class="fa fa-refresh" aria-hidden="true"></i>
                            Auto-refresh on file changes
                        </div>
                        <div class="setting-description">
                            Automatically update the file list when files are created, modified, or deleted
                        </div>
                    </div>
                    <div class="setting-control">
                        <span class="toggle-status ${autoRefreshEnabled ? 'on' : 'off'}">
                            ${autoRefreshEnabled ? 'ON' : 'OFF'}
                        </span>
                        <label class="toggle-switch auto-refresh">
                            <input type="checkbox" id="autoRefreshToggle" ${autoRefreshEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
                
                // Add to settings container
                settingsContainer.appendChild(toggleContainer);
                
                // Add event listener
                document.getElementById('autoRefreshToggle').addEventListener('change', function() {
                    autoRefreshEnabled = this.checked;
                    const status = autoRefreshEnabled ? 'enabled' : 'disabled';
                    
                    // Update the toggle status text
                    const statusElement = toggleContainer.querySelector('.toggle-status');
                    if (statusElement) {
                        statusElement.textContent = autoRefreshEnabled ? 'ON' : 'OFF';
                        statusElement.className = `toggle-status ${autoRefreshEnabled ? 'on' : 'off'}`;
                    }
                    
                    console.log(`Auto-refresh ${status}`);
                    showNotification(`Auto-refresh ${status}`, autoRefreshEnabled ? 'success' : 'info');
                });
            }
        }
    }
    
    // Initialize everything
    function init() {
        connect();
        setupAutoRefreshToggle();
    }
    
    // Return public methods and properties
    return {
        init,
        isAutoRefreshEnabled: () => autoRefreshEnabled,
        setAutoRefreshEnabled: (value) => { autoRefreshEnabled = value; }
    };
}
