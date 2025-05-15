// File search module
export function initFileSearch(fileManager) {
    // Elements
    const searchInput = document.getElementById('fileSearchInput');
    const searchButton = document.getElementById('fileSearchButton');
    const clearButton = document.getElementById('clearSearchButton');
    const resetButton = document.getElementById('resetSearchButton');
    const searchStatus = document.getElementById('searchStatus');
    const searchResultsCount = document.getElementById('searchResultsCount');
    
    // State
    let searchResults = [];
    let searchTimeout;
    let isSearchActive = false;
    let currentSearchQuery = '';
    
    // Initialize search components
    function init() {
        if (!searchInput || !searchButton || !clearButton || !resetButton) {
            console.error('[FileSearch] Search components not found in DOM');
            return;
        }
        
        // Event listeners
        searchInput.addEventListener('input', handleSearchInput);
        searchButton.addEventListener('click', () => performSearch(searchInput.value));
        clearButton.addEventListener('click', clearSearch);
        resetButton.addEventListener('click', clearSearch);
        
        // Submit on enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                performSearch(searchInput.value);
            }
        });
        
        // Setup filter message buttons
        setupFilterMessageButtons();
        
        console.log('[FileSearch] Search functionality initialized');
    }
    
    // Setup the filter message buttons
    function setupFilterMessageButtons() {
        const selectAllButton = document.getElementById('selectAllFilters');
        const selectRecommendedButton = document.getElementById('selectRecommendedFilters');
        const filterMessage = document.getElementById('filterMessage');
        
        if (!selectAllButton || !selectRecommendedButton || !filterMessage) {
            console.warn('[FileSearch] Filter message elements not found');
            return;
        }
        
        // Select all file types
        selectAllButton.addEventListener('click', () => {
            const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
            filterCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            
            // Hide the message
            filterMessage.classList.remove('visible');
            
            // Trigger the filter change event on the first checkbox to apply filters
            const event = new Event('change');
            filterCheckboxes[0].dispatchEvent(event);
        });
        
        // Select recommended file types (New and Comparison)
        selectRecommendedButton.addEventListener('click', () => {
            const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
            filterCheckboxes.forEach(checkbox => {
                // Check New and Comparison, uncheck others
                checkbox.checked = (checkbox.value === 'new-only' || checkbox.value === 'comparison');
            });
            
            // Hide the message
            filterMessage.classList.remove('visible');
            
            // Trigger the filter change event on the first checkbox to apply filters
            const event = new Event('change');
            filterCheckboxes[0].dispatchEvent(event);
        });
    }
    
    // Handle input in search field (debounced)
    function handleSearchInput(e) {
        const query = e.target.value.trim();
        
        // Show/hide clear button based on input
        clearButton.style.display = query ? 'flex' : 'none';
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        // If empty query, clear search
        if (!query) {
            clearSearch();
            return;
        }
        
        // Set timeout for debounced search (500ms)
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    }
    
    // Perform search against the API
    async function performSearch(query) {
        if (!query || query.trim() === '') {
            clearSearch();
            return;
        }
        
        // Store the current search query
        currentSearchQuery = query;
        
        try {
            // Show loading state in search button
            searchButton.innerHTML = '<div class="search-loading"></div>';
            searchButton.disabled = true;
            
            // Call the search API
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            // Get search results
            searchResults = await response.json();
            
            // Update UI with results
            updateSearchResults(searchResults, query);
            
            // Set search as active
            isSearchActive = true;
            
        } catch (error) {
            console.error('Error performing search:', error);
            
            // Show error in status
            searchStatus.style.display = 'block';
            searchStatus.innerHTML = '<span class="search-error">Search failed. Please try again.</span>';
            
        } finally {
            // Reset search button
            searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
            searchButton.disabled = false;
        }
    }
    
    // Update UI with search results
    function updateSearchResults(results, query) {
        console.log('[FileSearch] Processing search results:', results);
        const fileEntries = document.querySelectorAll('.file-entry');
        const resultCount = results.length;
        
        // Update status display
        searchStatus.style.display = 'flex';
        searchResultsCount.textContent = resultCount;
        
        // First, reset all entries to hidden state
        fileEntries.forEach(entry => {
            entry.classList.add('search-hidden');
            entry.classList.remove('search-match');
            
            // Remove any existing match count badge
            const badge = entry.querySelector('.match-count');
            if (badge) {
                entry.removeChild(badge);
            }
            
            // Reset any highlighting
            const strong = entry.querySelector('strong');
            if (strong) {
                strong.innerHTML = strong.textContent;
            }
        });
        
        // Get active file type filters
        const activeFilters = getActiveFileTypeFilters();
        
        // Check if all file types are unchecked
        const filterMessage = document.getElementById('filterMessage');
        if (activeFilters.length === 0) {
            // Show the filter message
            if (filterMessage) {
                filterMessage.classList.add('visible');
            }
            return; // Don't process any results if no file types are selected
        } else {
            // Hide the filter message
            if (filterMessage) {
                filterMessage.classList.remove('visible');
            }
        }
        
        // If no files were found matching the query, we're done (all files remain hidden)
        if (resultCount === 0) {
            return;
        }
        
        // Debug: log all file entries and their data attributes
        console.log('[FileSearch] Available file entries:');
        fileEntries.forEach((entry, i) => {
            console.log(`Entry ${i}:`, {
                oldPath: entry.dataset.oldPath,
                newPath: entry.dataset.newPath,
                text: entry.textContent.trim()
            });
        });
        
        // We already have activeFilters from earlier in the function
        console.log(`[FileSearch] Active file type filters:`, activeFilters);
        
        // Track files that have been matched
        const matchedFiles = new Map();
        
        // Process each search result
        results.forEach(result => {
            // Extract file paths and match count from the server response format
            const oldFilePath = result.oldFile?.path;
            const newFilePath = result.newFile?.path;
            const matchCount = result.matches || 1;
            console.log(`[FileSearch] Processing result: ${oldFilePath || newFilePath} (${matchCount} matches)`);
            
            // Find all entries matching this result
            fileEntries.forEach(entry => {
                const entryOldPath = entry.dataset.oldPath;
                const entryNewPath = entry.dataset.newPath;
                
                // Check if this entry matches the current search result
                const oldPathMatches = oldFilePath && entryOldPath === oldFilePath;
                const newPathMatches = newFilePath && entryNewPath === newFilePath;
                
                if (oldPathMatches || newPathMatches) {
                    console.log(`[FileSearch] Found matching entry:`, entry.textContent.trim());
                    
                    // Check if this file type is being filtered
                    const fileType = getFileTypeFromEntry(entry);
                    if (!activeFilters.includes(fileType)) {
                        console.log(`[FileSearch] Entry filtered out by file type filter: ${fileType}`);
                        return; // Skip this entry if its type is not in active filters
                    }
                    
                    // Show the entry with match styling
                    entry.classList.remove('search-hidden');
                    entry.classList.add('search-match');
                    
                    // Add match count badge
                    let badge = entry.querySelector('.match-count');
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'match-count';
                        entry.appendChild(badge);
                    }
                    
                    // Check if this is a comparison file (has both old and new paths)
                    if (entryOldPath && entryNewPath) {
                        // For comparison files, show separate counts for old and new files
                        const oldMatches = result.oldFile?.matches || 0;
                        const newMatches = result.newFile?.matches || 0;
                        
                        // Clear the badge content
                        badge.innerHTML = '';
                        
                        // Create styled elements for the counts and separator
                        const oldCountSpan = document.createElement('span');
                        oldCountSpan.className = 'old-count';
                        oldCountSpan.textContent = oldMatches;
                        
                        const separatorSpan = document.createElement('span');
                        separatorSpan.className = 'separator';
                        separatorSpan.textContent = '/';
                        
                        const newCountSpan = document.createElement('span');
                        newCountSpan.className = 'new-count';
                        newCountSpan.textContent = newMatches;
                        
                        // Append the elements to the badge
                        badge.appendChild(oldCountSpan);
                        badge.appendChild(separatorSpan);
                        badge.appendChild(newCountSpan);
                        
                        badge.title = `${oldMatches} matches in old file, ${newMatches} matches in new file`;
                    } else {
                        // For single files (old-only or new-only), show the total count
                        badge.textContent = matchCount;
                    }
                    
                    // Highlight the search term in the entry text
                    const strong = entry.querySelector('strong');
                    if (strong) {
                        const text = strong.textContent;
                        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                        // Only attempt to replace if the text contains the query
                        if (text.toLowerCase().includes(query.toLowerCase())) {
                            strong.innerHTML = text.replace(regex, '<span class="search-match">$1</span>');
                        }
                    }
                    
                    // Mark this file as processed
                    matchedFiles.set(entryOldPath || entryNewPath, true);
                }
            });
        });
        
        console.log(`[FileSearch] Updated UI with ${matchedFiles.size} visible entries`);
    }
    
    // Helper function to get active file type filters
    function getActiveFileTypeFilters() {
        const filters = [];
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            if (checkbox.checked) {
                filters.push(checkbox.value);
            }
        });
        
        // Return only the checked filters - if none are checked, the empty array will hide all files
        return filters;
    }
    
    // Helper function to determine the file type from a file entry
    function getFileTypeFromEntry(entry) {
        // Check classes to determine file type
        if (entry.classList.contains('old-only')) {
            return 'old-only';
        } else if (entry.classList.contains('new-only')) {
            return 'new-only';
        } else if (entry.classList.contains('same-command-diff')) {
            return 'same-command';
        } else if (entry.classList.contains('time-comparison')) {
            return 'time'; // This might need to be handled separately
        } else if (entry.classList.contains('comparison')) {
            return 'comparison';
        }
        return null;
    }
    
    // Clear search and restore original file list
    function clearSearch() {
        // Reset search input
        if (searchInput) searchInput.value = '';
        
        // Hide buttons and status
        if (clearButton) clearButton.style.display = 'none';
        if (searchStatus) searchStatus.style.display = 'none';
        
        // Get all file entries
        const fileEntries = document.querySelectorAll('.file-entry');
        
        // Show all file entries and remove search styling
        fileEntries.forEach(entry => {
            entry.classList.remove('search-hidden');
            entry.classList.remove('search-match');
            
            // Remove match count badges
            const badge = entry.querySelector('.match-count');
            if (badge) {
                entry.removeChild(badge);
            }
            
            // Reset any highlighting
            const strong = entry.querySelector('strong');
            if (strong) {
                strong.innerHTML = strong.textContent;
            }
        });
        
        // Clear search results
        searchResults = [];
        isSearchActive = false;
        currentSearchQuery = '';
    }
    
    // Helper function to escape special regex characters in search query
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Initialize on load
    init();
    
    // Create the public API object
    const fileSearchApi = {
        performSearch,
        clearSearch,
        isSearchActive: () => isSearchActive,
        getCurrentQuery: () => currentSearchQuery
    };
    
    // Expose to window for other modules to access
    window.fileSearch = fileSearchApi;
    
    // Return the API
    return fileSearchApi;
}
