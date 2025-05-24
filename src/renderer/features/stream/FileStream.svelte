<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { formatFileSize, formatDate } from '../../utils/formatUtils';
  
  const dispatch = createEventDispatcher();
  
  // Props
  export let files = [];
  export let keywordCategories = [];
  export let toggleState = 0; // 0 = Off, 1 = On, 2 = Only Keywords
  export let activeCategories = [];
  
  // Derived values
  $: highlightingEnabled = toggleState > 0;
  $: onlyKeywords = toggleState === 2;
  
  // State
  let processedFiles = [];
  let keywordElements = [];
  
  // Tooltip state
  let activeTooltip = null;
  let tooltipPosition = { top: 0, left: 0 };
  
  // Initialize keyword elements for tooltips
  function initKeywordNavigation() {
    // Reset state
    keywordElements = [];
    
    // Wait for DOM to update
    setTimeout(() => {
      // Get all keyword elements
      keywordElements = Array.from(document.querySelectorAll('.keyword-highlight'));
      
      // Set tooltip positions based on keyword position in viewport
      positionTooltips();
    }, 100);
  }
  
  // Position tooltips based on their position in the viewport
  function positionTooltips() {
    const headerHeight = 150; // Approximate height of document header
    
    // Ensure we have keyword elements to work with
    if (!keywordElements || keywordElements.length === 0) {
      // Re-query for keywords if our array is empty
      keywordElements = Array.from(document.querySelectorAll('.keyword-highlight'));
      if (keywordElements.length === 0) return;
    }
    
    keywordElements.forEach(keyword => {
      // Make sure the element still exists in the DOM
      if (document.body.contains(keyword)) {
        const rect = keyword.getBoundingClientRect();
        
        // If keyword is near the top of the viewport, show tooltip below
        if (rect.top < headerHeight) {
          keyword.setAttribute('data-tooltip-position', 'bottom');
        } else {
          // Otherwise show tooltip above (default)
          keyword.removeAttribute('data-tooltip-position');
        }
      }
    });
  }
  
  // Show tooltip for a keyword element
  function showTooltip(event) {
    // Find the keyword element (might be the target or a parent)
    let target = event.target;
    while (target && !target.classList?.contains('keyword-highlight')) {
      target = target.parentElement;
    }
    
    // If we found a keyword element with a tooltip
    if (target && target.classList.contains('keyword-highlight') && target.hasAttribute('data-tooltip')) {
      const tooltip = target.getAttribute('data-tooltip');
      const rect = target.getBoundingClientRect();
      
      // Calculate position - check if near top of viewport
      const headerHeight = 150; // Approximate header height
      let top, left;
      
      // Position tooltip below element if near top of screen, otherwise above
      if (rect.top < headerHeight) {
        top = rect.bottom + 10; // 10px below the element
      } else {
        top = rect.top - 40; // 40px above the element (includes tooltip height)
      }
      
      // Center horizontally
      left = rect.left + (rect.width / 2);
      
      // Update tooltip state
      activeTooltip = tooltip;
      tooltipPosition = { top, left };
    }
  }
  
  // Hide the tooltip
  function hideTooltip() {
    activeTooltip = null;
  }
  
  // Keyword click handling removed as requested
  
  // Watch for changes that require re-initializing navigation
  $: if (highlightingEnabled && processedFiles.length > 0) {
    initKeywordNavigation();
  }
  
  // Create a reference to the throttled function so we can remove it later
  let throttledPositionTooltips;
  
  // Throttle function to limit how often a function runs
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // Set up event listeners for tooltips
  onMount(() => {
    const fileStreamContainer = document.querySelector('.file-stream');
    if (fileStreamContainer) {
      // Add mouseover and mouseout event listeners for tooltips
      fileStreamContainer.addEventListener('mouseover', handleMouseOver);
      fileStreamContainer.addEventListener('mouseout', handleMouseOut);
    }
    
    // Initial positioning after component is mounted
    setTimeout(positionTooltips, 200);
  });
  
  // Handle mouseover events for tooltips
  function handleMouseOver(event) {
    // Check if we're hovering over a keyword
    if (event.target.classList?.contains('keyword-highlight') || 
        event.target.closest('.keyword-highlight')) {
      showTooltip(event);
    }
  }
  
  // Handle mouseout events for tooltips
  function handleMouseOut(event) {
    // Only hide the tooltip if we're leaving a keyword
    // and not entering another keyword or the tooltip itself
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || 
        (!relatedTarget.classList?.contains('keyword-highlight') && 
         !relatedTarget.closest('.keyword-highlight') && 
         !relatedTarget.classList?.contains('active-tooltip'))) {
      hideTooltip();
    }
  }
  
  // Clean up event listeners when component is destroyed
  onDestroy(() => {
    // Clean up all event listeners
    const fileStreamContainer = document.querySelector('.file-stream');
    if (fileStreamContainer) {
      fileStreamContainer.removeEventListener('mouseover', handleMouseOver);
      fileStreamContainer.removeEventListener('mouseout', handleMouseOut);
    }
  });
  
  // Process files when props change
  $: {
    processedFiles = files.map(file => {
      // Process content for highlighting if needed
      let processedContent = file.content;
      
      if (highlightingEnabled && keywordCategories.length > 0) {
        processedContent = highlightKeywords(processedContent);
      }
      
      return {
        ...file,
        processedContent,
        formattedSize: formatFileSize(file.size),
        formattedDate: formatDate(new Date(file.modifiedTime))
      };
    });
    
    // If there are active keyword filters, filter files that have matches
    if (activeCategories && activeCategories.length > 0) {
      processedFiles = processedFiles.filter(file => {
        // Check if the file contains any of the active categories
        return activeCategories.some(category => 
          file.processedContent.includes(`data-category="${category}"`)
        );
      });
    }
    
    // If "Only Keywords" mode is enabled, only show files that contain keywords
    if (onlyKeywords) {
      processedFiles = processedFiles.filter(file => {
        // Check if the file contains any keyword highlights
        return file.processedContent.includes('class="keyword-highlight"');
      });
    }
  }
  
  // Apply keyword highlighting to text
  function highlightKeywords(text) {
    if (!highlightingEnabled || !keywordCategories || keywordCategories.length === 0) {
      return text;
    }
    
    // Split the text into lines to preserve formatting
    const lines = text.split('\n');
    const highlightedLines = [];
    const linesWithKeywords = new Set(); // Track which lines have keywords
    
    // Process each line separately
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let lineHasKeyword = false;
      
      // Instead of sequentially processing and replacing, we'll:  
      // 1. Find all keyword matches in the line first
      // 2. Sort them by position to prevent overlap issues
      // 3. Apply all replacements at once
      
      const matches = [];
      
      // Find all keyword matches in the line
      keywordCategories.forEach(category => {
        category.keywords.forEach(keyword => {
          // Create a regex that matches whole words only
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          let match;
          
          // Find all matches of this keyword in the line
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              startIndex: match.index,
              endIndex: regex.lastIndex,
              originalText: match[0],
              category: category.name,
              keyword: keyword
            });
            lineHasKeyword = true;
          }
        });
      });
      
      // If no keywords found in this line, just use the original line
      if (matches.length === 0) {
        highlightedLines.push(line);
        continue;
      }
      
      // Sort matches by start position (to handle them in order)
      matches.sort((a, b) => a.startIndex - b.startIndex);
      
      // Filter out overlapping matches (keep only the first match in any overlapping group)
      const filteredMatches = [];
      for (let j = 0; j < matches.length; j++) {
        const current = matches[j];
        // Check if this match overlaps with any previous matches we're keeping
        const overlaps = filteredMatches.some(existing => 
          (current.startIndex < existing.endIndex && current.endIndex > existing.startIndex));
        
        if (!overlaps) {
          filteredMatches.push(current);
        }
      }
      
      // Apply all non-overlapping replacements at once
      let processedLine = '';
      let lastIndex = 0;
      
      filteredMatches.forEach(match => {
        // Add text before this match
        processedLine += line.substring(lastIndex, match.startIndex);
        
        // Add the highlighted match
        const keywordId = `${match.category}-${match.keyword}-${i}`;
        processedLine += `<span class="keyword-highlight" data-category="${match.category}" data-tooltip="${match.category} keyword" data-keyword-id="${keywordId}">${match.originalText}</span>`;
        
        // Update lastIndex for next segment
        lastIndex = match.endIndex;
      });
      
      // Add any remaining text after the last match
      processedLine += line.substring(lastIndex);
      
      // Track lines that have keywords
      
      // If the line has a keyword, add it to our tracking set
      if (lineHasKeyword) {
        linesWithKeywords.add(i);
      }
      
      highlightedLines.push(processedLine);
    }
    
    // If we're in "Only Keywords" mode, filter to only show lines with keywords
    // and more context (3 lines before and after for better readability)
    if (onlyKeywords) {
      const filteredLines = [];
      let previousLineWasBlank = false;
      const contextLines = 3; // Increased from 1 to 3 for better context
      
      for (let i = 0; i < highlightedLines.length; i++) {
        // Check if this line or lines within the context range have keywords
        let hasNearbyKeyword = false;
        
        // Check the current line and context range before and after
        for (let j = Math.max(0, i - contextLines); j <= Math.min(highlightedLines.length - 1, i + contextLines); j++) {
          if (linesWithKeywords.has(j)) {
            hasNearbyKeyword = true;
            break;
          }
        }
        
        // Include lines with keywords and their expanded context
        if (hasNearbyKeyword) {
          // If we previously added a blank line separator and now we're showing content again,
          // add a visual separator
          if (previousLineWasBlank && filteredLines.length > 0) {
            filteredLines.push('<span class="keyword-context-separator">...</span>');
          }
          
          // Add a line number prefix to help with context
          const lineNumber = i + 1;
          const lineWithNumber = `<span class="line-number">${lineNumber}:</span> ${highlightedLines[i]}`;
          filteredLines.push(lineWithNumber);
          previousLineWasBlank = false;
        } else {
          // If we haven't just added a blank line, add one now
          if (!previousLineWasBlank) {
            previousLineWasBlank = true;
          }
        }
      }
      
      return filteredLines.join('\n');
    }
    
    // Join the lines back together with line breaks
    return highlightedLines.join('\n');
  }
</script>

<div class="file-stream">
  <!-- Fixed tooltip container that stays above everything -->
  <div class="tooltip-container">
    {#if activeTooltip}
      <div 
        class="active-tooltip" 
        style="top: {tooltipPosition.top}px; left: {tooltipPosition.left}px;"
      >
        {activeTooltip}
      </div>
    {/if}
  </div>
  
  <!-- Navigation UI removed as requested -->
  
  {#if processedFiles.length === 0}
    <div class="no-files">
      {#if activeCategories && activeCategories.length > 0}
        <p>No files contain matches for the selected keyword categories.</p>
        <button class="clear-filter" on:click={() => dispatch('clearCategories')}>
          Clear Filter
        </button>
      {:else}
        <p>No files to display</p>
      {/if}
    </div>
  {:else}
    {#each [...processedFiles].reverse() as file, index}
      <div class="file-container" id={`file-${index}`}>
        <div class="file-header">
          <div class="file-title">
            <h2>{file.title}</h2>
            <span class="file-path">{file.path}</span>
          </div>
          <div class="file-meta">
            <span class="file-size">{file.formattedSize}</span>
            <span class="file-date">{file.formattedDate}</span>
          </div>
        </div>
        <div class="file-content">
          {#if file.error}
            <div class="file-error">
              <p>Error: {file.error}</p>
            </div>
          {:else if highlightingEnabled && keywordCategories.length > 0}
            <pre>{@html file.processedContent}</pre>
          {:else}
            <pre>{file.content}</pre>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .file-stream {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px;
  }
  
  .file-container {
    display: flex;
    flex-direction: column;
    background-color: var(--secondary, var(--modalBackground, #2d2d2d));
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--shadow, rgba(0, 0, 0, 0.2));
    overflow: hidden;
    transition: box-shadow 0.3s ease;
    color: var(--text, #e0e0e0);
    border: 1px solid var(--border, #3a3a3a);
  }
  
  .file-container:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    background-color: var(--headerBackground, var(--modalHeaderBackground, #252525));
    border-bottom: 1px solid var(--border, #3a3a3a);
  }
  
  .file-title {
    flex: 1;
  }
  
  .file-title h2 {
    margin: 0 0 4px 0;
    font-size: 1.2rem;
    color: var(--headerText, var(--modalHeaderText, #e0e0e0));
    font-weight: 600;
  }
  
  .file-path {
    display: block;
    font-size: 0.8rem;
    color: var(--textSecondary, #b0b0b0);
    font-family: monospace;
    word-break: break-all;
  }
  
  .file-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--textSecondary, #b0b0b0);
  }
  
  .file-content {
    padding: 16px;
    overflow-x: auto;
    background-color: var(--background, #1e1e1e);
    color: var(--text, #e0e0e0);
    line-height: 1.5;
    white-space: pre-wrap;
    border-top: 1px solid var(--border, #3a3a3a);
  }
  
  .file-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 0.9rem;
    color: inherit;
    background: transparent;
  }
  
  .file-error {
    color: var(--errorText, var(--removedText, #f97583));
    padding: 8px;
    background-color: var(--errorLight, var(--removed, #3b1d26));
    border-radius: 4px;
    border: 1px solid var(--error, #dc3545);
  }
  
  .no-files {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    color: var(--textSecondary, #b0b0b0);
    background-color: var(--secondary, #2d2d2d);
    border-radius: 8px;
    border: 1px solid var(--border, #3a3a3a);
    margin: 16px;
  }
  
  .clear-filter {
    margin-top: 16px;
    padding: 8px 16px;
    background-color: var(--buttonBackground, var(--primary, #4a90e2));
    color: var(--buttonText, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }
  
  .clear-filter:hover {
    background-color: var(--buttonHover, var(--primaryHover, #3a80d2));
  }
  
  /* Keyword highlighting styles - simplified to avoid visual artifacts */
  :global(.keyword-highlight) {
    background-color: rgba(74, 144, 226, 0.3);
    border-radius: 2px;
    padding: 0 2px;
    margin: 0;
    font-weight: 600;
    display: inline; /* Force inline display */
    white-space: pre; /* Preserve whitespace but stay inline */
    transition: background-color 0.2s ease;
    /* Remove border and box-shadow causing connection lines */
  }
  
  :global(.keyword-highlight:hover) {
    background-color: rgba(74, 144, 226, 0.5);
    cursor: pointer;
    /* Remove any effects that could cause visual artifacts */
  }
  
  :global(.keyword-active) {
    background-color: rgba(74, 144, 226, 0.6) !important;
    /* Remove box-shadow and border-bottom causing connection lines */
  }
  
  /* Completely new tooltip approach using a fixed tooltip container */
  :global(.keyword-highlight[data-tooltip]) {
    position: relative;
    cursor: pointer;
  }
  
  /* Create a global tooltip container that's fixed to the viewport */
  .tooltip-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    pointer-events: none;
    z-index: 9999;
  }
  
  /* Style for the actual tooltip */
  .active-tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 9999;
    max-width: 250px;
    text-align: center;
    transform: translateX(-50%); /* Center horizontally */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: tooltipFadeIn 0.2s ease-out;
  }
  
  @keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(5px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  
  /* Remove duplicate hover effect that was causing conflicts */
  /* The primary hover effect is defined above */
  
  :global(.keyword-context-separator) {
    display: block;
    text-align: center;
    color: var(--textTertiary, #909090);
    font-style: italic;
    padding: 4px 0;
    margin: 4px 0;
    border-top: 1px dashed var(--border, #3a3a3a);
    border-bottom: 1px dashed var(--border, #3a3a3a);
  }
  
  :global(.line-number) {
    display: inline-block;
    min-width: 40px;
    color: var(--textSecondary, #b0b0b0);
    user-select: none;
    font-size: 0.85em;
    opacity: 0.7;
  }
  
  /* Category-specific styling - simplified to avoid visual artifacts */
  :global(.keyword-highlight[data-category="Agreement Terms"]) {
    background-color: rgba(255, 85, 85, 0.2);
    /* Remove border and box-shadow causing connection lines */
  }
  
  :global(.keyword-highlight[data-category="Technical Content"]) {
    background-color: rgba(98, 114, 164, 0.2);
    /* Remove border and box-shadow causing connection lines */
  }
  
  :global(.keyword-highlight[data-category="Service Metrics"]) {
    background-color: rgba(255, 184, 108, 0.2);
    /* Remove border and box-shadow causing connection lines */
  }
  
  :global(.keyword-highlight[data-category="Data Privacy"]) {
    background-color: rgba(80, 250, 123, 0.2);
    /* Remove border and box-shadow causing connection lines */
  }
  
  :global(.keyword-highlight[data-category="Document Metadata"]) {
    background-color: rgba(189, 147, 249, 0.2);
    /* Remove border and box-shadow causing connection lines */
  }
  
  /* Ensure we have a LoadingSpinner component for the loading state */
  :global(.loading-spinner) {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary, #4a90e2);
    animation: spin 1s ease-in-out infinite;
  }
  
  /* Navigation UI styles removed as requested */
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
