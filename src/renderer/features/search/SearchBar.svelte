<!--
  SearchBar.svelte
  Component for search input and options
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { searchStore } from '../../stores/searchStore';
  
  // Detect if running in web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  
  // Props
  export let directoryPath = '';
  
  // Local state
  let searchTerm = '';
  let searchNames = true;
  let searchContent = true;
  let caseSensitive = false;
  let isExpanded = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Handle search submission
  function handleSearch() {
    if (!searchTerm.trim()) return;
    
    console.log('Search initiated with term:', searchTerm);
    console.log('Directory path:', directoryPath);
    
    const searchParams = {
      searchTerm,
      searchNames,
      searchContent,
      caseSensitive
    };
    
    // Update store
    searchStore.setSearchParams(searchParams);
    
    // Make sure directoryPath is set for web browser environment
    const effectiveDirectoryPath = isWebBrowser && !directoryPath ? 
      '/home/user/Projects/FileDiff/test_files' : directoryPath;
    
    console.log('Using directory path for search:', effectiveDirectoryPath);
    
    // Dispatch event to parent
    dispatch('search', {
      directoryPath: effectiveDirectoryPath,
      searchTerm,
      options: {
        searchNames,
        searchContent,
        caseSensitive
      }
    });
  }
  
  // Handle clear search
  function handleClear() {
    searchTerm = '';
    searchStore.clearSearch();
    dispatch('clear');
  }
  
  // Toggle advanced options
  function toggleOptions() {
    isExpanded = !isExpanded;
  }
</script>

<div class="search-bar">
  <div class="search-input-container">
    <input 
      type="text" 
      class="search-input"
      bind:value={searchTerm} 
      placeholder="Search files..." 
      on:keydown={e => e.key === 'Enter' && handleSearch()}
    />
    
    <button 
      class="search-button" 
      on:click={handleSearch} 
      disabled={!searchTerm.trim() || !directoryPath}
      title={!directoryPath ? 'Select a directory first' : 'Search files'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    </button>
    
    <button 
      class="clear-button" 
      on:click={handleClear} 
      disabled={!searchTerm.trim()}
      title="Clear search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
    
    <button 
      class="options-button" 
      on:click={toggleOptions} 
      class:active={isExpanded}
      title="Search options"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
        <path fill="currentColor" d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
      </svg>
    </button>
  </div>
  
  {#if isExpanded}
    <div class="search-options">
      <label class="option">
        <input type="checkbox" bind:checked={searchNames} />
        <span>Search file names</span>
      </label>
      
      <label class="option">
        <input type="checkbox" bind:checked={searchContent} />
        <span>Search file content</span>
      </label>
      
      <label class="option">
        <input type="checkbox" bind:checked={caseSensitive} />
        <span>Case sensitive</span>
      </label>
    </div>
  {/if}
</div>

<style>
  .search-bar {
    width: 100%;
    margin-bottom: 1rem;
    background-color: var(--searchBarBackground);
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid var(--border);
  }
  
  .search-input-container {
    display: flex;
    align-items: center;
    width: 100%;
  }
  
  .search-input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--inputBorder);
    border-radius: 4px;
    font-size: 0.95rem;
    background-color: var(--inputBackground);
    color: var(--inputText);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--inputFocusBorder);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
  }
  
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-left: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background-color: var(--buttonSecondary);
    color: var(--buttonSecondaryText);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  button:hover:not(:disabled) {
    background-color: var(--buttonSecondaryHover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .search-button {
    background-color: var(--buttonBackground);
    color: var(--buttonText);
    border-color: var(--buttonBackground);
    font-weight: 500;
  }
  
  .search-button:hover:not(:disabled) {
    background-color: var(--buttonHover);
    border-color: var(--buttonHover);
  }
  
  .options-button.active {
    background-color: var(--info);
    color: var(--buttonText);
  }
  
  .search-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-top: 1px solid var(--border);
  }
  
  .option {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--text);
  }
  
  .option input {
    margin-right: 0.5rem;
    accent-color: var(--checkboxChecked);
  }
</style>
