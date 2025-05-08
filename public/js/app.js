// Main application JavaScript file
import { initThemeManager } from './modules/theme-manager.js';
import { initFileManager } from './modules/file-manager.js';
import { initKeywordSystem } from './modules/keyword-system.js';
import { initUiComponents } from './modules/ui-components.js';
import { initTabs } from './modules/ui-tabs.js';

// Track when components are fully loaded
let componentsLoaded = false;

// Function to initialize application after components are loaded
function initializeApp() {
    if (!componentsLoaded) {
        console.log('Waiting for components to load...');
        setTimeout(initializeApp, 100);
        return;
    }
    
    console.log('Initializing application...');
    
    // Initialize theme management
    const themeManager = initThemeManager();
    
    // Initialize file management
    const fileManager = initFileManager();
    
    // Initialize keyword system
    const keywordSystem = initKeywordSystem();
    
    // Initialize UI components
    const uiComponents = initUiComponents();
    
    // Initialize tab navigation
    const uiTabs = initTabs();
    
    // Expose key functionality to global scope
    window.fileManager = fileManager;
    window.keywordSystem = keywordSystem;
    window.showNotification = uiComponents.showNotification;
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Only handle shortcuts when not in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const app = document.getElementById('app');
        
        switch(event.key) {
            case 'ArrowUp':
                if (app) {
                    const fileEntries = app.querySelectorAll('.file-entry');
                    if (fileEntries.length > 0) {
                        const currentIndex = Array.prototype.indexOf.call(fileEntries, document.querySelector('.file-entry.selected'));
                        const newIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
                        fileEntries[newIndex].click();
                    }
                }
                break;
                
            case 'ArrowDown':
                if (app) {
                    const fileEntries = app.querySelectorAll('.file-entry');
                    if (fileEntries.length > 0) {
                        const currentIndex = Array.prototype.indexOf.call(fileEntries, document.querySelector('.file-entry.selected'));
                        const newIndex = currentIndex === -1 ? 0 : Math.min(fileEntries.length - 1, currentIndex + 1);
                        fileEntries[newIndex].click();
                    }
                }
                break;
                
            case 't':
            case 'T':
                // Toggle theme
                document.getElementById('themeToggle')?.click();
                break;
                
            case 's':
            case 'S':
                // Toggle sidebar
                document.querySelector('.toggle-sidebar')?.click();
                break;
                
            case 'r':
            case 'R':
                // Refresh file list
                document.getElementById('refreshButton')?.click();
                break;
        }
    });
    
    // Add the has-hotkey class to elements that will contain tooltips to make them visible on hover
    document.querySelectorAll('.hotkey-tooltip').forEach(tooltip => {
        tooltip.parentElement.classList.add('has-hotkey');
    });

    // Register service worker for offline caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(function(error) {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
        
        // Handle service worker updates
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
        
        // Add offline detection
        window.addEventListener('online', function() {
            document.body.classList.remove('offline-mode');
            console.log('Application is online');
            // Trigger sync when back online
            navigator.serviceWorker.ready.then(function(registration) {
                registration.sync.register('deltavision-sync');
            });
        });
        
        window.addEventListener('offline', function() {
            document.body.classList.add('offline-mode');
            console.log('Application is offline');
        });
        
        // Check initial status
        if (!navigator.onLine) {
            document.body.classList.add('offline-mode');
            console.log('Application started in offline mode');
        }
    }
}

// Track loaded components
document.addEventListener('DOMContentLoaded', function() {
    // Helper function to load HTML components
    async function loadComponent(componentId, componentPath) {
        try {
            const response = await fetch(componentPath);
            const html = await response.text();
            document.getElementById(componentId).innerHTML = html;
            return true;
        } catch (error) {
            console.error(`Error loading component ${componentPath}:`, error);
            return false;
        }
    }
    
    // Check if we're using client-side component loading
    const hasComponentElements = document.getElementById('headerComponent') !== null;
    
    if (hasComponentElements) {
        // Client-side component loading (for development/testing)
        Promise.all([
            loadComponent('headerComponent', '/components/header.html'),
            loadComponent('sidebarComponent', '/components/sidebar.html'),
            loadComponent('comparisonSectionComponent', '/components/comparison-section.html'),
            loadComponent('settingsPanelComponent', '/components/settings-panel.html'),
            loadComponent('hotkeysPanelComponent', '/components/hotkeys-panel.html'),
            loadComponent('offlineIndicatorComponent', '/components/offline-indicator.html')
        ]).then(() => {
            componentsLoaded = true;
            console.log('All components loaded');
        });
    } else {
        // Server-side rendered components are already in the DOM
        componentsLoaded = true;
        console.log('Using server-side rendered components');
    }
    
    // Initialize the app (will wait for components if needed)
    initializeApp();
});
