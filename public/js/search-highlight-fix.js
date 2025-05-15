/**
 * Search Highlight Fix for DeltaVision
 * 
 * This script fixes the search highlighting issue in Old View and New View modes
 * by patching the view toggle functionality to ensure search highlighting is applied
 * after switching views.
 */

(function() {
    // Wait for the application to be fully initialized
    // We need to wait longer than DOMContentLoaded to ensure all modules are loaded
    window.addEventListener('load', function() {
        // Add a small delay to ensure all modules are initialized
        setTimeout(function() {
            console.log('[SearchHighlightFix] Initializing search highlight fix...');
        
        // Function to patch the view toggle buttons
        function patchViewToggleButtons() {
            const newViewButton = document.getElementById('newViewButton');
            const oldViewButton = document.getElementById('oldViewButton');
            
            if (newViewButton && oldViewButton) {
                console.log('[SearchHighlightFix] Found view toggle buttons, patching event handlers...');
                
                // Store original click handlers
                const originalNewViewClick = newViewButton.onclick;
                const originalOldViewClick = oldViewButton.onclick;
                
                // Replace with patched handlers that apply search highlighting
                newViewButton.onclick = function(event) {
                    // Call original handler if it exists
                    if (originalNewViewClick) {
                        originalNewViewClick.call(this, event);
                    }
                    
                    // Apply search highlighting after a short delay to ensure view is rendered
                    setTimeout(() => {
                        if (window.fileSearch && 
                            typeof window.fileSearch.isSearchActive === 'function' && 
                            window.fileSearch.isSearchActive()) {
                            console.log('[SearchHighlightFix] Applying search highlighting in New View...');
                            const diffViewer = document.getElementById('diffViewer');
                            if (diffViewer && typeof window.highlightSearchTermsInDiffView === 'function') {
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 10);
                };
                
                oldViewButton.onclick = function(event) {
                    // Call original handler if it exists
                    if (originalOldViewClick) {
                        originalOldViewClick.call(this, event);
                    }
                    
                    // Apply search highlighting after a short delay to ensure view is rendered
                    setTimeout(() => {
                        if (window.fileSearch && 
                            typeof window.fileSearch.isSearchActive === 'function' && 
                            window.fileSearch.isSearchActive()) {
                            console.log('[SearchHighlightFix] Applying search highlighting in Old View...');
                            const diffViewer = document.getElementById('diffViewer');
                            if (diffViewer && typeof window.highlightSearchTermsInDiffView === 'function') {
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 10);
                };
                
                console.log('[SearchHighlightFix] View toggle buttons patched successfully');
            } else {
                console.warn('[SearchHighlightFix] View toggle buttons not found, will retry later...');
                // Retry after a delay in case the buttons are added dynamically
                setTimeout(patchViewToggleButtons, 1000);
            }
        }
        
        // Also patch the file search functionality to reapply highlighting when switching views
        function patchFileSearch() {
            if (window.fileSearch && typeof window.fileSearch.performSearch === 'function') {
                console.log('[SearchHighlightFix] Patching file search functionality...');
                
                // Store the original performSearch function
                const originalPerformSearch = window.fileSearch.performSearch;
                
                // Replace with patched version that ensures highlighting in all view modes
                window.fileSearch.performSearch = function(query) {
                    // Call the original function
                    const result = originalPerformSearch.call(this, query);
                    
                    // Check which view is active and apply highlighting
                    setTimeout(() => {
                        const diffViewer = document.getElementById('diffViewer');
                        const newViewButton = document.getElementById('newViewButton');
                        const oldViewButton = document.getElementById('oldViewButton');
                        
                        if (diffViewer && typeof window.highlightSearchTermsInDiffView === 'function') {
                            if ((newViewButton && newViewButton.classList.contains('active')) ||
                                (oldViewButton && oldViewButton.classList.contains('active'))) {
                                console.log('[SearchHighlightFix] Reapplying search highlighting after search...');
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 100);
                    
                    return result;
                };
                
                console.log('[SearchHighlightFix] File search functionality patched successfully');
            } else {
                console.warn('[SearchHighlightFix] File search functionality not found, will retry later...');
                // Retry after a delay in case the file search is initialized later
                setTimeout(patchFileSearch, 1000);
            }
        }
        
        // Start patching
        patchViewToggleButtons();
        patchFileSearch();
        
        console.log('[SearchHighlightFix] Initialization complete');
        }, 500); // 500ms delay to ensure all modules are loaded
    });
})();
