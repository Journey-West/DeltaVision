<!--
  SearchView.svelte
  Main component for the search feature, integrating SearchBar, SearchResultsList, and FileContentViewer
-->
<script>
  import { onMount } from 'svelte';
  import { searchStore } from '../../stores/searchStore';
  import SearchBar from './SearchBar.svelte';
  import SearchResultsList from './SearchResultsList.svelte';
  import FileContentViewer from './FileContentViewer.svelte';
  import SearchPlaceholder from './SearchPlaceholder.svelte';
  
  // Detect if running in web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  
  // Props
  export let directoryPath = '';
  
  // Local state
  let isSearching = false;
  let searchError = null;
  let searchResults = [];
  let selectedFile = null;
  let searchTerm = '';
  let searchParams = {
    searchNames: true,
    searchContent: true,
    caseSensitive: false
  };
  
  // Subscribe to search store
  onMount(() => {
    const unsubscribe = searchStore.subscribe(state => {
      searchResults = state.results;
      selectedFile = state.selectedFile;
      searchTerm = state.searchTerm;
      searchParams = state.searchParams;
      isSearching = state.isSearching;
      searchError = state.error;
    });
    
    return unsubscribe;
  });
  
  // Handle search submission
  async function handleSearch(event) {
    const { directoryPath, searchTerm, options } = event.detail;
    
    console.log('Search event received:', { directoryPath, searchTerm, options });
    
    if (!directoryPath || !searchTerm) {
      console.error('Missing required search parameters:', { directoryPath, searchTerm });
      searchStore.setError('Directory path and search term are required');
      return;
    }
    
    try {
      // Update store state
      searchStore.startSearch();
      console.log('Search started, updated store state');
      
      let result;
      
      if (isWebBrowser) {
        // In web browser, use the API endpoint to search files
        console.log('Using web API for search');
        try {
          const requestBody = {
            directoryPath,
            searchTerm,
            options
          };
          
          console.log('Sending search request to API:', requestBody);
          
          const response = await fetch('/api/search-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('Search API response status:', response.status);
          
          if (response.ok) {
            result = await response.json();
            console.log('Search API response data:', result);
            
            // Check if the result has the expected structure
            if (result && typeof result === 'object') {
              // If the result doesn't have a success property, add it
              if (result.success === undefined) {
                result.success = true;
              }
              
              // If the result doesn't have a results property but has data, use that
              if (!result.results && result.data) {
                result.results = result.data;
              }
              
              // If the result still doesn't have a results property, create an empty array
              if (!result.results) {
                console.warn('Search result missing results property, creating empty array');
                result.results = [];
              }
            } else {
              console.error('Invalid search result format:', result);
              throw new Error('Invalid search result format');
            }
          } else {
            const errorText = await response.text();
            console.error('Search API error response:', errorText);
            throw new Error(`Search failed: ${response.statusText}. ${errorText}`);
          }
        } catch (error) {
          console.error('Error searching files via API:', error);
          throw error;
        }
      } else {
        // In desktop app, call the main process to search files
        console.log('Using Electron IPC for search');
        result = await window.electronAPI.searchFiles({
          directoryPath,
          searchTerm,
          options
        });
      }
      
      if (result.success) {
        // Sort results by modification time (newest first) to match Stream view behavior
        const sortedResults = result.results.sort((a, b) => {
          const aTime = a.metadata?.modifiedTime ? new Date(a.metadata.modifiedTime) : new Date(0);
          const bTime = b.metadata?.modifiedTime ? new Date(b.metadata.modifiedTime) : new Date(0);
          return bTime - aTime; // Newest first
        });
        searchStore.setResults(sortedResults);
      } else {
        searchStore.setError(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      searchStore.setError(error.message || 'Search failed');
    }
  }
  
  // Handle file selection
  function handleFileSelect(event) {
    selectedFile = event.detail;
  }
  
  // Handle clear search
  function handleClearSearch() {
    searchStore.clearSearch();
  }
</script>

<div class="search-view">
  <div class="search-header">
    <SearchBar 
      {directoryPath}
      on:search={handleSearch}
      on:clear={handleClearSearch}
    />
    
    {#if isSearching}
      <div class="search-status searching">
        <div class="spinner"></div>
        <span>Searching...</span>
      </div>
    {:else if searchError}
      <div class="search-status error">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>{searchError}</span>
      </div>
    {/if}
  </div>
  
  <div class="search-content">
    {#if searchResults.length > 0}
      <div class="search-results-panel">
        <SearchResultsList 
          results={searchResults}
          on:select={handleFileSelect}
        />
      </div>
      
      <div class="file-content-panel">
        <FileContentViewer 
          file={selectedFile}
          searchTerm={searchTerm}
          searchParams={searchParams}
        />
      </div>
    {:else if isSearching}
      <SearchPlaceholder 
        heading="Searching..." 
        message="Looking for files matching your search criteria." 
      />
    {:else}
      <SearchPlaceholder />
    {/if}
  </div>
</div>

<style>
  .search-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .search-header {
    flex-shrink: 0;
  }
  

  
  .search-status {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .search-status.searching {
    background-color: var(--infoLight);
    color: var(--info);
  }
  
  .search-status.error {
    background-color: var(--errorLight);
    color: var(--error);
  }
  
  .search-status svg {
    margin-right: 0.5rem;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--info);
    border-radius: 50%;
    margin-right: 0.5rem;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .search-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  
  .search-results-panel {
    width: 40%;
    min-width: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 100%;
    border-right: 1px solid var(--border);
    padding-right: 0.5rem;
  }
  
  .file-content-panel {
    flex: 1;
    overflow: hidden;
    padding-left: 0.5rem;
  }
  
  /* Search placeholder styles moved to SearchPlaceholder.svelte */
</style>
