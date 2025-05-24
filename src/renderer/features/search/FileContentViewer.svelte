<!--
  FileContentViewer.svelte
  Component for displaying file content with search term highlighting
-->
<script>
  import { onMount, afterUpdate } from 'svelte';
  import { searchStore } from '../../stores/searchStore';
  import { highlightLines } from '../highlight/ContentHighlighter';
  
  // Detect if running in web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  
  // Props
  export let file = null;
  export let searchTerm = '';
  export let searchParams = { caseSensitive: false };
  
  // Local state
  let fileContent = '';
  let highlightedLines = [];
  let currentMatchIndex = 0;
  let totalMatches = 0;
  let allMatches = [];
  let contentElement;
  let isLoading = false;
  let error = null;
  
  // Use onMount to set up subscriptions and initialize the component
  onMount(() => {
    // Initial load if file is provided
    if (file) {
      loadFileContent(file.filePath);
    }
    
    // Return cleanup function
    return () => {
      // Cleanup code if needed
    };
  });
  
  // Watch for file changes
  $: if (file) {
    loadFileContent(file.filePath);
  }
  
  // Watch for content or search term changes
  $: if (fileContent && searchTerm) {
    updateHighlighting();
  }
  
  // Load file content
  async function loadFileContent(filePath) {
    if (!filePath) return;
    
    isLoading = true;
    error = null;
    fileContent = ''; // Clear existing content
    highlightedLines = [];
    
    try {
      let content;
      
      if (isWebBrowser) {
        // In web browser, use the API endpoint to read file content
        try {
          const response = await fetch('/api/read-file-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filePath
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              content = data.content;
            } else {
              throw new Error(data.error || 'Failed to load file');
            }
          } else {
            throw new Error(`Failed to load file: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Error loading file content via API:', error);
          throw error;
        }
      } else {
        // In desktop app, call the main process to read file content
        content = await window.electronAPI.readFileContent(filePath);
      }
      
      if (content) {
        fileContent = content;
        // Process the content after it's loaded
        if (searchTerm) {
          updateHighlighting();
        } else {
          // If no search term, just split the content into lines
          highlightedLines = fileContent.split('\n').map(line => ({ line, hasMatch: false }));
        }
        
        // Schedule scrolling to first match after the DOM updates
        if (totalMatches > 0) {
          setTimeout(() => scrollToMatch(0), 100);
        }
      }
    } catch (err) {
      console.error('Error loading file content:', err);
      error = `Failed to load file: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  // Update highlighting based on search term
  function updateHighlighting() {
    if (!fileContent || !searchTerm) {
      highlightedLines = fileContent.split('\n').map(line => ({ 
        line, 
        hasMatch: false, 
        matchCount: 0, 
        matchPositions: [] 
      }));
      totalMatches = 0;
      allMatches = [];
      return;
    }
    
    const lines = fileContent.split('\n');
    highlightedLines = highlightLines(lines, searchTerm, searchParams);
    
    // Calculate total matches and build a flat array of all matches
    allMatches = [];
    let matchCount = 0;
    
    highlightedLines.forEach((line, lineIndex) => {
      if (line.hasMatch) {
        line.matchPositions.forEach(pos => {
          allMatches.push({
            lineIndex,
            matchIndex: pos.globalIndex,
            position: pos
          });
          matchCount++;
        });
      }
    });
    
    // Sort matches by their global index
    allMatches.sort((a, b) => a.matchIndex - b.matchIndex);
    
    totalMatches = matchCount;
    
    // Reset current match index
    currentMatchIndex = totalMatches > 0 ? 0 : -1;
  }
  
  // Scroll to a specific match
  function scrollToMatch(index) {
    if (index < 0 || index >= totalMatches || !contentElement || allMatches.length === 0) return;
    
    // Remove active classes from all elements
    const matchElements = contentElement.querySelectorAll('.match-highlight');
    matchElements.forEach(el => {
      el.classList.remove('current-match');
    });
    
    // Remove current-match-line class from all lines
    const allLines = contentElement.querySelectorAll('.line');
    allLines.forEach(line => {
      line.classList.remove('current-match-line');
    });
    
    // Get the current match information
    const matchInfo = allMatches[index];
    currentMatchIndex = index;
    
    if (matchInfo) {
      // Get the line element containing this match
      const lineElement = contentElement.querySelector(`#line-${matchInfo.lineIndex}`);
      
      if (lineElement) {
        // Add current-match-line class to the line containing the current match
        lineElement.classList.add('current-match-line');
        
        // Find the specific match highlight by its global index
        const matchHighlight = lineElement.querySelector(`.match-highlight[data-global-index="${matchInfo.matchIndex}"]`);
        
        if (matchHighlight) {
          // Add current-match class to highlight the active match
          matchHighlight.classList.add('current-match');
          
          // Scroll the match into view
          matchHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to scrolling the line into view if match element not found
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }
  
  // Navigate to next/previous match
  function navigateToMatch(direction) {
    if (totalMatches === 0) return;
    
    if (direction === 'next') {
      currentMatchIndex = (currentMatchIndex + 1) % totalMatches;
    } else if (direction === 'prev') {
      currentMatchIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    }
    
    scrollToMatch(currentMatchIndex);
  }
</script>

<div class="file-content-viewer">
  {#if isLoading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <span>Loading file content...</span>
    </div>
  {:else if error}
    <div class="error">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{error}</span>
    </div>
  {:else if !file}
    <div class="no-file">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      <span>Select a file to view its content</span>
    </div>
  {:else}
    <div class="file-header">
      <div class="file-title">
        <h3>{file.fileName}</h3>
        {#if searchTerm && totalMatches > 0}
          <div class="match-badge">{totalMatches} {totalMatches === 1 ? 'match' : 'matches'}</div>
        {/if}
      </div>
      <div class="file-info">
        <div class="file-path">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span title="{file.filePath}">{file.filePath}</span>
        </div>
        <div class="file-metadata">
          <span class="file-size">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            {file.size ? `${file.size} bytes` : 'Calculating size...'}
          </span>
          <span class="file-date">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {file.lastModified || new Date().toLocaleString()}
          </span>
        </div>
      </div>
      {#if searchTerm && totalMatches > 0}
        <div class="match-navigation">
          <button class="nav-button prev" on:click={() => navigateToMatch('prev')} disabled={currentMatchIndex <= 0}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Previous</span>
          </button>
          <span class="match-count">{currentMatchIndex + 1} of {totalMatches}</span>
          <button class="nav-button next" on:click={() => navigateToMatch('next')} disabled={currentMatchIndex >= totalMatches - 1}>
            <span>Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      {/if}
    </div>
    <div class="file-content" bind:this={contentElement}>
      <pre>
        {#each highlightedLines as line, index}
          <div class="line" id="line-{index}" class:has-match={line.hasMatch}>
            <span class="line-number">{index + 1}</span>
            <span class="line-content">{@html line.line}</span>
          </div>
        {/each}
      </pre>
    </div>
  {/if}
</div>

<style>
  .file-content-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 8px;
    background-color: var(--secondary, #ffffff);
    color: var(--text, #333333);
  }

  .file-header {
    padding: 16px;
    border-bottom: 1px solid var(--border, #e0e0e0);
    background-color: var(--secondary, #ffffff);
  }

  .file-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .file-title h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text, #333333);
  }

  .match-badge {
    background-color: var(--buttonBackground);
    color: var(--buttonText);
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid var(--buttonBackground);
  }

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: var(--textSecondary, #666666);
  }

  .file-path {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Courier New', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-metadata {
    display: flex;
    gap: 16px;
  }

  .file-size, .file-date {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .match-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background-color: var(--secondary, #2d2d2d);
    border-radius: 6px;
    border: 1px solid var(--border, #3a3a3a);
    margin-top: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .match-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--textPrimary, #e0e0e0);
  }

  .nav-button {
    background-color: var(--buttonBackground);
    color: var(--buttonText);
    border: 1px solid var(--buttonBackground);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px var(--shadowLight);
  }

  .nav-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-button:not(:disabled):hover {
    background-color: var(--buttonHover);
    border-color: var(--buttonHover);
    transform: translateY(-2px);
    box-shadow: 0 3px 6px var(--shadow);
  }

  .file-content {
    flex: 1;
    overflow: auto;
    padding: 0;
    background-color: var(--secondary, #ffffff);
  }

  .file-content pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    tab-size: 4;
  }

  .line {
    display: flex;
    line-height: 1.5;
    min-height: 1.5em;
  }

  .line.has-match {
    /* Remove the line background highlight */
    background-color: transparent;
  }

  .line-number {
    user-select: none;
    text-align: right;
    padding: 0 12px;
    min-width: 50px;
    color: var(--textSecondary, #666666);
    border-right: 1px solid var(--border, #e0e0e0);
    background-color: var(--background, #f5f5f5);
  }

  .has-match .line-number {
    background-color: var(--searchHighlightBg, rgba(255, 255, 0, 0.1));
    font-weight: 500;
  }
  
  /* Add a special style for the line number of the current match */
  :global(.current-match-line) .line-number {
    background-color: var(--searchHighlightBg, rgba(255, 140, 0, 0.2));
    font-weight: 700;
    border-right: 2px solid var(--searchHighlight, #ff4500);
  }

  .line-content {
    padding: 0 12px;
    white-space: pre-wrap;
    word-break: break-all;
    flex: 1;
  }

  :global(.match-highlight) {
    background-color: var(--searchHighlightBg, rgba(255, 165, 0, 0.4));
    color: var(--textPrimary, inherit);
    padding: 2px 0;
    border-radius: 2px;
    font-weight: 500;
    position: relative;
    transition: all 0.2s ease;
    border-bottom: 1px solid var(--searchHighlight, rgba(255, 165, 0, 0.7));
  }
  
  :global(.current-match) {
    background-color: var(--searchHighlight, rgba(255, 140, 0, 0.8)) !important;
    color: var(--searchHighlightText, white);
    box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.5);
    border-bottom: 2px solid var(--searchHighlight, #ff4500);
    text-decoration: underline;
    text-decoration-color: var(--searchHighlight, #ff4500);
    text-decoration-thickness: 2px;
    text-underline-offset: 4px;
    z-index: 5;
    animation: pulse 1.5s infinite;
    font-weight: 700;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7); }
    70% { box-shadow: 0 0 0 6px rgba(255, 140, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    gap: 16px;
    color: var(--textSecondary, #666666);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--info, #4a90e2);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    gap: 16px;
    color: var(--error, #dc3545);
    text-align: center;
  }

  .no-file {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    gap: 16px;
    color: var(--textSecondary, #666666);
    text-align: center;
  }
</style>
