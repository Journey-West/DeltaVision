<!--
  SearchResultsList.svelte
  Component for displaying search results
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { searchStore } from '../../stores/searchStore';
  import { formatFileSize } from '../../utils/formatUtils';
  
  // Props
  export let results = [];
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Handle file selection
  function handleFileSelect(file) {
    // Ensure file has all required metadata for display
    const enhancedFile = {
      ...file,
      // Use metadata if available, or provide defaults
      size: file.metadata?.size || file.size || 0,
      lastModified: file.metadata?.modifiedTime 
        ? new Date(file.metadata.modifiedTime).toLocaleString() 
        : file.lastModified || new Date().toLocaleString()
    };
    
    searchStore.setSelectedFile(enhancedFile);
    dispatch('select', enhancedFile);
  }
  
  // Format file path for display
  function formatPath(filePath) {
    if (!filePath) return '';
    const parts = filePath.split('/');
    const fileName = parts.pop();
    const directory = parts.join('/');
    return directory;
  }
  
  // Get match type label
  function getMatchTypeLabel(result) {
    if (result.matches.inName && result.matches.inContent.length > 0) {
      return 'Name & Content';
    } else if (result.matches.inName) {
      return 'Name';
    } else {
      return 'Content';
    }
  }
  
  // Get match type class
  function getMatchTypeClass(result) {
    if (result.matches.inName && result.matches.inContent.length > 0) {
      return 'name-content';
    } else if (result.matches.inName) {
      return 'name-only';
    } else {
      return 'content-only';
    }
  }
</script>

<div class="search-results">
  <h3>Search Results ({results.length})</h3>
  
  {#if results.length === 0}
    <p class="no-results">No results found</p>
  {:else}
    <div class="results-list">
      {#each results as result}
        <button 
          class="result-item"
          on:click={(e) => {
            e.preventDefault(); // Prevent default browser behavior
            handleFileSelect(result);
          }}>
          
          <div class="file-name">
            <span class="name">{result.fileName}</span>
            <span class="badge {getMatchTypeClass(result)}">{getMatchTypeLabel(result)}</span>
          </div>
          
          <div class="file-path">{formatPath(result.filePath)}</div>
          
          <div class="file-meta">
            <span class="size">{result.metadata ? formatFileSize(result.metadata.size) : 'Unknown size'}</span>
            <span class="date">{result.metadata ? new Date(result.metadata.modifiedTime).toLocaleString() : ''}</span>
          </div>
          
          {#if result.matches.inContent.length}
            <div class="match-preview">
              {#each result.matches.inContent.slice(0, 3) as match}
                <div class="match-line">
                  <span class="line-number">{match.lineNumber}:</span>
                  <span class="line-content">{match.lineContent}</span>
                </div>
              {/each}
              
              {#if result.matches.inContent.length > 3}
                <div class="more-matches">
                  +{result.matches.inContent.length - 3} more matches
                </div>
              {/if}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-results {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.3rem;
    color: var(--text);
    font-weight: 700;
    letter-spacing: 0.5px;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--primary);
  }
  
  .no-results {
    color: var(--textSecondary, #666);
    font-style: italic;
  }
  
  .results-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .result-item {
    display: block;
    width: 100%;
    padding: 0.85rem;
    margin-bottom: 0.85rem;
    border-radius: 6px;
    background-color: var(--searchResultBackground);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
    color: var(--text);
    box-shadow: 0 1px 3px var(--shadowLight);
  }
  
  .result-item:hover {
    border-color: var(--primary);
    box-shadow: 0 2px 5px var(--shadow);
    background-color: var(--searchResultBackgroundHover);
    transform: translateY(-1px);
  }
  
  .file-name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  .file-name .name {
    font-family: var(--font-mono, monospace);
    font-size: 1.05rem;
    color: var(--searchResultFilenameText);
    font-weight: 700;
    background-color: var(--searchResultFilenameBackground);
    padding: 2px 6px;
    border-radius: 3px;
    display: inline-block;
  }
  
  .badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .badge.name-only {
    background-color: var(--infoLight, #e3f2fd);
    color: var(--info, #2196f3);
  }
  
  .badge.content-only {
    background-color: var(--successLight, #e8f5e9);
    color: var(--success, #4caf50);
  }
  
  .badge.name-content {
    background-color: var(--infoLight, #e8eaf6);
    color: var(--primary, #3f51b5);
  }
  
  .file-path {
    font-size: 0.8rem;
    color: var(--textSecondary, #666);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-mono, monospace);
  }
  
  .file-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--textTertiary, #999);
    margin-bottom: 0.5rem;
  }
  
  .match-preview {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: var(--background, #f5f5f5);
    border-radius: 3px;
    font-size: 0.85rem;
    border-left: 3px solid var(--searchHighlight, #ff8c00);
  }
  
  .match-line {
    display: flex;
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }
  
  .line-number {
    flex-shrink: 0;
    width: 3rem;
    color: var(--textTertiary, #999);
    font-family: var(--font-mono, monospace);
    font-weight: 500;
  }
  
  .line-content {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: var(--font-mono, monospace);
  }
  
  .more-matches {
    font-size: 0.75rem;
    color: var(--textTertiary, #999);
    font-style: italic;
    margin-top: 0.25rem;
  }
</style>
