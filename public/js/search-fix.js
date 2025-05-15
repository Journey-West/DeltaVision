/**
 * Search Highlighting Fix for DeltaVision
 * 
 * This script fixes the search highlighting issue in all view modes
 * by directly modifying the DOM after search operations.
 */

(function() {
    // This function will be called when the document is fully loaded
    function initSearchFix() {
        console.log('[SearchFix] Initializing search fix...');
        
        // Function to highlight search terms in any view
        function highlightSearchTerms() {
            // Check if there's an active search
            if (!window.fileSearch || 
                typeof window.fileSearch.getCurrentQuery !== 'function' || 
                typeof window.fileSearch.isSearchActive !== 'function' ||
                !window.fileSearch.isSearchActive()) {
                return;
            }
            
            const searchQuery = window.fileSearch.getCurrentQuery();
            if (!searchQuery) return;
            
            console.log(`[SearchFix] Highlighting search term: "${searchQuery}"`);
            
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
                
                // Determine which view is active
                const isDiffView = !!diffViewer.querySelector('.diff-table');
                const isNewView = !!diffViewer.querySelector('.new-file-view');
                const isOldView = !!diffViewer.querySelector('.old-file-view');
                
                console.log(`[SearchFix] Active view: ${isDiffView ? 'Diff' : isNewView ? 'New' : isOldView ? 'Old' : 'Unknown'}`);
                
                // If in diff view, let the original function handle it if possible
                if (isDiffView && typeof window.highlightSearchTermsInDiffView === 'function') {
                    window.highlightSearchTermsInDiffView(diffViewer);
                    return;
                }
                
                // For file views, use our custom approach
                const targetView = isNewView ? 
                    diffViewer.querySelector('.new-file-view') : 
                    isOldView ? 
                        diffViewer.querySelector('.old-file-view') : 
                        diffViewer;
                
                if (!targetView) return;
                
                // Get all line content elements
                const lineContents = targetView.querySelectorAll('.line-content');
                console.log(`[SearchFix] Found ${lineContents.length} line content elements`);
                
                // Prepare for highlighting
                const searchTermLower = searchQuery.toLowerCase();
                const escapedTerm = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedTerm, 'gi');
                
                // Process each line content element
                lineContents.forEach((element, index) => {
                    const text = element.textContent;
                    
                    // Skip if this element doesn't contain the search term
                    if (!text.toLowerCase().includes(searchTermLower)) return;
                    
                    console.log(`[SearchFix] Found match in line ${index+1}`);
                    
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
            } catch (error) {
                console.error('[SearchFix] Error highlighting search terms:', error);
            }
        }
        
        // Function to patch the search functionality
        function patchSearch() {
            if (!window.fileSearch || typeof window.fileSearch.performSearch !== 'function') {
                console.warn('[SearchFix] File search not found, will retry...');
                setTimeout(patchSearch, 500);
                return;
            }
            
            console.log('[SearchFix] Patching file search functionality...');
            
            // Store the original performSearch function
            const originalPerformSearch = window.fileSearch.performSearch;
            
            // Replace with patched version
            window.fileSearch.performSearch = function(query) {
                // Call the original function
                const result = originalPerformSearch.call(this, query);
                
                // Apply search highlighting after search results are processed
                setTimeout(highlightSearchTerms, 100);
                
                return result;
            };
            
            console.log('[SearchFix] File search functionality patched');
        }
        
        // Function to observe DOM changes and apply highlighting when view changes
        function setupViewChangeObserver() {
            // Get the diff viewer container
            const diffViewer = document.getElementById('diffViewer');
            if (!diffViewer) {
                console.warn('[SearchFix] Diff viewer not found, will retry...');
                setTimeout(setupViewChangeObserver, 500);
                return;
            }
            
            console.log('[SearchFix] Setting up view change observer...');
            
            // Create a MutationObserver to watch for changes to the diff viewer
            const observer = new MutationObserver(function(mutations) {
                // Check if there's an active search
                if (!window.fileSearch || 
                    typeof window.fileSearch.isSearchActive !== 'function' || 
                    !window.fileSearch.isSearchActive()) {
                    return;
                }
                
                // Check if any of the mutations affected the view
                let viewChanged = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' || 
                        (mutation.type === 'attributes' && 
                         (mutation.target.classList.contains('new-file-view') || 
                          mutation.target.classList.contains('old-file-view') ||
                          mutation.target.classList.contains('diff-table')))) {
                        viewChanged = true;
                    }
                });
                
                if (viewChanged) {
                    console.log('[SearchFix] View changed, applying search highlighting...');
                    setTimeout(highlightSearchTerms, 50);
                }
            });
            
            // Start observing the diff viewer
            observer.observe(diffViewer, { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ['class']
            });
            
            console.log('[SearchFix] View change observer set up');
        }
        
        // Function to patch view toggle buttons
        function patchViewToggleButtons() {
            // Get the view toggle buttons
            const diffViewButton = document.getElementById('diffViewButton');
            const newViewButton = document.getElementById('newViewButton');
            const oldViewButton = document.getElementById('oldViewButton');
            
            if (!diffViewButton || !newViewButton || !oldViewButton) {
                console.warn('[SearchFix] View toggle buttons not found, will retry...');
                setTimeout(patchViewToggleButtons, 500);
                return;
            }
            
            console.log('[SearchFix] Patching view toggle buttons...');
            
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
                setTimeout(highlightSearchTerms, 50);
            };
            
            // Enhance the new view button
            newViewButton.onclick = function(event) {
                // Call original handler
                if (typeof originalNewClick === 'function') {
                    originalNewClick.call(this, event);
                }
                
                // Apply search highlighting
                setTimeout(highlightSearchTerms, 50);
            };
            
            // Enhance the old view button
            oldViewButton.onclick = function(event) {
                // Call original handler
                if (typeof originalOldClick === 'function') {
                    originalOldClick.call(this, event);
                }
                
                // Apply search highlighting
                setTimeout(highlightSearchTerms, 50);
            };
            
            console.log('[SearchFix] View toggle buttons patched');
        }
        
        // Initialize all patches
        patchSearch();
        patchViewToggleButtons();
        setupViewChangeObserver();
        
        // Apply initial search highlighting if there's an active search
        setTimeout(highlightSearchTerms, 500);
        
        console.log('[SearchFix] Search fix initialized');
    }
    
    // Wait for the document to be fully loaded
    if (document.readyState === 'complete') {
        // Document already loaded, initialize immediately
        setTimeout(initSearchFix, 1000);
    } else {
        // Wait for the document to load
        window.addEventListener('load', function() {
            // Wait a bit to ensure all modules are loaded
            setTimeout(initSearchFix, 1000);
        });
    }
})();
