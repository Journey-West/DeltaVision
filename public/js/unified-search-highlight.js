/**
 * Unified Search Highlighting Solution for DeltaVision
 * 
 * This script provides a single, comprehensive solution for search highlighting
 * that completely replaces all previous search fix scripts to eliminate flickering
 * and ensure consistent highlighting across all view modes.
 */

(function() {
    // Wait for the window to fully load
    window.addEventListener('load', function() {
        // Give time for all modules to initialize
        setTimeout(function() {
            console.log('[UnifiedSearch] Initializing unified search highlighting...');
            
            // Track the current search query and state
            let currentQuery = '';
            let isHighlightingActive = false;
            let highlightingInProgress = false;
            
            // Function to highlight all occurrences of a search term in the DOM
            function highlightAllSearchTerms(searchQuery) {
                // Prevent concurrent highlighting operations
                if (highlightingInProgress) {
                    return;
                }
                
                highlightingInProgress = true;
                
                try {
                    // If no query provided, try to get it from the search module
                    if (!searchQuery && window.fileSearch && 
                        typeof window.fileSearch.getCurrentQuery === 'function') {
                        searchQuery = window.fileSearch.getCurrentQuery();
                    }
                    
                    // If still no query or it's the same as current, we're done
                    if (!searchQuery || searchQuery === currentQuery && isHighlightingActive) {
                        highlightingInProgress = false;
                        return;
                    }
                    
                    console.log(`[UnifiedSearch] Highlighting all occurrences of: "${searchQuery}"`);
                    
                    // Update current query and state
                    currentQuery = searchQuery;
                    isHighlightingActive = true;
                    
                    // First, remove any existing highlights
                    removeAllHighlights();
                    
                    // Get the diff viewer container
                    const diffViewer = document.getElementById('diffViewer');
                    if (!diffViewer) {
                        highlightingInProgress = false;
                        return;
                    }
                    
                    // Determine which view is active
                    const isDiffView = !!diffViewer.querySelector('.diff-table');
                    const isNewView = !!diffViewer.querySelector('.new-file-view');
                    const isOldView = !!diffViewer.querySelector('.old-file-view');
                    
                    console.log(`[UnifiedSearch] Active view: ${isDiffView ? 'Diff' : isNewView ? 'New' : isOldView ? 'Old' : 'Unknown'}`);
                    
                    // For New File view, we need to target the specific container
                    if (isNewView) {
                        const newFileView = diffViewer.querySelector('.new-file-view');
                        if (newFileView) {
                            console.log('[UnifiedSearch] Highlighting in New File view');
                            highlightTextNodesRecursively(newFileView, searchQuery);
                        }
                    } else if (isOldView) {
                        const oldFileView = diffViewer.querySelector('.old-file-view');
                        if (oldFileView) {
                            console.log('[UnifiedSearch] Highlighting in Old File view');
                            highlightTextNodesRecursively(oldFileView, searchQuery);
                        }
                    } else {
                        // For diff view or unknown view, process the entire container
                        console.log('[UnifiedSearch] Highlighting in Diff view or entire container');
                        highlightTextNodesRecursively(diffViewer, searchQuery);
                    }
                    
                    console.log('[UnifiedSearch] Search term highlighting applied');
                } catch (error) {
                    console.error('[UnifiedSearch] Error highlighting search terms:', error);
                } finally {
                    highlightingInProgress = false;
                }
            }
            
            // Function to remove all search term highlights
            function removeAllHighlights() {
                const existingHighlights = document.querySelectorAll('.search-term-highlight');
                existingHighlights.forEach(highlight => {
                    const textNode = document.createTextNode(highlight.textContent);
                    highlight.parentNode.replaceChild(textNode, highlight);
                });
                
                isHighlightingActive = false;
            }
            
            // Function to recursively find and highlight text nodes
            function highlightTextNodesRecursively(element, searchTerm) {
                // Skip certain elements that shouldn't be modified
                if (!element || !element.childNodes || 
                    (element.classList && 
                     (element.classList.contains('search-term-highlight') || 
                      element.classList.contains('line-number')))) {
                    return;
                }
                
                // Special handling for line content elements
                if (element.classList && element.classList.contains('line-content')) {
                    // Direct handling of line content elements for more reliable highlighting
                    const text = element.textContent;
                    if (text && text.toLowerCase().includes(searchTerm.toLowerCase())) {
                        console.log(`[UnifiedSearch] Found match in line content: "${text.substring(0, 30)}..."`);
                        
                        // Create a temporary element to hold the highlighted HTML
                        const tempElement = document.createElement('div');
                        
                        // Escape special regex characters in search term
                        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        
                        // Replace all occurrences with highlighted version
                        const regex = new RegExp(`(${escapedTerm})`, 'gi');
                        tempElement.innerHTML = text.replace(regex, '<span class="search-term-highlight">$1</span>');
                        
                        // Replace the content
                        element.innerHTML = tempElement.innerHTML;
                        return; // Skip further processing of this element
                    }
                }
                
                // Process child nodes
                for (let i = 0; i < element.childNodes.length; i++) {
                    const node = element.childNodes[i];
                    
                    if (node.nodeType === Node.TEXT_NODE) {
                        // This is a text node, check if it contains the search term
                        const text = node.textContent;
                        if (text && text.toLowerCase().includes(searchTerm.toLowerCase())) {
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
                    console.warn('[UnifiedSearch] Diff viewer not found, will retry...');
                    setTimeout(setupObserver, 500);
                    return;
                }
                
                // Create a mutation observer to watch for DOM changes
                const observer = new MutationObserver(mutations => {
                    // Only reapply if we have an active search and view changes
                    if (!currentQuery || !isHighlightingActive) {
                        return;
                    }
                    
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
                        console.log('[UnifiedSearch] View changed, reapplying search highlighting...');
                        // Use a timeout to ensure the DOM has settled
                        setTimeout(() => highlightAllSearchTerms(currentQuery), 50);
                    }
                });
                
                // Start observing the diff viewer
                observer.observe(diffViewer, { 
                    childList: true, 
                    subtree: true, 
                    attributes: true,
                    attributeFilter: ['class']
                });
                
                console.log('[UnifiedSearch] DOM observer set up');
            }
            
            // Patch the search functionality
            function patchSearch() {
                if (!window.fileSearch || typeof window.fileSearch.performSearch !== 'function') {
                    console.warn('[UnifiedSearch] File search not found, will retry...');
                    setTimeout(patchSearch, 500);
                    return;
                }
                
                // Store the original performSearch function
                const originalPerformSearch = window.fileSearch.performSearch;
                
                // Replace with our enhanced version
                window.fileSearch.performSearch = async function(query) {
                    // Clear any existing highlights before performing a new search
                    removeAllHighlights();
                    
                    // Call the original function
                    const result = await originalPerformSearch.call(this, query);
                    
                    // Apply our highlighting after the search results are loaded
                    setTimeout(() => highlightAllSearchTerms(query), 100);
                    
                    return result;
                };
                
                // Also patch the clearSearch function
                if (typeof window.fileSearch.clearSearch === 'function') {
                    const originalClearSearch = window.fileSearch.clearSearch;
                    
                    window.fileSearch.clearSearch = function() {
                        // Call the original function
                        originalClearSearch.call(this);
                        
                        // Clear our highlights
                        removeAllHighlights();
                        currentQuery = '';
                    };
                }
                
                console.log('[UnifiedSearch] Search functions patched');
            }
            
            // Patch view toggle buttons
            function patchViewToggleButtons() {
                const diffViewButton = document.getElementById('diffViewButton');
                const newViewButton = document.getElementById('newViewButton');
                const oldViewButton = document.getElementById('oldViewButton');
                
                if (!diffViewButton || !newViewButton || !oldViewButton) {
                    console.warn('[UnifiedSearch] View toggle buttons not found, will retry...');
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
                        
                        // Apply search highlighting if we have an active search
                        if (currentQuery && isHighlightingActive) {
                            setTimeout(() => highlightAllSearchTerms(currentQuery), 50);
                        }
                    };
                });
                
                console.log('[UnifiedSearch] View toggle buttons patched');
            }
            
            // Override any existing highlighting functions to prevent conflicts
            window.highlightSearchTermsInDiffView = function() {
                console.log('[UnifiedSearch] Intercepted call to original highlight function');
                // Do nothing, our unified solution handles all highlighting
            };
            
            // Initialize all patches
            patchSearch();
            patchViewToggleButtons();
            setupObserver();
            
            // Apply initial search highlighting if there's an active search
            if (window.fileSearch && 
                typeof window.fileSearch.getCurrentQuery === 'function' &&
                typeof window.fileSearch.isSearchActive === 'function' &&
                window.fileSearch.isSearchActive()) {
                
                const query = window.fileSearch.getCurrentQuery();
                if (query) {
                    setTimeout(() => highlightAllSearchTerms(query), 500);
                }
            }
            
            console.log('[UnifiedSearch] Unified search highlighting initialized');
        }, 1000); // Wait 1 second to ensure all modules are loaded
    });
})();
