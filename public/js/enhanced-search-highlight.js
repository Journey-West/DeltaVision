/**
 * Enhanced Search Highlighting for DeltaVision
 * 
 * This module provides improved search term highlighting that works consistently
 * across all view modes (Diff View, Old File View, and New File View).
 */

(function() {
    // Wait for the window to fully load
    window.addEventListener('load', function() {
        // Give time for all modules to initialize
        setTimeout(function() {
            console.log('[EnhancedSearch] Initializing enhanced search highlighting...');
            
            // Store the original highlightSearchTermsInDiffView function
            const originalHighlightFunction = window.highlightSearchTermsInDiffView;
            
            if (!originalHighlightFunction) {
                console.error('[EnhancedSearch] Original highlight function not found');
                return;
            }
            
            // Replace with our enhanced version
            window.highlightSearchTermsInDiffView = function(container) {
                // First, check if there's an active search query to highlight
                if (!window.fileSearch || 
                    typeof window.fileSearch.getCurrentQuery !== 'function' || 
                    typeof window.fileSearch.isSearchActive !== 'function') {
                    console.warn('[EnhancedSearch] Search module not available');
                    return; // Search module not available
                }
                
                const searchQuery = window.fileSearch.getCurrentQuery();
                if (!searchQuery || !window.fileSearch.isSearchActive()) {
                    console.log('[EnhancedSearch] No active search query');
                    return; // No active search
                }
                
                try {
                    console.log(`[EnhancedSearch] Highlighting search term: "${searchQuery}"`);
                    
                    // First, remove any existing highlights to avoid duplicates
                    const existingHighlights = document.querySelectorAll('.search-term-highlight');
                    existingHighlights.forEach(highlight => {
                        // Replace the highlight span with its text content
                        const textNode = document.createTextNode(highlight.textContent);
                        highlight.parentNode.replaceChild(textNode, highlight);
                    });
                    
                    // Determine which view is currently active
                    const diffViewButton = document.getElementById('diffViewButton');
                    const newViewButton = document.getElementById('newViewButton');
                    const oldViewButton = document.getElementById('oldViewButton');
                    
                    const isDiffViewActive = diffViewButton && diffViewButton.classList.contains('active');
                    const isNewViewActive = newViewButton && newViewButton.classList.contains('active');
                    const isOldViewActive = oldViewButton && oldViewButton.classList.contains('active');
                    
                    console.log(`[EnhancedSearch] Active view: ${isDiffViewActive ? 'Diff' : isNewViewActive ? 'New' : isOldViewActive ? 'Old' : 'Unknown'}`);
                    
                    // For Diff View, use the original function
                    if (isDiffViewActive) {
                        console.log('[EnhancedSearch] Using original highlight function for Diff View');
                        // Call the original function
                        originalHighlightFunction(container);
                        return;
                    }
                    
                    // For Old View and New View, use our enhanced approach
                    console.log('[EnhancedSearch] Using enhanced highlighting for Old/New View');
                    
                    // Get the appropriate view container
                    const viewContainer = container || document.getElementById('diffViewer');
                    if (!viewContainer) {
                        console.error('[EnhancedSearch] View container not found');
                        return;
                    }
                    
                    // Find the specific view content container
                    const oldFileView = viewContainer.querySelector('.old-file-view');
                    const newFileView = viewContainer.querySelector('.new-file-view');
                    const targetView = isOldViewActive ? oldFileView : isNewViewActive ? newFileView : null;
                    
                    if (!targetView) {
                        console.error('[EnhancedSearch] Target view container not found');
                        return;
                    }
                    
                    console.log(`[EnhancedSearch] Found target view container: ${isOldViewActive ? '.old-file-view' : '.new-file-view'}`);
                    
                    // Get all line content elements in the target view
                    const lineContentElements = targetView.querySelectorAll('.line-content');
                    console.log(`[EnhancedSearch] Found ${lineContentElements.length} line content elements`);
                    
                    // Prepare for highlighting
                    const searchTermLower = searchQuery.toLowerCase();
                    const escapedTerm = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(escapedTerm, 'gi');
                    let totalHighlighted = 0;
                    
                    // Process each line content element
                    lineContentElements.forEach((element, index) => {
                        // Skip if the element is empty
                        if (!element.textContent || !element.textContent.trim()) return;
                        
                        // Check if this element contains the search term (case insensitive)
                        if (element.textContent.toLowerCase().includes(searchTermLower)) {
                            console.log(`[EnhancedSearch] Found match in line ${index+1}:`, element.textContent.trim().substring(0, 50) + '...');
                            
                            // Get the HTML content
                            const originalHTML = element.innerHTML;
                            
                            // Create a temporary div to work with the HTML
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = originalHTML;
                            
                            // Process all text nodes within this element
                            const textNodes = [];
                            const walker = document.createTreeWalker(
                                tempDiv,
                                NodeFilter.SHOW_TEXT,
                                { acceptNode: node => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
                            );
                            
                            let textNode;
                            while (textNode = walker.nextNode()) {
                                textNodes.push(textNode);
                            }
                            
                            // Process each text node
                            let nodeHighlighted = false;
                            textNodes.forEach(textNode => {
                                const text = textNode.textContent;
                                
                                // Skip if this text node doesn't contain the search term
                                if (!text.toLowerCase().includes(searchTermLower)) return;
                                
                                // Reset regex state
                                regex.lastIndex = 0;
                                
                                // Find all matches in this text node
                                let match;
                                let lastIndex = 0;
                                let fragments = [];
                                let matchesInNode = 0;
                                
                                // Build a new string with highlighted matches
                                let highlightedText = '';
                                while ((match = regex.exec(text)) !== null) {
                                    // Add text before the match
                                    highlightedText += text.substring(lastIndex, match.index);
                                    
                                    // Add the highlighted match
                                    highlightedText += `<span class="search-term-highlight" style="background-color: rgba(255, 165, 0, 0.6); color: #000; font-weight: bold; padding: 0 2px; border-radius: 2px; display: inline; vertical-align: baseline;">${match[0]}</span>`;
                                    
                                    lastIndex = regex.lastIndex;
                                    totalHighlighted++;
                                    matchesInNode++;
                                    nodeHighlighted = true;
                                }
                                
                                // Add any remaining text after the last match
                                highlightedText += text.substring(lastIndex);
                                
                                // Only replace if we found matches
                                if (matchesInNode > 0) {
                                    // Create a span to replace the text node
                                    const replacementSpan = document.createElement('span');
                                    replacementSpan.innerHTML = highlightedText;
                                    
                                    // Replace the text node with our span
                                    textNode.parentNode.replaceChild(replacementSpan, textNode);
                                }
                            });
                            
                            // If any nodes were highlighted, update the original element
                            if (nodeHighlighted) {
                                element.innerHTML = tempDiv.innerHTML;
                            }
                        }
                    });
                    
                    console.log(`[EnhancedSearch] Highlighted ${totalHighlighted} occurrences of "${searchQuery}"`);
                    
                } catch (error) {
                    console.error('[EnhancedSearch] Error highlighting search terms:', error);
                }
            };
            
            // Patch the view toggle buttons to apply search highlighting after switching views
            function patchViewToggleButtons() {
                const diffViewButton = document.getElementById('diffViewButton');
                const newViewButton = document.getElementById('newViewButton');
                const oldViewButton = document.getElementById('oldViewButton');
                
                if (!diffViewButton || !newViewButton || !oldViewButton) {
                    console.warn('[EnhancedSearch] View toggle buttons not found, will retry...');
                    setTimeout(patchViewToggleButtons, 500);
                    return;
                }
                
                console.log('[EnhancedSearch] Patching view toggle buttons...');
                
                // Store original click handlers
                const originalDiffViewClick = diffViewButton.onclick;
                const originalNewViewClick = newViewButton.onclick;
                const originalOldViewClick = oldViewButton.onclick;
                
                // Replace with patched handlers
                diffViewButton.onclick = function(event) {
                    // Call original handler if it exists
                    if (typeof originalDiffViewClick === 'function') {
                        originalDiffViewClick.call(this, event);
                    }
                    
                    // Apply search highlighting after a short delay
                    setTimeout(() => {
                        if (window.fileSearch && 
                            typeof window.fileSearch.isSearchActive === 'function' && 
                            window.fileSearch.isSearchActive()) {
                            console.log('[EnhancedSearch] Applying search highlighting in Diff View...');
                            const diffViewer = document.getElementById('diffViewer');
                            if (diffViewer) {
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 50);
                };
                
                newViewButton.onclick = function(event) {
                    // Call original handler if it exists
                    if (typeof originalNewViewClick === 'function') {
                        originalNewViewClick.call(this, event);
                    }
                    
                    // Apply search highlighting after a short delay
                    setTimeout(() => {
                        if (window.fileSearch && 
                            typeof window.fileSearch.isSearchActive === 'function' && 
                            window.fileSearch.isSearchActive()) {
                            console.log('[EnhancedSearch] Applying search highlighting in New View...');
                            const diffViewer = document.getElementById('diffViewer');
                            if (diffViewer) {
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 50);
                };
                
                oldViewButton.onclick = function(event) {
                    // Call original handler if it exists
                    if (typeof originalOldViewClick === 'function') {
                        originalOldViewClick.call(this, event);
                    }
                    
                    // Apply search highlighting after a short delay
                    setTimeout(() => {
                        if (window.fileSearch && 
                            typeof window.fileSearch.isSearchActive === 'function' && 
                            window.fileSearch.isSearchActive()) {
                            console.log('[EnhancedSearch] Applying search highlighting in Old View...');
                            const diffViewer = document.getElementById('diffViewer');
                            if (diffViewer) {
                                window.highlightSearchTermsInDiffView(diffViewer);
                            }
                        }
                    }, 50);
                };
                
                console.log('[EnhancedSearch] View toggle buttons patched successfully');
            }
            
            // Patch the file search functionality
            function patchFileSearch() {
                if (!window.fileSearch || typeof window.fileSearch.performSearch !== 'function') {
                    console.warn('[EnhancedSearch] File search functionality not found, will retry...');
                    setTimeout(patchFileSearch, 500);
                    return;
                }
                
                console.log('[EnhancedSearch] Patching file search functionality...');
                
                // Store the original performSearch function
                const originalPerformSearch = window.fileSearch.performSearch;
                
                // Replace with patched version
                window.fileSearch.performSearch = function(query) {
                    // Call the original function
                    const result = originalPerformSearch.call(this, query);
                    
                    // Apply search highlighting after search results are processed
                    setTimeout(() => {
                        const diffViewer = document.getElementById('diffViewer');
                        if (diffViewer && window.fileSearch.isSearchActive()) {
                            console.log('[EnhancedSearch] Applying search highlighting after search...');
                            window.highlightSearchTermsInDiffView(diffViewer);
                        }
                    }, 100);
                    
                    return result;
                };
                
                console.log('[EnhancedSearch] File search functionality patched successfully');
            }
            
            // Initialize our patches
            patchViewToggleButtons();
            patchFileSearch();
            
            // Apply search highlighting immediately if there's an active search
            setTimeout(() => {
                if (window.fileSearch && 
                    typeof window.fileSearch.isSearchActive === 'function' && 
                    window.fileSearch.isSearchActive()) {
                    console.log('[EnhancedSearch] Applying initial search highlighting...');
                    const diffViewer = document.getElementById('diffViewer');
                    if (diffViewer) {
                        window.highlightSearchTermsInDiffView(diffViewer);
                    }
                }
            }, 200);
            
            console.log('[EnhancedSearch] Enhanced search highlighting initialized');
        }, 500);
    });
})();
