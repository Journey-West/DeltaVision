<script>
  import { theme } from '../stores/themeStore';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  // Event dispatcher for communicating with parent component
  const dispatch = createEventDispatcher();
  
  // This handler will be empty as we've consolidated keyboard handling below
  function handleKeyDown() {}
  
  
  // Props
  export let diffResults = [];
  export let isLoading = false;
  export let keywordCategories = [];
  export let highlightingEnabled = false;
  export let keywordFilter = null;
  
  // Local state
  let selectedDiffIndex = 0;
  let viewMode = 'diff'; // 'diff', 'new-only', 'old-only'
  let diffMode = 'line'; // 'line', 'word', or 'none'
  let fileFilter = 'all'; // 'all', 'new-only', 'old-only', 'modified', 'version-compare'
  
  // Computed properties
  $: selectedDiff = diffResults[selectedDiffIndex] || null;
  $: hasDiffs = diffResults.length > 0;
  
  // Filtered diff results based on the active filter and keyword filter
  $: filteredDiffResults = diffResults.filter(result => {
    // First apply file type filter
    let passesFileFilter = false;
    if (fileFilter === 'all') passesFileFilter = true;
    else if (fileFilter === 'new-only' && result.isNewFile) passesFileFilter = true;
    else if (fileFilter === 'old-only' && result.isOldFile) passesFileFilter = true;
    else if (fileFilter === 'diff' && !result.isNewFile && !result.isOldFile && !result.isNewVersionsCompare) passesFileFilter = true;
    else if (fileFilter === 'before-after' && result.isNewVersionsCompare) passesFileFilter = true;
    
    // If file type filter fails, return false immediately
    if (!passesFileFilter) return false;
    
    // Then apply keyword filter if one is active
    if (keywordFilter) {
      // Check if the file content contains the keyword
      const oldContent = result.oldContent || '';
      const newContent = result.newContent || '';
      const combinedContent = oldContent + newContent;
      
      // Create a regex that matches whole words only
      const regex = new RegExp(`\\b${keywordFilter}\\b`, 'i');
      return regex.test(combinedContent);
    }
    
    // If no keyword filter or file passes keyword filter
    return true;
  });
  
  // Reset selected diff index when filter changes
  $: {
    // If the current selection is not in the filtered results, select the first filtered result
    if (filteredDiffResults.length > 0 && !filteredDiffResults.includes(diffResults[selectedDiffIndex])) {
      selectedDiffIndex = diffResults.indexOf(filteredDiffResults[0]);
    }
  }
  
  // Update when keyword filter changes
  $: {
    // When keyword filter changes, dispatch an event to notify parent
    dispatch('keywordFilterChange', { keywordFilter });
  }
  
  // Get counts for each file type for the filter badges
  $: fileCounts = {
    all: diffResults.length,
    diff: diffResults.filter(r => !r.isNewFile && !r.isOldFile && !r.isNewVersionsCompare).length,
    'new-only': diffResults.filter(r => r.isNewFile).length,
    'old-only': diffResults.filter(r => r.isOldFile).length,
    'before-after': diffResults.filter(r => r.isNewVersionsCompare).length
  };
  
  // No need to process files for keyword counting anymore
  
  // Track the previous diff index to detect file changes
  let previousDiffIndex = -1;
  
  // Reset view mode when selecting a different file, but preserve diff mode
  $: if (selectedDiff) {
    // For new-only files, force 'new-only' view mode
    if (selectedDiff.isNewFile) {
      viewMode = 'new-only';
    } 
    // For old-only files, force 'old-only' view mode
    else if (selectedDiff.isOldFile) {
      viewMode = 'old-only';
    } 
    // For new version comparisons, default to diff view
    else if (selectedDiff.isNewVersionsCompare) {
      viewMode = 'diff';
    }
    // For regular files, default to diff view
    else {
      viewMode = 'diff';
    }
    
    // Only reload with current diff mode when switching between files (not when toggling view modes)
    if (selectedDiffIndex !== previousDiffIndex && selectedDiff && !selectedDiff.isNewFile && !selectedDiff.isOldFile) {
      reloadDiffWithMode(selectedDiff, diffMode);
      previousDiffIndex = selectedDiffIndex;
    }
  }
  
  // Helper function to determine line class based on diff part
  function getLineClass(part) {
    if (part.added) return 'added';
    if (part.removed) return 'removed';
    return 'unchanged';
  }
  
  // Toggle between line, word, and no diff modes
  async function toggleDiffMode() {
    // Cycle through diff modes: line -> word -> none -> line
    if (diffMode === 'line') {
      diffMode = 'word';
    } else if (diffMode === 'word') {
      diffMode = 'none';
    } else {
      diffMode = 'line';
    }
    
    // If we have a selected diff, reload it with the new mode
    if (selectedDiff) {
      console.log(`Toggling diff mode to: ${diffMode}`);
      await reloadDiffWithMode(selectedDiff, diffMode);
    }
  }
  
  // Detect if running in web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;

  // Reload diff with a different mode (line, word, none)
  async function reloadDiffWithMode(diff, mode) {
    try {
      if (!diff) return;
      
      // For new-only or old-only files, no need to reload
      if (diff.isNewFile || diff.isOldFile) return;
      
      if (isWebBrowser) {
        // In web browser, use the API endpoint to compare files
        const response = await fetch('/api/compare-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldFilePath: diff.oldFile,
            newFilePath: diff.newFile,
            diffMode: mode
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result) {
            // Update the diff result
            diffResults[selectedDiffIndex].diff = data.result.diffResult;
            diffResults[selectedDiffIndex].wordDiffResult = data.result.wordDiffResult;
            diffResults[selectedDiffIndex].diffMode = data.result.diffMode;
          }
        } else {
          console.error('Error comparing files via API:', response.statusText);
        }
      } else {
        // In desktop app, use the existing compareFiles API
        const result = await window.electronAPI.compareFiles(
          diff.oldFile,
          diff.newFile,
          mode
        );
        
        // Update the diff result for the selected file
        if (result) {
          // Update the diff result
          diffResults[selectedDiffIndex].diff = result.diffResult;
          diffResults[selectedDiffIndex].wordDiffResult = result.wordDiffResult;
          diffResults[selectedDiffIndex].diffMode = result.diffMode;
        }
      }
      
      // Force reactivity update
      diffResults = [...diffResults];
    } catch (error) {
      console.error('Error reloading diff with new mode:', error);
    }
  }
  
  // Render word-level diff
  function renderWordDiff(wordDiff, side) {
    if (!wordDiff) return '';
    
    // First sanitize the input to prevent XSS
    const sanitizeHtml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // Process the word diff parts, filtering based on which side we're rendering
    let processedContent = wordDiff.map(part => {
      // For the left side, we only show removed or unchanged words
      // For the right side, we only show added or unchanged words
      if (side === 'left' && part.added) return '';
      if (side === 'right' && part.removed) return '';
      
      // Sanitize the content
      const content = sanitizeHtml(part.value);
      
      // Apply appropriate class based on the part type
      if (part.added) {
        return `<span class="word-added">${content}</span>`;
      } else if (part.removed) {
        return `<span class="word-removed">${content}</span>`;
      } else {
        return content;
      }
    }).join('');
    
    // Apply keyword highlighting to the fully processed content
    if (highlightingEnabled && keywordCategories && keywordCategories.length > 0) {
      processedContent = highlightKeywords(processedContent);
    }
    
    return processedContent;
  }
  
  // Notify parent component when highlighting state changes
  function notifyHighlightingChange() {
    dispatch('highlightingChange', { highlightingEnabled });
  }
  
  // Apply keyword highlighting to text
  function highlightKeywords(text) {
    if (!highlightingEnabled || !keywordCategories || keywordCategories.length === 0) {
      return text;
    }
    
    // Create a copy of the text to work with
    let result = text;
    
    // Process each category
    keywordCategories.forEach(category => {
      // Process each keyword in the category
      category.keywords.forEach(keyword => {
        // Create a regex that matches whole words only
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        
        // Replace matches with highlighted version
        // Use a special data attribute to mark the keyword category
        // This preserves the original text color while allowing for underlines
        result = result.replace(regex, match => {
          return `<span class="keyword-highlight" data-category="${category.color}">${match}</span>`;
        });
      });
    });
    
    return result;
  }
  
  // Process diff results to create side-by-side view with aligned lines
  function processDiffForSideBySide(diffResult) {
    if (!diffResult) return { left: [], right: [] };
    
    // Handle new files that only exist in the new directory
    if (selectedDiff && selectedDiff.isNewFile) {
      return processNewOnlyFile(diffResult);
    }
    
    // Handle old files that only exist in the old directory
    if (selectedDiff && selectedDiff.isOldFile) {
      return processOldOnlyFile(diffResult);
    }
    
    // For normal diff processing, we need to carefully align the lines
    return processNormalDiff(diffResult);
  }
  
  // Process files that only exist in the new directory
  function processNewOnlyFile(diffResult) {
    const right = [];
    const left = [];
    let lineNumber = 1;
    
    // For new files, we only have content in the right column
    diffResult.forEach(part => {
      const lines = part.value.split('\n');
      // Remove the last empty line that comes from splitting on \n
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      // All lines are considered added since this is a new file
      lines.forEach(line => {
        // Create a unique row ID for this line pair
        const rowId = `line-${lineNumber}`;
        
        // Add empty line on the left side to maintain alignment
        left.push({
          id: rowId,
          number: lineNumber,
          content: '',
          highlightedContent: '',
          type: 'empty'
        });
        
        // Add actual content on the right side
        right.push({
          id: rowId,
          number: lineNumber,
          content: line,
          highlightedContent: highlightKeywords(line),
          type: 'added'
        });
        
        lineNumber++;
      });
    });
    
    return { left, right };
  }
  
  // Process files that only exist in the old directory
  function processOldOnlyFile(diffResult) {
    const left = [];
    const right = [];
    let lineNumber = 1;
    
    // For old-only files, we only have content in the left column
    diffResult.forEach(part => {
      const lines = part.value.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      // All lines are considered removed since this is an old-only file
      lines.forEach(line => {
        // Create a unique row ID for this line pair
        const rowId = `line-${lineNumber}`;
        
        // Add actual content on the left side
        left.push({
          id: rowId,
          number: lineNumber,
          content: line,
          highlightedContent: highlightKeywords(line),
          type: 'removed'
        });
        
        // Add empty line on the right side to maintain alignment
        right.push({
          id: rowId,
          number: lineNumber,
          content: '',
          highlightedContent: '',
          type: 'empty'
        });
        
        lineNumber++;
      });
    });
    
    return { left, right };
  }
  
  // Helper function to process normal diffs with proper line alignment
  function processNormalDiff(diffResult) {
    const left = [];
    const right = [];
    let lineNumber = 1;
    
    // First pass: collect all chunks and their types
    const chunks = [];
    
    diffResult.forEach(part => {
      const lines = part.value.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      
      if (part.removed) {
        // This is a removed chunk (left side only)
        chunks.push({
          type: 'removed',
          lines: lines,
          matched: false
        });
      } else if (part.added) {
        // This is an added chunk (right side only)
        chunks.push({
          type: 'added',
          lines: lines,
          matched: false
        });
      } else {
        // This is an unchanged chunk (both sides)
        chunks.push({
          type: 'unchanged',
          lines: lines,
          matched: true
        });
      }
    });
    
    // Second pass: try to match removed and added chunks that should be aligned
    // This is a simplified heuristic - in a real diff tool, this would be more sophisticated
    for (let i = 0; i < chunks.length - 1; i++) {
      if (chunks[i].type === 'removed' && chunks[i+1].type === 'added') {
        // Mark these chunks as a matched pair
        chunks[i].matched = true;
        chunks[i+1].matched = true;
        chunks[i].pair = i+1;
        chunks[i+1].pair = i;
        i++; // Skip the next chunk as we've already processed it
      }
    }
    
    // Third pass: process all chunks and create the aligned view
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (chunk.type === 'unchanged') {
        // Unchanged chunks are straightforward - same content on both sides
        chunk.lines.forEach(line => {
          // Create a unique row ID for this line pair
          const rowId = `line-${lineNumber}`;
          
          left.push({
            id: rowId,
            number: lineNumber,
            content: line,
            highlightedContent: highlightKeywords(line),
            type: 'unchanged'
          });
          
          right.push({
            id: rowId,
            number: lineNumber,
            content: line,
            highlightedContent: highlightKeywords(line),
            type: 'unchanged'
          });
          
          lineNumber++;
        });
      } else if (chunk.type === 'removed' && chunk.matched && chunks[chunk.pair].type === 'added') {
        // This is a matched removed/added pair - we need to align them line by line
        const removedLines = chunk.lines;
        const addedLines = chunks[chunk.pair].lines;
        const maxLines = Math.max(removedLines.length, addedLines.length);
        
        for (let j = 0; j < maxLines; j++) {
          // Create a unique row ID for this line pair
          const rowId = `line-${lineNumber}`;
          
          // Add left side (removed)
          left.push({
            id: rowId,
            number: lineNumber,
            content: j < removedLines.length ? removedLines[j] : '',
            highlightedContent: j < removedLines.length ? highlightKeywords(removedLines[j]) : '',
            type: j < removedLines.length ? 'removed' : 'empty'
          });
          
          // Add right side (added)
          right.push({
            id: rowId,
            number: lineNumber,
            content: j < addedLines.length ? addedLines[j] : '',
            highlightedContent: j < addedLines.length ? highlightKeywords(addedLines[j]) : '',
            type: j < addedLines.length ? 'added' : 'empty'
          });
          
          lineNumber++;
        }
        
        // Skip the paired chunk since we've already processed it
        i = chunk.pair;
      } else if (chunk.type === 'removed' && !chunk.matched) {
        // Unmatched removed chunk - only content on left side
        chunk.lines.forEach(line => {
          // Create a unique row ID for this line pair
          const rowId = `line-${lineNumber}`;
          
          left.push({
            id: rowId,
            number: lineNumber,
            content: line,
            highlightedContent: highlightKeywords(line),
            type: 'removed'
          });
          
          right.push({
            id: rowId,
            number: lineNumber,
            content: '',
            highlightedContent: '',
            type: 'empty'
          });
          
          lineNumber++;
        });
      } else if (chunk.type === 'added' && !chunk.matched) {
        // Unmatched added chunk - only content on right side
        chunk.lines.forEach(line => {
          // Create a unique row ID for this line pair
          const rowId = `line-${lineNumber}`;
          
          left.push({
            id: rowId,
            number: lineNumber,
            content: '',
            highlightedContent: '',
            type: 'empty'
          });
          
          right.push({
            id: rowId,
            number: lineNumber,
            content: line,
            highlightedContent: highlightKeywords(line),
            type: 'added'
          });
          
          lineNumber++;
        });
      }
    }
    
    return { left, right };
  }
  
  // Watch for changes in the highlighting state
  $: {
    notifyHighlightingChange();
  }
  
  // Computed property for processed diff - explicitly depends on highlightingEnabled and diffMode
  $: processedDiff = selectedDiff ? (highlightingEnabled, diffMode, processDiffForSideBySide(selectedDiff.diff)) : { left: [], right: [] };
  
  // Check if we should use word-level diffing
  $: useWordDiff = diffMode === 'word' && selectedDiff && selectedDiff.wordDiffResult && 
                   !selectedDiff.isNewFile && !selectedDiff.isOldFile;
                   
  // Check if we should use no diffing (plain text view)
  $: useNoDiff = diffMode === 'none' && selectedDiff && 
                !selectedDiff.isNewFile && !selectedDiff.isOldFile;
  
  // Store references to file items for scrolling into view
  let fileItemRefs = [];
  
  // Select a diff by index
  function selectDiff(index) {
    // Ensure index is within bounds
    if (index >= 0 && index < diffResults.length) {
      selectedDiffIndex = index;
      
      // Schedule scrolling the selected item into view after the DOM updates
      setTimeout(() => {
        scrollSelectedIntoView();
      }, 0);
    }
  }
  
  // Scroll the selected item into view and manage focus
  function scrollSelectedIntoView() {
    // Find the selected file item element
    const selectedItem = document.querySelector('.file-item.selected');
    if (selectedItem) {
      // Scroll the item into view with smooth behavior
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Move browser focus to the selected item to ensure focus and selection are in sync
      // This prevents the initial clicked item from keeping its focus outline
      selectedItem.focus();
    }
  }
  
  // Navigate to the next or previous file
  function navigateFiles(direction) {
    // Get the current filtered results
    const visibleFiles = filteredDiffResults;
    if (visibleFiles.length === 0) return;
    
    // Find the current file's position in the filtered results
    const currentFile = diffResults[selectedDiffIndex];
    let currentFilteredIndex = visibleFiles.indexOf(currentFile);
    
    // If current file is not in filtered results (e.g., after changing filter),
    // start from the beginning
    if (currentFilteredIndex === -1) {
      currentFilteredIndex = direction === 'next' ? -1 : visibleFiles.length;
    }
    
    // Calculate the new index
    let newFilteredIndex;
    if (direction === 'next') {
      newFilteredIndex = currentFilteredIndex < visibleFiles.length - 1 ? currentFilteredIndex + 1 : 0;
    } else {
      newFilteredIndex = currentFilteredIndex > 0 ? currentFilteredIndex - 1 : visibleFiles.length - 1;
    }
    
    // Select the file at the new index
    const newFile = visibleFiles[newFilteredIndex];
    selectDiff(diffResults.indexOf(newFile));
  }
  
  // Set up keyboard event listener for the whole component
  
  // Handle keyboard events
  function handleKeydown(event) {
    // Only handle keyboard navigation when the diff viewer is active
    if (!hasDiffs) return;
    
    // Handle Ctrl+W to toggle diff mode
    if (event.ctrlKey && event.key === 'w') {
      event.preventDefault(); // Prevent browser from closing the window
      toggleDiffMode();
      return;
    }
    
    switch(event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        navigateFiles('next');
        event.preventDefault();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        navigateFiles('previous');
        event.preventDefault();
        break;
      case 'Tab':
        // Let Tab navigation work normally, but ensure our selection follows
        // We'll handle this after the default behavior completes
        setTimeout(() => {
          // Find the currently focused element
          const focusedElement = document.activeElement;
          if (focusedElement && focusedElement.classList.contains('file-item')) {
            // Extract the index from the focused item and update selection
            const index = parseInt(focusedElement.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
              selectDiff(index);
            }
          }
        }, 0);
        break;
      case 'd':
        // Toggle diff mode
        diffMode = diffMode === 'line' ? 'word' : 'line';
        break;
    }
  }
  
  // Add and remove global keyboard event listeners
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    
    // Initial scroll to selected item when component mounts
    setTimeout(() => {
      scrollSelectedIntoView();
    }, 100);
  });
  
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  
  // Watch for changes in selectedDiffIndex to ensure visual focus follows
  $: if (selectedDiffIndex !== undefined) {
    // This reactive statement ensures the visual focus follows when selectedDiffIndex changes
    setTimeout(() => {
      scrollSelectedIntoView();
    }, 0);
  }
</script>

<main class="diff-viewer" role="application" aria-label="File diff viewer with keyboard navigation">
  {#if isLoading}
    <div class="loading">
      <p>Comparing files, please wait...</p>
    </div>
  {:else if !hasDiffs}
    <div class="no-diffs">
      <p>No matching files found to compare.</p>
      <p>Please make sure both directories contain files with matching prefixes before the double underline (__) and matching titles in the first line.</p>
    </div>
  {:else}
    <div class="diff-container">
      <!-- File list sidebar -->
      <div class="file-list-sidebar">
        <div class="sidebar-header">
          <div class="title-container">
            <h3 class="sidebar-title">Documents</h3>
          </div>
          
          <!-- Filter buttons -->
          <div class="sidebar">
            <div class="filter-controls">
              <button 
                class="filter-button filter-all {fileFilter === 'all' ? 'active' : ''}"
                on:click={() => fileFilter = 'all'}
                aria-pressed={fileFilter === 'all'}
                title="Show all files"
              >
                <span class="filter-icon">•</span>
                All <span class="count-badge">{fileCounts.all}</span>
              </button>
              <button 
                class="filter-button filter-modified {fileFilter === 'diff' ? 'active' : ''}"
                on:click={() => fileFilter = 'diff'}
                aria-pressed={fileFilter === 'diff'}
                title="Show only diff files"
                disabled={fileCounts.diff === 0}
              >
                <span class="filter-icon">•</span>
                Diff <span class="count-badge">{fileCounts.diff}</span>
              </button>
              <button 
                class="filter-button filter-new {fileFilter === 'new-only' ? 'active' : ''}"
                on:click={() => fileFilter = 'new-only'}
                aria-pressed={fileFilter === 'new-only'}
                title="Show only new files"
                disabled={fileCounts['new-only'] === 0}
              >
                <span class="filter-icon">•</span>
                New Only <span class="count-badge">{fileCounts['new-only']}</span>
              </button>
              <button 
                class="filter-button filter-old {fileFilter === 'old-only' ? 'active' : ''}"
                on:click={() => fileFilter = 'old-only'}
                aria-pressed={fileFilter === 'old-only'}
                title="Show only old files"
                disabled={fileCounts['old-only'] === 0}
              >
                <span class="filter-icon">•</span>
                Old Only <span class="count-badge">{fileCounts['old-only']}</span>
              </button>
              <button 
                class="filter-button filter-version {fileFilter === 'before-after' ? 'active' : ''}"
                on:click={() => fileFilter = 'before-after'}
                aria-pressed={fileFilter === 'before-after'}
                title="Show before and after comparison files"
                disabled={fileCounts['before-after'] === 0}
              >
                <span class="filter-icon">•</span>
                Before & After <span class="count-badge">{fileCounts['before-after']}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="file-list">
          {#if filteredDiffResults.length === 0}
            <div class="no-files-message">
              No files match the current filter.
            </div>
          {/if}
          {#each filteredDiffResults as result (diffResults.indexOf(result))}
            <button 
              class="file-item {diffResults.indexOf(result) === selectedDiffIndex ? 'selected' : ''}"
              on:click={() => selectDiff(diffResults.indexOf(result))}
              aria-selected={diffResults.indexOf(result) === selectedDiffIndex}
              role="tab"
              tabindex="{diffResults.indexOf(result) === selectedDiffIndex ? '0' : '-1'}"
              data-index={diffResults.indexOf(result)}
              on:keydown={e => e.key === 'Enter' && selectDiff(diffResults.indexOf(result))}
            >
              <div class="file-indicator {result.isNewFile ? 'new-file-indicator' : result.isOldFile ? 'old-file-indicator' : result.isNewVersionsCompare ? 'version-compare-indicator' : 'modified-file-indicator'}"></div>
              <div class="file-content">
                <div class="file-title">{result.title}</div>
                <div class="file-info-preview">
                  <span class="file-prefix">{result.prefix}</span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Diff content area -->
      <div class="diff-content-area">
        {#if selectedDiff}
          <div class="diff-header">
            <div class="file-info">
              {#if selectedDiff.isNewFile}
                <div class="file-badge new-file-badge">
                  <span class="badge-icon">+</span>
                  <span class="badge-text">New Only</span>
                </div>
              {:else if selectedDiff.isOldFile}
                <div class="file-badge old-file-badge">
                  <span class="badge-icon">-</span>
                  <span class="badge-text">Old Only</span>
                </div>
              {:else if selectedDiff.isNewVersionsCompare}
                <div class="file-badge version-compare-badge">
                  <span class="badge-icon">↺</span>
                  <span class="badge-text">{selectedDiff.timeDifference} apart</span>
                </div>
              {/if}
              <div class="old-file" class:hidden={selectedDiff.isNewFile}>
                <h3>Old File</h3>
                <div class="file-name">{selectedDiff.oldFileName}</div>
                {#if selectedDiff.oldFileMeta}
                  <div class="file-metadata old-file-metadata">
                    <div class="file-type-indicator"></div>
                    <div class="metadata-grid">
                      <div class="metadata-row">
                        <div class="metadata-label">Size:</div>
                        <div class="metadata-value">{selectedDiff.oldFileMeta.size}</div>
                      </div>
                      <div class="metadata-row">
                        <div class="metadata-label">Modified:</div>
                        <div class="metadata-value">{selectedDiff.oldFileMeta.modifiedDate}</div>
                      </div>
                      <div class="metadata-row">
                        <div class="metadata-label">Path:</div>
                        <div class="metadata-value path-value">{selectedDiff.oldFileMeta.fullPath}</div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
              <div class="new-file" class:hidden={selectedDiff.isOldFile}>
                <h3>New File</h3>
                <div class="file-name">{selectedDiff.newFileName}</div>
                {#if selectedDiff.newFileMeta}
                  <div class="file-metadata new-file-metadata">
                    <div class="file-type-indicator"></div>
                    <div class="metadata-grid">
                      <div class="metadata-row">
                        <div class="metadata-label">Size:</div>
                        <div class="metadata-value">{selectedDiff.newFileMeta.size}</div>
                      </div>
                      <div class="metadata-row">
                        <div class="metadata-label">Modified:</div>
                        <div class="metadata-value">{selectedDiff.newFileMeta.modifiedDate}</div>
                      </div>
                      <div class="metadata-row">
                        <div class="metadata-label">Path:</div>
                        <div class="metadata-value path-value">{selectedDiff.newFileMeta.fullPath}</div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- View mode buttons -->
            {#if !selectedDiff.isNewFile && !selectedDiff.isOldFile}
              <!-- For regular files that exist in both directories -->
                <div class="view-mode-buttons">
                  <button 
                    class="view-mode-button {viewMode === 'diff' ? 'active' : ''}"
                    on:click={() => viewMode = 'diff'}
                    aria-pressed={viewMode === 'diff'}
                  >
                    Side-by-Side Diff
                  </button>
                  <button 
                    class="view-mode-button {viewMode === 'old-only' ? 'active' : ''}"
                    on:click={() => viewMode = 'old-only'}
                    aria-pressed={viewMode === 'old-only'}
                  >
                    Old File Only
                  </button>
                  <button 
                    class="view-mode-button {viewMode === 'new-only' ? 'active' : ''}"
                    on:click={() => viewMode = 'new-only'}
                    aria-pressed={viewMode === 'new-only'}
                  >
                    New File Only
                  </button>
                  
                  <!-- Diff mode toggle button (only show for regular diffs) -->
                  {#if !selectedDiff?.isNewFile && !selectedDiff?.isOldFile}
                    <button 
                      class="diff-mode-button {diffMode === 'word' ? 'word-mode' : diffMode === 'none' ? 'none-mode' : 'line-mode'}"
                      on:click={toggleDiffMode}
                      title="Toggle between line diff, word diff, and no diff modes (Ctrl+W)"
                      aria-pressed={diffMode !== 'line'}
                    >
                      {diffMode === 'line' ? 'Line Diff' : diffMode === 'word' ? 'Word Diff' : 'Diff Off'}
                    </button>
                  {/if}
                </div>
            {/if}
          </div>
          
          <div class="side-by-side-container">
            <!-- Different layouts based on view mode -->
            {#if viewMode === 'diff' && !selectedDiff.isNewFile}
              <!-- Side-by-side diff view with synchronized scrolling -->
              <div class="diff-wrapper">
                <!-- Column headers -->
                <div class="diff-headers">
                  <div class="column-header old-header">
                    <h4>Old File</h4>
                  </div>
                  <div class="column-header new-header">
                    <h4>New File</h4>
                  </div>
                </div>
                
                <!-- Diff content with synchronized rows -->
                {#if useNoDiff}
                  <!-- No diff highlighting view (plain text) -->
                  <div class="diff-content">
                    {#each processedDiff.left as leftLine, i}
                      {@const rightLine = processedDiff.right[i]}
                      <div class="diff-row" id={leftLine.id}>
                        <!-- Left column -->
                        <div class="line-number left-number">{leftLine.number}</div>
                        <div class="line-text left-text">{@html highlightKeywords(leftLine.content)}</div>
                        
                        <!-- Right column -->
                        <div class="line-number right-number">{rightLine.number}</div>
                        <div class="line-text right-text">{@html highlightKeywords(rightLine.content)}</div>
                      </div>
                    {/each}
                  </div>
                {:else if useWordDiff}
                  <!-- Word-level diff view with row-based structure -->
                  <div class="diff-content">
                    {#each selectedDiff.wordDiffResult as row, i}
                      <div class="diff-row" id={row.id || `word-diff-row-${i}`}>
                        <!-- Left column (old file) -->
                        <div class="line-number left-number {row.left.type} {row.left.number === -1 ? 'placeholder-number' : ''}">
                          {row.left.number > 0 ? row.left.number : ''}
                        </div>
                        <div class="line-text left-text">
                          {#if row.left.type === 'modified' && row.left.wordDiff}
                            <!-- Word-level diff for modified lines -->
                            {@html renderWordDiff(row.left.wordDiff, 'left')}
                          {:else if row.left.type === 'removed'}
                            <!-- Entire line is removed -->
                            <span class="line-removed">{@html highlightKeywords(row.left.content)}</span>
                          {:else}
                            <!-- Regular text for unchanged lines -->
                            {@html highlightKeywords(row.left.content)}
                          {/if}
                        </div>
                        
                        <!-- Right column (new file) -->
                        <div class="line-number right-number {row.right.type} {row.right.number === -1 ? 'placeholder-number' : ''}">
                          {row.right.number > 0 ? row.right.number : ''}
                        </div>
                        <div class="line-text right-text">
                          {#if row.right.type === 'modified' && row.right.wordDiff}
                            <!-- Word-level diff for modified lines -->
                            {@html renderWordDiff(row.right.wordDiff, 'right')}
                          {:else if row.right.type === 'added'}
                            <!-- Entire line is added -->
                            <span class="line-added">{@html highlightKeywords(row.right.content)}</span>
                          {:else if row.right.type !== 'empty'}
                            <!-- Regular text for unchanged lines -->
                            {@html highlightKeywords(row.right.content)}
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <!-- Standard line-level diff view -->
                  <div class="diff-content">
                    {#each processedDiff.left as leftLine, i}
                      {@const rightLine = processedDiff.right[i]}
                      <div class="diff-row" id={leftLine.id}>
                        <!-- Left column -->
                        <div class="line-number left-number {leftLine.type}">{leftLine.number}</div>
                        <div class="line-text left-text {leftLine.type}">{@html leftLine.highlightedContent || leftLine.content}</div>
                        
                        <!-- Right column -->
                        <div class="line-number right-number {rightLine.type}">{rightLine.number}</div>
                        <div class="line-text right-text {rightLine.type}">{@html rightLine.highlightedContent || rightLine.content}</div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else if viewMode === 'old-only' && !selectedDiff.isNewFile}
              <!-- Old version only view -->
              <div class="diff-wrapper">
                <div class="column-header full-width">
                  <h4>Old File</h4>
                </div>
                <div class="single-column-content">
                  {#each processedDiff.left as line}
                    <div class="single-line-row" id={line.id}>
                      <div class="line-number {line.type}">{line.number}</div>
                      <div class="line-text unchanged">{@html line.highlightedContent || line.content}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <!-- New version only view (default for new files) -->
              <div class="diff-wrapper">
                <div class="column-header full-width">
                  <h4>{selectedDiff.isNewFile ? 'New File Content' : 'New File'}</h4>
                </div>
                <div class="single-column-content">
                  {#each processedDiff.right as line}
                    <div class="single-line-row" id={line.id}>
                      <div class="line-number {line.type}">{line.number}</div>
                      <div class="line-text unchanged">{@html line.highlightedContent || line.content}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  .diff-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--background);
    color: var(--text);
    outline: none; /* Remove outline when focused */
  }
  
  .loading, .no-diffs {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    text-align: center;
    padding: 20px;
    color: #666;
  }
  
  .diff-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    overflow: hidden;
  }
  
  /* File list sidebar styles */
  .file-list-sidebar {
    display: flex;
    flex-direction: column;
    width: 250px;
    border-right: 1px solid var(--border);
    background-color: var(--secondary);
    overflow: hidden;
  }
  
  /* Active filter indicator styles */
  .active-filter-indicator {
    background-color: var(--primary, #4a90e2);
    color: white;
    padding: 8px 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1px;
  }
  
  .filter-label {
    font-weight: 500;
    margin-right: 5px;
  }
  
  .filter-value {
    font-weight: 600;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
  }
  
  .clear-filter {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    padding: 0 0 0 8px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }
  
  .clear-filter:hover {
    opacity: 1;
  }
  
  /* Filter controls */
  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    background-color: transparent;
  }
  
  .filter-button {
    background-color: var(--background);
    border: 2px solid var(--border);
    color: var(--text);
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-weight: 500;
    height: 28px;
  }
  
  /* Color-specific filter styles */
  .filter-all {
    border-color: #666;
  }
  
  .filter-modified {
    border-color: #3b82f6; /* Blue for diff files */
  }
  
  .filter-new {
    border-color: #22c55e; /* Green for new files */
  }
  
  .filter-old {
    border-color: #ef4444; /* Red for old/removed files */
  }
  
  .filter-version {
    border-color: #a855f7; /* Purple for version comparisons */
  }
  
  .filter-icon {
    font-size: 1.2em;
    line-height: 0.8;
  }
  
  .filter-all .filter-icon {
    color: #666;
  }
  
  .filter-modified .filter-icon {
    color: #3b82f6;
  }
  
  .filter-new .filter-icon {
    color: #22c55e;
  }
  
  .filter-old .filter-icon {
    color: #ef4444;
  }
  
  .filter-version .filter-icon {
    color: #a855f7;
  }
  
  .filter-button:hover:not(:disabled) {
    background-color: var(--hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
  
  .filter-button.active {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
  }
  
  .filter-all.active {
    border-color: #666;
    background-color: rgba(102, 102, 102, 0.1);
  }
  
  .filter-modified.active {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  .filter-new.active {
    border-color: #22c55e;
    background-color: rgba(34, 197, 94, 0.1);
  }
  
  .filter-old.active {
    border-color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
  }
  
  .filter-version.active {
    border-color: #a855f7;
    background-color: rgba(168, 85, 247, 0.1);
  }
  
  .filter-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .count-badge {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 1px 6px;
    font-size: 0.7rem;
    min-width: 16px;
    text-align: center;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .filter-button.active .count-badge {
    background-color: rgba(0, 0, 0, 0.15);
  }
  
  .no-files-message {
    padding: 16px;
    text-align: center;
    color: var(--text);
    opacity: 0.7;
    font-style: italic;
  }
  
  .sidebar-header {
    border-bottom: 1px solid var(--border);
    background-color: var(--secondary);
    padding: 15px 15px 10px 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .sidebar-title {
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.5px;
  }
  
  .document-count {
    background-color: var(--background);
    color: var(--text);
    font-size: 0.8em;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  
  .file-list {
    overflow-y: auto;
    flex-grow: 1;
    padding: 10px 5px;
    background-color: var(--background);
    max-height: calc(100vh - 200px); /* Limit height to ensure scrollbar appears */
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: var(--border) var(--background); /* For Firefox */
  }
  
  /* Webkit scrollbar styles for file list */
  .file-list::-webkit-scrollbar {
    width: 8px;
  }
  
  .file-list::-webkit-scrollbar-track {
    background: var(--background);
  }
  
  .file-list::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 4px;
    border: 2px solid var(--background);
  }
  
  .file-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    outline: none; /* Remove default focus outline */
    overflow: hidden;
  }
  
  .file-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5px;
    border-radius: 0 2px 2px 0;
  }
  
  .new-file-indicator {
    background-color: #22c55e; /* Bright green that's more visible */
    box-shadow: 0 0 3px rgba(34, 197, 94, 0.5); /* Add subtle glow effect */
  }
  
  .old-file-indicator {
    background-color: #ef4444; /* Bright red for removed files */
    box-shadow: 0 0 3px rgba(239, 68, 68, 0.5); /* Add subtle glow effect */
  }
  
  .version-compare-indicator {
    background-color: #a855f7; /* Bright purple for version comparisons */
    box-shadow: 0 0 3px rgba(168, 85, 247, 0.5); /* Add subtle glow effect */
  }
  
  .modified-file-indicator {
    background-color: #3b82f6; /* Bright blue that's more visible */
    box-shadow: 0 0 3px rgba(59, 130, 246, 0.5); /* Add subtle glow effect */
  }
  
  /* Future indicator types can be added here */
  /* Example:
  .deleted-file-indicator {
    background-color: var(--removed);
  }
  
  .renamed-file-indicator {
    background-color: var(--secondary);
  }
  */
  
  .file-content {
    padding-left: 8px;
  }
  
  .file-item:hover {
    background-color: var(--sidebar-hover);
  }
  
  .file-item.selected {
    background-color: var(--sidebarActive);
    border-left: 3px solid var(--primary);
    position: relative;
    z-index: 1;
    box-shadow: 0 0 0 2px var(--primary);
    /* Ensure text is visible regardless of background color */
    color: var(--sidebarActiveText, var(--text));
  }
  
  /* Style for when an item has focus but is not selected */
  .file-item:focus:not(.selected) {
    box-shadow: none;
    outline: none;
  }
  
  /* Only show focus styles when the selected item has focus */
  .file-item.selected:focus {
    box-shadow: 0 0 0 2px var(--primary);
    outline: none;
  }
  
  .file-name {
    font-size: 0.9em;
    margin-bottom: 5px;
    color: var(--text-secondary);
    word-break: break-all;
  }
  
  .file-metadata {
    font-size: 0.8em;
    color: var(--text-secondary);
    margin-top: 8px;
    padding: 8px 10px;
    background-color: var(--background-secondary);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }
  
  /* File type indicator vertical bar */
  .file-type-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }
  
  /* Color indicators for different file types */
  .old-file-metadata .file-type-indicator {
    background-color: var(--removedBackground, #ffcdd2);
  }
  
  .new-file-metadata .file-type-indicator {
    background-color: var(--addedBackground, #c8e6c9);
  }
  
  .metadata-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 4px 8px;
  }
  
  .metadata-row {
    display: contents;
  }
  
  .metadata-label {
    font-weight: 600;
    color: var(--text-secondary);
    padding: 2px 0;
  }
  
  .metadata-value {
    padding: 2px 0;
  }
  
  .path-value {
    word-break: break-all;
    font-family: monospace;
    font-size: 0.95em;
    color: var(--text-primary);
  }
  
  .file-info-preview {
    font-size: 12px;
    color: var(--sidebar-text);
    opacity: 0.8;
  }
  
  .file-prefix {
    color: var(--sidebar-text);
    opacity: 0.7;
  }
  
  /* Diff content area styles */
  .diff-content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    max-height: 100vh; /* Ensure it doesn't exceed viewport height */
  }
  
  .diff-header {
    padding: 10px 15px;
    background-color: var(--secondary);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .file-info {
    display: flex;
    justify-content: space-between;
    position: relative;
  }
  
  .view-mode-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .view-mode-button, .diff-mode-button {
    padding: 6px 12px;
    border-radius: 4px;
    background-color: var(--buttonBackground);
    color: var(--buttonText);
    border: 2px solid var(--border, #555); /* Thicker, more visible border */
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500; /* Slightly bolder text */
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
  }
  
  .view-mode-button:hover, .diff-mode-button:hover {
    background-color: var(--buttonHover);
    border-color: var(--primary, #4a90e2); /* Use primary color for border on hover */
    transform: translateY(-1px); /* Subtle lift effect */
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */
  }
  
  .view-mode-button.active {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
    font-weight: 600; /* Bolder text for active state */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Stronger shadow for active state */
    transform: translateY(-1px); /* Subtle lift effect for active state */
  }
  
  /* Distinct styles for word and line diff mode buttons */
  .diff-mode-button.word-mode {
    background-color: var(--addedBackground, #c8e6c9);
    color: var(--text-dark, #333);
    border-color: var(--addedBackground, #c8e6c9);
    font-weight: 600;
  }
  
  .diff-mode-button.line-mode {
    background-color: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .diff-mode-button.none-mode {
    background-color: var(--secondary);
    color: var(--text);
  }
  
  /* Common styles for all file badges */
  .file-badge {
    position: absolute;
    top: 8px;
    right: 10px;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .file-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  .badge-icon {
    margin-right: 5px;
    font-weight: bold;
    font-size: 14px;
  }
  
  .badge-text {
    letter-spacing: 0.3px;
    color: #000000;
  }
  
  /* Specific badge styles */
  .new-file-badge {
    background-color: var(--addedBackground, #c8e6c9);
    border: 1px solid var(--added, #81c784);
  }
  
  .old-file-badge {
    background-color: var(--removedBackground, #ffcdd2);
    border: 1px solid var(--removed, #e57373);
  }
  
  .version-compare-badge {
    background-color: var(--background-secondary, #e3f2fd);
    border: 1px solid var(--primary, #64b5f6);
  }
  
  /* Only the badge icon can have a different color */
  .new-file-badge .badge-icon {
    color: var(--text-dark, #2e7d32);
  }
  
  .old-file-badge .badge-icon {
    color: var(--text-dark, #c62828);
  }
  
  .version-compare-badge .badge-icon {
    color: var(--primary, #1976d2);
  }
  
  .hidden {
    display: none;
  }
  
  .full-width {
    width: 100%;
  }
  
  .old-file, .new-file {
    flex: 1;
    padding: 0 10px;
  }
  
  .old-file h3, .new-file h3 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: var(--text);
  }
  
  .file-path {
    margin: 0;
    font-size: 12px;
    color: var(--text);
    opacity: 0.7;
    word-break: break-all;
  }
  
  /* Side-by-side diff styles */
  .side-by-side-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    border-top: 1px solid var(--border-color);
    max-height: calc(100vh - 200px); /* Ensure content area has a maximum height */
  }
  
  .diff-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto; /* Single scrollbar for the entire diff view */
    max-height: calc(100vh - 250px); /* Ensure scrollbar appears when content exceeds viewport */
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: var(--border) var(--background); /* For Firefox */
  }
  
  /* Webkit scrollbar styles for diff content */
  .diff-wrapper::-webkit-scrollbar {
    width: 10px;
    height: 10px; /* For horizontal scrollbar */
  }
  
  .diff-wrapper::-webkit-scrollbar-track {
    background: var(--background);
  }
  
  .diff-wrapper::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 4px;
    border: 2px solid var(--background);
  }
  
  /* Word-level diff specific styles */
  /* We're now using the same row-based structure for both line and word diffs */
  
  /* Headers for the diff columns */
  .diff-headers {
    display: grid;
    grid-template-columns: 40px 1fr 40px 1fr;
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--secondary);
    border-bottom: 1px solid var(--border);
  }
  
  .column-header {
    padding: 8px 10px;
    background-color: var(--secondary);
    border-bottom: 1px solid var(--border);
    grid-column: span 2;
  }
  
  .column-header.full-width {
    grid-column: 1 / -1;
    width: 100%;
  }
  
  .column-header h4 {
    margin: 0;
    font-size: 14px;
    color: var(--text);
  }
  
  /* Diff content with synchronized rows */
  .diff-content {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .diff-row {
    display: grid;
    grid-template-columns: 40px 1fr 40px 1fr;
    border-bottom: 1px solid var(--border);
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Ensure both sides of the diff have the same row height */
  .diff-row::before {
    content: '';
    grid-column: 1 / -1;
    grid-row: 1;
    z-index: -1;
  }
  
  /* Word-level diff styles */
  :global(.word-added) {
    background-color: var(--addedWordBackground, rgba(0, 255, 0, 0.2));
    color: var(--addedWordText, inherit);
    border-radius: 2px;
    padding: 0 1px;
  }
  
  :global(.word-removed) {
    background-color: var(--removedWordBackground, rgba(255, 0, 0, 0.2));
    color: var(--removedWordText, inherit);
    border-radius: 2px;
    padding: 0 1px;
    text-decoration: line-through;
  }
  
  /* Line-level highlighting for word diff mode */
  .line-added {
    color: var(--text);
  }
  
  .line-removed {
    color: var(--text);
    text-decoration: line-through;
  }
  
  /* Ensure consistent line number styling in word diff mode */
  .diff-row .line-number {
    min-width: 40px;
    text-align: right;
    font-family: monospace;
    user-select: none;
  }
  
  /* Single column view styles */
  .single-column-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-y: auto; /* Enable vertical scrolling */
    max-height: calc(100vh - 250px); /* Ensure scrollbar appears when content exceeds viewport */
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: var(--border) var(--background); /* For Firefox */
  }
  
  /* Webkit scrollbar styles for single column content */
  .single-column-content::-webkit-scrollbar {
    width: 10px;
  }
  
  .single-column-content::-webkit-scrollbar-track {
    background: var(--background);
  }
  
  .single-column-content::-webkit-scrollbar-thumb {
    background-color: var(--border);
    border-radius: 4px;
    border: 2px solid var(--background);
  }
  
  .single-line-row {
    display: grid;
    grid-template-columns: 40px 1fr;
    border-bottom: 1px solid var(--border);
    width: 100%;
  }
  
  /* Style for empty lines (placeholders for alignment) */
  .empty {
    background-color: var(--background);
  }
  
  .line-number {
    padding: 0 8px;
    text-align: right;
    color: var(--text);
    opacity: 0.6;
    background-color: var(--secondary);
    border-right: 1px solid var(--border);
    border-left: 3px solid var(--border);
    user-select: none;
    align-self: stretch; /* Ensure line number fills the entire height of the row */
    position: relative;
    font-size: 0.9em; /* Make line numbers slightly smaller than content */
    font-family: monospace; /* Use the same font family as content */
  }
  
  /* Line number border colors for different types */
  .line-number.added {
    border-left-color: var(--added-text);
  }
  
  .line-number.removed {
    border-left-color: var(--removed-text);
  }
  
  .line-number.unchanged {
    border-left-color: var(--border);
  }
  
  .line-text {
    padding: 0 8px;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
    font-family: monospace;
    min-height: 1.5em; /* Minimum height for content */
  }
  
  /* Line highlighting - only highlight line numbers */
  .line-number.added {
    background-color: var(--added);
    color: var(--added-text);
    opacity: 1;
    font-weight: 500; /* Slightly reduce font weight */
    border-left-width: 4px;
  }
  
  .line-number.removed {
    background-color: var(--removed);
    color: var(--removed-text);
    opacity: 1;
    font-weight: 500; /* Slightly reduce font weight */
    border-left-width: 4px;
  }
  
  .line-number.unchanged {
    background-color: var(--secondary);
    border-left-width: 3px;
  }
  
  /* Styling for placeholder line numbers */
  .line-number.placeholder-number {
    background-color: var(--secondary);
    opacity: 0.3;
    border-left-width: 1px;
  }
  
  /* Text content styling - no background highlighting */
  .left-text.added,
  .right-text.added {
    background-color: var(--background);
    color: var(--text);
  }
  
  .left-text.removed,
  .right-text.removed {
    background-color: var(--background);
    color: var(--text);
  }
  
  .left-text.unchanged,
  .right-text.unchanged {
    background-color: var(--background);
    color: var(--text);
  }
  
  .empty {
    background-color: transparent;
  }
  
  /* Word-level diff styles */
  :global(.word-added) {
    background-color: var(--addedWordBackground, rgba(0, 255, 0, 0.2));
    color: var(--addedWordText, inherit);
    border-radius: 2px;
    padding: 0 1px;
  }
  
  :global(.word-removed) {
    background-color: var(--removedWordBackground, rgba(255, 0, 0, 0.2));
    color: var(--removedWordText, inherit);
    border-radius: 2px;
    padding: 0 1px;
    text-decoration: line-through;
  }
  
  /* Keyword highlighting styles */
  :global(.keyword-highlight) {
    display: inline;
    padding: 0 2px;
    border: 1px dotted;
    border-radius: 2px;
    position: relative;
    z-index: 1;
    font-weight: 500;
  }
  
  /* Category-specific styles using data attributes */
  :global(.keyword-highlight[data-category="red"]) {
    border-color: #ff3333;
    background-color: rgba(255, 51, 51, 0.08);
  }

  :global(.keyword-highlight[data-category="blue"]) {
    border-color: #0066cc;
    background-color: rgba(0, 102, 204, 0.08);
  }

  :global(.keyword-highlight[data-category="orange"]) {
    border-color: #ff6600;
    background-color: rgba(255, 102, 0, 0.08);
  }

  :global(.keyword-highlight[data-category="green"]) {
    border-color: #009933;
    background-color: rgba(0, 153, 51, 0.08);
  }

  :global(.keyword-highlight[data-category="purple"]) {
    border-color: #9900cc;
    background-color: rgba(153, 0, 204, 0.08);
  }
  
  .left-number.empty,
  .right-number.empty {
    background-color: var(--secondary);
    color: var(--text);
    opacity: 0.3;
  }
  
  .left-text.empty,
  .right-text.empty {
    color: transparent;
  }
</style>
