/**
 * Direct Highlight Fix for DeltaVision
 * 
 * This script provides a direct, no-frills approach to fixing search highlighting
 * in all view modes, especially the New File view.
 */

(function() {
    // Wait for the window to fully load
    window.addEventListener('load', function() {
        // Wait for the DOM to be fully loaded
        setTimeout(function() {
            console.log('[DirectHighlightFix] Initializing direct highlight fix...');
            
            // Function to directly highlight search terms in all views
            function directHighlightSearchTerms() {
                // Check if there's an active search
                if (!window.fileSearch || 
                    typeof window.fileSearch.getCurrentQuery !== 'function' || 
                    !window.fileSearch.getCurrentQuery()) {
                    return;
                }
                
                const searchQuery = window.fileSearch.getCurrentQuery();
                console.log(`[DirectHighlightFix] Highlighting search term: "${searchQuery}"`);
                
                // Get all line content elements in the document
                const lineContents = document.querySelectorAll('.line-content');
                console.log(`[DirectHighlightFix] Found ${lineContents.length} line content elements`);
                
                // Process each line content element
                lineContents.forEach((element, index) => {
                    const text = element.textContent;
                    
                    // Skip if this element doesn't contain the search term
                    if (!text.toLowerCase().includes(searchQuery.toLowerCase())) return;
                    
                    console.log(`[DirectHighlightFix] Found match in line ${index+1}`);
                    
                    // Escape special regex characters in search term
                    const escapedTerm = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    
                    // Create a replacement HTML with highlighted terms
                    const regex = new RegExp(`(${escapedTerm})`, 'gi');
                    
                    // Create a temporary element to hold the highlighted HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = text.replace(regex, '<span class="search-term-highlight">$1</span>');
                    
                    // Replace the element's HTML
                    element.innerHTML = tempDiv.innerHTML;
                });
            }
            
            // Function to observe search input changes
            function observeSearchInput() {
                const searchInput = document.getElementById('fileSearchInput');
                const searchButton = document.getElementById('fileSearchButton');
                
                if (!searchInput || !searchButton) {
                    console.warn('[DirectHighlightFix] Search input not found, will retry...');
                    setTimeout(observeSearchInput, 500);
                    return;
                }
                
                // Monitor search input changes
                searchInput.addEventListener('input', function() {
                    // Apply highlighting after a short delay
                    setTimeout(directHighlightSearchTerms, 300);
                });
                
                // Monitor search button clicks
                searchButton.addEventListener('click', function() {
                    // Apply highlighting after a short delay
                    setTimeout(directHighlightSearchTerms, 300);
                });
                
                // Monitor search input Enter key
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        // Apply highlighting after a short delay
                        setTimeout(directHighlightSearchTerms, 300);
                    }
                });
                
                console.log('[DirectHighlightFix] Search input observers set up');
            }
            
            // Function to observe view changes
            function observeViewChanges() {
                const diffViewer = document.getElementById('diffViewer');
                if (!diffViewer) {
                    console.warn('[DirectHighlightFix] Diff viewer not found, will retry...');
                    setTimeout(observeViewChanges, 500);
                    return;
                }
                
                // Get view toggle buttons
                const diffViewButton = document.getElementById('diffViewButton');
                const newViewButton = document.getElementById('newViewButton');
                const oldViewButton = document.getElementById('oldViewButton');
                
                if (diffViewButton) {
                    diffViewButton.addEventListener('click', function() {
                        setTimeout(directHighlightSearchTerms, 100);
                    });
                }
                
                if (newViewButton) {
                    newViewButton.addEventListener('click', function() {
                        setTimeout(directHighlightSearchTerms, 100);
                    });
                }
                
                if (oldViewButton) {
                    oldViewButton.addEventListener('click', function() {
                        setTimeout(directHighlightSearchTerms, 100);
                    });
                }
                
                // Create a mutation observer to watch for DOM changes
                const observer = new MutationObserver(function(mutations) {
                    // Apply highlighting after DOM changes
                    setTimeout(directHighlightSearchTerms, 100);
                });
                
                // Start observing the diff viewer
                observer.observe(diffViewer, { 
                    childList: true, 
                    subtree: true
                });
                
                console.log('[DirectHighlightFix] View change observers set up');
            }
            
            // Initialize observers
            observeSearchInput();
            observeViewChanges();
            
            // Apply initial highlighting if there's an active search
            setTimeout(directHighlightSearchTerms, 1000);
            
            // Set up periodic re-highlighting to ensure it works in all views
            setInterval(directHighlightSearchTerms, 2000);
            
            console.log('[DirectHighlightFix] Direct highlight fix initialized');
        }, 1000);
    });
})();
