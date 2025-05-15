/**
 * Complete Search Highlighting Fix for DeltaVision
 * 
 * This script provides a comprehensive fix for search highlighting
 * to ensure ALL occurrences of search terms are highlighted in all view modes.
 * 
 * This version prevents flickering by disabling other highlighting functions
 * and implementing a debounced approach to highlighting.
 */

(function() {
    // Wait for the window to fully load
    window.addEventListener('load', function() {
        // Give time for all modules to initialize
        setTimeout(function() {
            console.log('[CompleteSearchFix] Initializing complete search highlighting fix...');
            
            // Disable other search highlighting functions to prevent conflicts
            if (window.highlightSearchTermsInDiffView) {
                window.originalHighlightSearchTermsInDiffView = window.highlightSearchTermsInDiffView;
                window.highlightSearchTermsInDiffView = function() {
                    // Do nothing, our comprehensive fix will handle highlighting
                    console.log('[CompleteSearchFix] Intercepted original highlight function call');
                };
            }
            
            // Debounce function to prevent multiple rapid executions
            function debounce(func, wait) {
                let timeout;
                return function() {
                    const context = this;
                    const args = arguments;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), wait);
                };
            }
            
            // Function to highlight all occurrences of a search term in the DOM
            const highlightAllSearchTerms = debounce(function() {
                // First check if there's an active search
                if (!window.fileSearch || 
                    typeof window.fileSearch.getCurrentQuery !== 'function' || 
                    typeof window.fileSearch.isSearchActive !== 'function' ||
                    !window.fileSearch.isSearchActive()) {
                    return;
                }
                
                const searchQuery = window.fileSearch.getCurrentQuery();
                if (!searchQuery) return;
                
                console.log(`[CompleteSearchFix] Highlighting all occurrences of: "${searchQuery}"`);
                
                try {
                    // First, remove any existing highlights to avoid duplicates
                    const existingHighlights = document.querySelectorAll('.search-term-highlight');
                    existingHighlights.forEach(highlight => {
                        const textNode = document.createTextNode(highlight.textContent);
                        highlight.parentNode.replaceChild(textNode, highlight);
                    });
                    
                    // Get the diff viewer container
                    const diffViewer = document.getElementById('diffViewer');
                    if (!diffViewer) return;
                    
                    // Find all text nodes in the diff viewer that contain the search term
                    highlightTextNodesRecursively(diffViewer, searchQuery);
                    
                    console.log('[CompleteSearchFix] Search term highlighting applied');
                    
                    // Set a flag to prevent other scripts from re-highlighting
                    window.searchHighlightingApplied = true;
                } catch (error) {
                    console.error('[CompleteSearchFix] Error highlighting search terms:', error);
                }
            }, 100); // Debounce with 100ms delay
            
            // Function to recursively find and highlight text nodes
            function highlightTextNodesRecursively(element, searchTerm) {
                // Skip certain elements that shouldn't be modified
                if (element.classList && 
                    (element.classList.contains('search-term-highlight') || 
                     element.classList.contains('line-number'))) {
                    return;
                }
                
                // Process child nodes
                for (let i = 0; i < element.childNodes.length; i++) {
                    const node = element.childNodes[i];
                    
                    if (node.nodeType === Node.TEXT_NODE) {
                        // This is a text node, check if it contains the search term
                        const text = node.textContent;
                        if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
                            // Create a temporary element to hold the highlighted HTML
                            const tempElement = document.createElement('span');
                            
                            // Escape special regex characters in search term
                            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            
                            // Replace all occurrences with highlighted version
                            const regex = new RegExp(`(${escapedTerm})`, 'gi');
                            tempElement.innerHTML = text.replace(regex, '<span class="search-term-highlight">$1</span>');
                            
                            // Replace the original text node with the highlighted content
                            const fragment = document.createDocumentFragment();
                            while (tempElement.firstChild) {
                                fragment.appendChild(tempElement.firstChild);
                            }
                            
                            element.replaceChild(fragment, node);
                            
                            // Skip ahead since we've modified the DOM
                            i += fragment.childNodes.length - 1;
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // This is an element node, recurse into it
                        highlightTextNodesRecursively(node, searchTerm);
                    }
                }
            }
            
            // Function to observe DOM changes and reapply highlighting when needed
            function setupObserver() {
                const diffViewer = document.getElementById('diffViewer');
                if (!diffViewer) {
                    console.warn('[CompleteSearchFix] Diff viewer not found, will retry...');
                    setTimeout(setupObserver, 500);
                    return;
                }
                
                // Create a mutation observer to watch for DOM changes
                const observer = new MutationObserver(mutations => {
                    let shouldReapply = false;
                    
                    mutations.forEach(mutation => {
                        // Check if this mutation affects the view
                        if (mutation.type === 'childList' || 
                            (mutation.type === 'attributes' && 
                             (mutation.target.classList.contains('new-file-view') || 
                              mutation.target.classList.contains('old-file-view') ||
                              mutation.target.classList.contains('diff-table')))) {
                            shouldReapply = true;
                        }
                    });
                    
                    if (shouldReapply) {
                        console.log('[CompleteSearchFix] View changed, reapplying search highlighting...');
                        setTimeout(highlightAllSearchTerms, 50);
                    }
                });
                
                // Start observing the diff viewer
                observer.observe(diffViewer, { 
                    childList: true, 
                    subtree: true, 
                    attributes: true,
                    attributeFilter: ['class']
                });
                
                console.log('[CompleteSearchFix] DOM observer set up');
            }
            
            // Patch the search functionality
            function patchSearch() {
                if (!window.fileSearch || typeof window.fileSearch.performSearch !== 'function') {
                    console.warn('[CompleteSearchFix] File search not found, will retry...');
                    setTimeout(patchSearch, 500);
                    return;
                }
                
                // Store the original performSearch function
                const originalPerformSearch = window.fileSearch.performSearch;
                
                // Replace with our enhanced version
                window.fileSearch.performSearch = async function(query) {
                    // Call the original function
                    const result = await originalPerformSearch.call(this, query);
                    
                    // Apply our comprehensive highlighting
                    setTimeout(highlightAllSearchTerms, 100);
                    
                    return result;
                };
                
                console.log('[CompleteSearchFix] Search function patched');
            }
            
            // Patch view toggle buttons
            function patchViewToggleButtons() {
                const diffViewButton = document.getElementById('diffViewButton');
                const newViewButton = document.getElementById('newViewButton');
                const oldViewButton = document.getElementById('oldViewButton');
                
                if (!diffViewButton || !newViewButton || !oldViewButton) {
                    console.warn('[CompleteSearchFix] View toggle buttons not found, will retry...');
                    setTimeout(patchViewToggleButtons, 500);
                    return;
                }
                
                // Store original click handlers
                const originalDiffClick = diffViewButton.onclick;
                const originalNewClick = newViewButton.onclick;
                const originalOldClick = oldViewButton.onclick;
                
                // Enhance all view toggle buttons
                [
                    { button: diffViewButton, original: originalDiffClick },
                    { button: newViewButton, original: originalNewClick },
                    { button: oldViewButton, original: originalOldClick }
                ].forEach(({ button, original }) => {
                    button.onclick = function(event) {
                        // Call original handler
                        if (typeof original === 'function') {
                            original.call(this, event);
                        }
                        
                        // Apply search highlighting
                        setTimeout(highlightAllSearchTerms, 50);
                    };
                });
                
                console.log('[CompleteSearchFix] View toggle buttons patched');
            }
            
            // Initialize all patches
            patchSearch();
            patchViewToggleButtons();
            setupObserver();
            
            // Apply initial search highlighting if there's an active search
            setTimeout(highlightAllSearchTerms, 500);
            
            console.log('[CompleteSearchFix] Complete search fix initialized');
        }, 1000); // Wait 1 second to ensure all modules are loaded
    });
})();
