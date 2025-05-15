/**
 * Direct Search Highlighting Fix for DeltaVision
 * 
 * This script directly modifies the core functions to ensure search highlighting
 * works in all view modes (Diff, Old File, and New File).
 */

(function() {
    // Wait for the window to fully load
    window.addEventListener('load', function() {
        // Give time for all modules to initialize
        setTimeout(function() {
            console.log('[DirectSearchFix] Initializing direct search fix...');
            
            // Get the original renderNewFileView function
            const originalRenderNewFileView = window.initFileManager.renderNewFileView;
            
            // Replace with our enhanced version
            if (originalRenderNewFileView) {
                window.initFileManager.renderNewFileView = function(container, content) {
                    // Call the original function
                    originalRenderNewFileView.call(this, container, content);
                    
                    // Apply search highlighting if there's an active search
                    if (window.fileSearch && 
                        typeof window.fileSearch.isSearchActive === 'function' && 
                        window.fileSearch.isSearchActive()) {
                        console.log('[DirectSearchFix] Applying search highlighting to New File View');
                        setTimeout(() => {
                            if (typeof window.highlightSearchTermsInDiffView === 'function') {
                                window.highlightSearchTermsInDiffView(container);
                            } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                                window.initFileManager.highlightSearchTermsInDiffView(container);
                            }
                        }, 10);
                    }
                };
                console.log('[DirectSearchFix] Enhanced renderNewFileView function');
            } else {
                console.warn('[DirectSearchFix] Could not find renderNewFileView function');
            }
            
            // Get the original renderOldFileView function
            const originalRenderOldFileView = window.initFileManager.renderOldFileView;
            
            // Replace with our enhanced version
            if (originalRenderOldFileView) {
                window.initFileManager.renderOldFileView = function(container, content) {
                    // Call the original function
                    originalRenderOldFileView.call(this, container, content);
                    
                    // Apply search highlighting if there's an active search
                    if (window.fileSearch && 
                        typeof window.fileSearch.isSearchActive === 'function' && 
                        window.fileSearch.isSearchActive()) {
                        console.log('[DirectSearchFix] Applying search highlighting to Old File View');
                        setTimeout(() => {
                            if (typeof window.highlightSearchTermsInDiffView === 'function') {
                                window.highlightSearchTermsInDiffView(container);
                            } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                                window.initFileManager.highlightSearchTermsInDiffView(container);
                            }
                        }, 10);
                    }
                };
                console.log('[DirectSearchFix] Enhanced renderOldFileView function');
            } else {
                console.warn('[DirectSearchFix] Could not find renderOldFileView function');
            }
            
            // Also enhance the setupViewToggle function to ensure highlighting is applied when switching views
            const originalSetupViewToggle = window.initFileManager.setupViewToggle;
            
            if (originalSetupViewToggle) {
                window.initFileManager.setupViewToggle = function(diffViewer) {
                    // Call the original function
                    originalSetupViewToggle.call(this, diffViewer);
                    
                    // Get the view toggle buttons
                    const diffViewButton = document.getElementById('diffViewButton');
                    const newViewButton = document.getElementById('newViewButton');
                    const oldViewButton = document.getElementById('oldViewButton');
                    
                    if (diffViewButton && newViewButton && oldViewButton) {
                        console.log('[DirectSearchFix] Enhancing view toggle buttons');
                        
                        // Store original click handlers
                        const originalDiffClick = diffViewButton.onclick;
                        const originalNewClick = newViewButton.onclick;
                        const originalOldClick = oldViewButton.onclick;
                        
                        // Enhance the diff view button
                        diffViewButton.onclick = function(event) {
                            // Call original handler
                            if (typeof originalDiffClick === 'function') {
                                originalDiffClick.call(this, event);
                            }
                            
                            // Apply search highlighting
                            setTimeout(() => {
                                if (window.fileSearch && 
                                    typeof window.fileSearch.isSearchActive === 'function' && 
                                    window.fileSearch.isSearchActive()) {
                                    console.log('[DirectSearchFix] Applying search highlighting after switching to Diff View');
                                    if (typeof window.highlightSearchTermsInDiffView === 'function') {
                                        window.highlightSearchTermsInDiffView(diffViewer);
                                    } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                                        window.initFileManager.highlightSearchTermsInDiffView(diffViewer);
                                    }
                                }
                            }, 10);
                        };
                        
                        // Enhance the new view button
                        newViewButton.onclick = function(event) {
                            // Call original handler
                            if (typeof originalNewClick === 'function') {
                                originalNewClick.call(this, event);
                            }
                            
                            // Apply search highlighting
                            setTimeout(() => {
                                if (window.fileSearch && 
                                    typeof window.fileSearch.isSearchActive === 'function' && 
                                    window.fileSearch.isSearchActive()) {
                                    console.log('[DirectSearchFix] Applying search highlighting after switching to New View');
                                    if (typeof window.highlightSearchTermsInDiffView === 'function') {
                                        window.highlightSearchTermsInDiffView(diffViewer);
                                    } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                                        window.initFileManager.highlightSearchTermsInDiffView(diffViewer);
                                    }
                                }
                            }, 10);
                        };
                        
                        // Enhance the old view button
                        oldViewButton.onclick = function(event) {
                            // Call original handler
                            if (typeof originalOldClick === 'function') {
                                originalOldClick.call(this, event);
                            }
                            
                            // Apply search highlighting
                            setTimeout(() => {
                                if (window.fileSearch && 
                                    typeof window.fileSearch.isSearchActive === 'function' && 
                                    window.fileSearch.isSearchActive()) {
                                    console.log('[DirectSearchFix] Applying search highlighting after switching to Old View');
                                    if (typeof window.highlightSearchTermsInDiffView === 'function') {
                                        window.highlightSearchTermsInDiffView(diffViewer);
                                    } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                                        window.initFileManager.highlightSearchTermsInDiffView(diffViewer);
                                    }
                                }
                            }, 10);
                        };
                        
                        console.log('[DirectSearchFix] View toggle buttons enhanced');
                    } else {
                        console.warn('[DirectSearchFix] Could not find view toggle buttons');
                    }
                };
                console.log('[DirectSearchFix] Enhanced setupViewToggle function');
            } else {
                console.warn('[DirectSearchFix] Could not find setupViewToggle function');
            }
            
            // Enhance the highlightSearchTermsInDiffView function to better handle Old and New views
            const originalHighlightFunction = window.highlightSearchTermsInDiffView || window.initFileManager.highlightSearchTermsInDiffView;
            
            if (originalHighlightFunction) {
                const enhancedHighlightFunction = function(container) {
                    // First check if there's an active search
                    if (!window.fileSearch || 
                        typeof window.fileSearch.getCurrentQuery !== 'function' || 
                        typeof window.fileSearch.isSearchActive !== 'function') {
                        return; // Search module not available
                    }
                    
                    const searchQuery = window.fileSearch.getCurrentQuery();
                    if (!searchQuery || !window.fileSearch.isSearchActive()) {
                        return; // No active search
                    }
                    
                    try {
                        console.log(`[DirectSearchFix] Highlighting search term: "${searchQuery}"`);
                        
                        // First, remove any existing highlights to avoid duplicates
                        const existingHighlights = document.querySelectorAll('.search-term-highlight');
                        existingHighlights.forEach(highlight => {
                            // Replace the highlight span with its text content
                            const textNode = document.createTextNode(highlight.textContent);
                            highlight.parentNode.replaceChild(textNode, highlight);
                        });
                        
                        // Check if this is a diff view or a file view
                        const isDiffView = container.querySelector('.diff-table');
                        const isNewView = container.querySelector('.new-file-view');
                        const isOldView = container.querySelector('.old-file-view');
                        
                        // For all view types, use our enhanced approach
                        if (isDiffView || isNewView || isOldView) {
                            // Determine the target container based on view type
                            const targetView = isDiffView ? container : (isNewView ? isNewView : isOldView);
                            
                            // Get all line content elements
                            const lineContents = targetView.querySelectorAll('.line-content');
                            console.log(`[DirectSearchFix] Found ${lineContents.length} line content elements`);
                            
                            // Prepare for highlighting
                            const searchTermLower = searchQuery.toLowerCase();
                            const escapedTerm = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(escapedTerm, 'gi');
                            
                            // Process each line content element
                            lineContents.forEach((element, index) => {
                                const text = element.textContent;
                                
                                // Skip if this element doesn't contain the search term
                                if (!text.toLowerCase().includes(searchTermLower)) return;
                                
                                console.log(`[DirectSearchFix] Found match in line ${index+1}`);
                                
                                // Reset regex state
                                regex.lastIndex = 0;
                                
                                // Create a replacement HTML with highlighted terms
                                let newHTML = '';
                                let lastIndex = 0;
                                let match;
                                
                                while ((match = regex.exec(text)) !== null) {
                                    // Add text before the match
                                    newHTML += text.substring(lastIndex, match.index);
                                    
                                    // Add the highlighted match
                                    newHTML += `<span class="search-term-highlight">${match[0]}</span>`;
                                    
                                    lastIndex = regex.lastIndex;
                                }
                                
                                // Add any remaining text
                                newHTML += text.substring(lastIndex);
                                
                                // Update the element's HTML
                                element.innerHTML = newHTML;
                            });
                        }
                    } catch (error) {
                        console.error('[DirectSearchFix] Error highlighting search terms:', error);
                    }
                };
                
                // Replace the original function with our enhanced version
                if (window.highlightSearchTermsInDiffView) {
                    window.highlightSearchTermsInDiffView = enhancedHighlightFunction;
                } else if (window.initFileManager.highlightSearchTermsInDiffView) {
                    window.initFileManager.highlightSearchTermsInDiffView = enhancedHighlightFunction;
                }
                
                console.log('[DirectSearchFix] Enhanced highlightSearchTermsInDiffView function');
            } else {
                console.warn('[DirectSearchFix] Could not find highlightSearchTermsInDiffView function');
            }
            
            // Apply initial search highlighting if there's an active search
            setTimeout(() => {
                if (window.fileSearch && 
                    typeof window.fileSearch.isSearchActive === 'function' && 
                    window.fileSearch.isSearchActive()) {
                    console.log('[DirectSearchFix] Applying initial search highlighting');
                    const diffViewer = document.getElementById('diffViewer');
                    if (diffViewer) {
                        if (typeof window.highlightSearchTermsInDiffView === 'function') {
                            window.highlightSearchTermsInDiffView(diffViewer);
                        } else if (typeof window.initFileManager.highlightSearchTermsInDiffView === 'function') {
                            window.initFileManager.highlightSearchTermsInDiffView(diffViewer);
                        }
                    }
                }
            }, 500);
            
            console.log('[DirectSearchFix] Direct search fix initialized');
        }, 1000); // Wait 1 second to ensure all modules are loaded
    });
})();
