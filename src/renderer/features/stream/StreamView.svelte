<script>
  import { onMount, onDestroy } from 'svelte';
  import FileStream from './FileStream.svelte';
  import KeywordToggle from '../../components/KeywordToggle.svelte';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { writable } from 'svelte/store';
  import { getFileIcon } from '../../utils/fileIcons.js'; // Ensure correct import with .js extension
  import { formatTimeAgo } from '../../utils/formatUtils.js';
  
  // Props
  export let directoryPath = '';
  export let keywordCategories = [];
  
  // Detect if running in a web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  
  // State
  let files = [];
  let isLoading = true;
  let error = null;
  let activeKeywordFilter = null;
  let toggleState = 0; // 0 = Off, 1 = On, 2 = Only Keywords
  let activeCategories = [];
  let isWatching = false;
  let pollingInterval = null;
  let lastEtag = null;
  let lastCheckTime = null;
  let pollingFrequency = 5000; // 5 seconds by default
  let isPollingPaused = false;
  let watchStatus = { active: false, message: '' };
  
  // Create a store for file updates
  const fileUpdateStore = writable({ type: null, path: null });
  
  // Subscribe to file updates
  const unsubscribe = fileUpdateStore.subscribe(update => {
    if (update.type && update.path && directoryPath) {
      console.log(`File update detected: ${update.type} - ${update.path}`);
      // Reload files when changes are detected
      loadFiles(directoryPath, false);
    }
  });
  
  // For browser environment, provide sample keyword categories and set up polling
  onMount(() => {
    if (isWebBrowser && keywordCategories.length === 0) {
      keywordCategories = [
        {
          name: 'Agreement Terms',
          keywords: ['approval', 'workflow', 'documented', 'recorded', 'maintained']
        },
        {
          name: 'Technical Content',
          keywords: ['API', 'endpoints', 'parameters', 'GET', 'POST', 'PUT']
        },
        {
          name: 'Service Metrics',
          keywords: ['performance', 'response time', 'availability', 'uptime', 'throughput']
        },
        {
          name: 'Data Privacy',
          keywords: ['metadata', 'records', 'timestamp']
        },
        {
          name: 'Document Metadata',
          keywords: ['classification', 'version', 'control', 'standards', 'document']
        }
      ];
    }
  });
  
  // Load files on mount or when directoryPath changes
  $: if (directoryPath) {
    loadFiles(directoryPath, true);
    setupDirectoryWatcher();
  }
  
  // Set up directory watcher (different implementations for Electron and Browser)
  async function setupDirectoryWatcher() {
    // Stop any existing watchers first
    await stopDirectoryWatcher();
    
    // Skip if no directory
    if (!directoryPath) return;
    
    if (isWebBrowser) {
      // In browser environment, use polling mechanism
      startBrowserPolling();
    } else {
      // In Electron, use native file watching
      try {
        // Make sure electronAPI is available
        if (!window.electronAPI) {
          console.error('electronAPI not available for directory watching');
          return;
        }
        
        // Start watching the directory
        const result = await window.electronAPI.watchStreamDirectory(directoryPath);
        
        if (result.success) {
          isWatching = true;
          watchStatus = { active: true, message: 'Watching for changes via Electron API' };
          console.log(`Started watching directory: ${directoryPath}`);
          
          // Set up listener for file changes
          window.electronAPI.onStreamFileChange((event, data) => {
            console.log('Stream file change detected:', data);
            fileUpdateStore.set(data);
          });
        } else {
          console.error('Failed to watch directory:', result.error);
          watchStatus = { active: false, message: `Error: ${result.error}` };
        }
      } catch (err) {
        console.error('Error setting up directory watcher:', err);
        watchStatus = { active: false, message: `Error: ${err.message}` };
      }
    }
  }
  
  // Start browser polling for file changes
  function startBrowserPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Reset state
    lastEtag = null;
    lastCheckTime = new Date();
    isWatching = true;
    watchStatus = { 
      active: true, 
      message: `Polling: ${pollingFrequency/1000}s interval` 
    };
    
    console.log(`Started browser polling for directory: ${directoryPath}`);
    
    // Immediately check once
    checkForChanges();
    
    // Set up interval for polling
    pollingInterval = setInterval(() => {
      if (!isPollingPaused) {
        checkForChanges();
      }
    }, pollingFrequency);
  }
  
  // Stop directory watcher
  async function stopDirectoryWatcher() {
    // Clear polling interval if it exists
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    
    // Clear Electron watcher if active
    if (!isWebBrowser && isWatching && window.electronAPI) {
      try {
        const result = await window.electronAPI.stopWatchingStreamDirectory();
        console.log('Stopped watching stream directory:', result);
      } catch (err) {
        console.error('Error stopping directory watcher:', err);
      }
    }
    
    isWatching = false;
    watchStatus = { active: false, message: 'File watching inactive' };
  }
  
  // Check for changes in the directory (browser polling)
  async function checkForChanges() {
    if (!directoryPath || !isWebBrowser) return;
    
    try {
      // Prepare headers with ETag if we have one
      const headers = {};
      if (lastEtag) {
        headers['If-None-Match'] = lastEtag;
      }
      
      // Update last check time
      lastCheckTime = new Date();
      
      // Make the request to the watch-directory endpoint
      const response = await fetch(`/api/watch-directory?directoryPath=${encodeURIComponent(directoryPath)}`, {
        headers
      });
      
      // If response is 304 Not Modified, there are no changes
      if (response.status === 304) {
        return;
      }
      
      // Handle other non-200 responses
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error checking for changes:', errorData.error || response.statusText);
        return;
      }
      
      // Get the new ETag
      const newEtag = response.headers.get('etag');
      if (newEtag) {
        lastEtag = newEtag;
      }
      
      // Process the response
      const data = await response.json();
      
      if (data.success) {
        // If there are changes, update the file list
        if (data.hasChanges && data.changes && data.changes.length > 0) {
          console.log(`Detected ${data.changes.length} file changes:`, data.changes);
          
          // Show a notification about the changes
          showChangeNotification(data.changes);
          
          // Reload the files
          loadFiles(directoryPath, false);
        }
      } else {
        console.error('Error in watch-directory response:', data.error);
      }
    } catch (err) {
      console.error('Exception checking for changes:', err);
    }
  }
  
  // Display a notification about file changes
  function showChangeNotification(changes) {
    if (!changes || changes.length === 0) return;
    
    // Count changes by type
    const newFiles = changes.filter(c => !c.deleted && !('prevFile' in c)).length;
    const modifiedFiles = changes.filter(c => !c.deleted && ('prevFile' in c)).length;
    const deletedFiles = changes.filter(c => c.deleted).length;
    
    // Create notification message
    let message = 'Changes detected: ';
    if (newFiles > 0) message += `${newFiles} new, `;
    if (modifiedFiles > 0) message += `${modifiedFiles} modified, `;
    if (deletedFiles > 0) message += `${deletedFiles} deleted, `;
    message = message.replace(/, $/, ''); // Remove trailing comma
    
    // Update watch status to show the change notification
    watchStatus = { 
      active: true, 
      message: message,
      lastUpdate: new Date()
    };
    
    // Reset status message after a few seconds
    setTimeout(() => {
      if (isWatching) {
        watchStatus = { 
          active: true, 
          message: `Polling: ${pollingFrequency/1000}s interval`,
          lastUpdate: watchStatus.lastUpdate
        };
      }
    }, 5000);
  }
  
  // Toggle polling pause state
  function togglePollingPause() {
    if (!isWebBrowser || !isWatching) return;
    
    isPollingPaused = !isPollingPaused;
    
    if (isPollingPaused) {
      watchStatus = { active: false, message: 'Polling paused' };
    } else {
      watchStatus = { 
        active: true, 
        message: `Polling resumed (${pollingFrequency/1000}s)` 
      };
      // Immediately check for changes
      checkForChanges();
    }
  }
  
  // Force immediate check for changes
  function forceCheckForChanges() {
    if (!isWebBrowser || !directoryPath) return;
    
    // If polling is paused, resume it
    if (isPollingPaused) {
      isPollingPaused = false;
      watchStatus = { 
        active: true, 
        message: `Polling resumed (${pollingFrequency/1000}s)` 
      };
    }
    
    // Immediately check for changes
    checkForChanges();
  }
  
  // Load files from the directory
  async function loadFiles(dirPath, showLoading = true) {
    if (!dirPath) return;
    
    isLoading = showLoading; // Only show loading indicator on initial load
    error = null;
    
    try {
      if (isWebBrowser) {
        // In web browser, fetch files from the API endpoint
        // Step 1: Get list of files from API
        const response = await fetch(`/api/stream-files?directoryPath=${encodeURIComponent(dirPath)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.files) {
          try {
            // Step 2: Create basic file objects with icons
            const filesList = data.files.map(file => ({ 
              ...file, 
              icon: getFileIcon(file.name),
              title: file.name // Make sure title is set for display
            }));
            
            // Step 3: Fetch content for non-directory files
            // This approach fetches contents in parallel for better performance
            const filePromises = filesList.filter(file => !file.isDirectory).map(async file => {
              try {
                // Fetch file content using the new API endpoint
                const contentResponse = await fetch(`/api/stream-file-content?filePath=${encodeURIComponent(file.path)}`);
                if (!contentResponse.ok) {
                  return { ...file, error: `Failed to load content: ${contentResponse.statusText}`, content: '' };
                }
                const contentData = await contentResponse.json();
                if (contentData.success) {
                  return { 
                    ...file, 
                    content: contentData.content,
                    size: contentData.size,
                    modified: contentData.modified,
                    modifiedTime: contentData.modified
                  };
                } else {
                  return { ...file, error: contentData.error || 'Unknown error loading content', content: '' };
                }
              } catch (err) {
                console.error(`Error loading content for ${file.name}:`, err);
                return { ...file, error: err.message, content: '' };
              }
            });
            
            // Wait for all content fetch operations to complete
            const filesWithContent = await Promise.all(filePromises);
            
            // Sort files by modification time (newest first) to match Electron app behavior
            filesWithContent.sort((a, b) => new Date(b.modified || b.modifiedTime) - new Date(a.modified || a.modifiedTime));
            
            files = filesWithContent;
          } catch (iconError) {
            console.warn('Error applying file icons:', iconError);
            // Fallback if getFileIcon fails
            files = data.files.map(file => ({ ...file, icon: 'file' }));
          }
        } else {
          throw new Error(data.error || 'Failed to load files from server.');
        }
      } else {
        // In Electron app, use the IPC API
        const result = await window.electronAPI.getStreamFiles(dirPath);
        
        if (result.success) {
          files = result.files;
          console.log(`Loaded ${files.length} files for stream view`);
        } else {
          error = result.error || 'Failed to load files';
          console.error('Error loading files:', error);
        }
      }
    } catch (err) {
      error = err.message || 'An unexpected error occurred';
      console.error('Exception loading files:', err);
    } finally {
      isLoading = false;
    }
  }
  
  // Handle keyword toggle state change
  function handleToggleChange(event) {
    toggleState = event.detail.toggleState;
  }
  
  // Handle keyword filter change
  function handleKeywordFilterChange(event) {
    const category = event.detail;
    
    // Toggle the category - if it's already active, remove it; otherwise add it
    if (activeCategories.includes(category)) {
      activeCategories = activeCategories.filter(c => c !== category);
    } else if (category) {
      activeCategories = [...activeCategories, category];
    }
  }
  
  // Clear all active categories
  function clearCategories() {
    activeCategories = [];
  }
  
  // Clean up on component destruction
  onDestroy(() => {
    // Unsubscribe from the file update store
    if (unsubscribe) {
      unsubscribe();
    }
    
    // Stop all watchers and polling
    stopDirectoryWatcher();
  });
</script>

<div class="stream-view">
  {#if isLoading}
    <div class="loading-container">
      <LoadingSpinner size="large" />
      <p>Loading files...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <h2>Error Loading Files</h2>
      <p>{error}</p>
      <button class="retry-button" on:click={() => loadFiles(directoryPath)}>
        Try Again
      </button>
    </div>
  {:else if files.length === 0}
    <div class="empty-container">
      <h2>No Files Found</h2>
      <p>The selected directory does not contain any files to display.</p>
    </div>
  {:else}
    <div class="stream-controls">
      <div class="keyword-controls">
        {#if keywordCategories.length > 0}
          <KeywordToggle 
            {keywordCategories}
            {toggleState}
            {activeCategories}
            on:toggle={handleToggleChange}
            on:keywordFilterChange={handleKeywordFilterChange}
          />
        {/if}
      </div>
      <div class="status-controls">
        {#if isWebBrowser}
          <div class="watch-status" class:active={watchStatus.active} class:paused={isPollingPaused}>
            <span class="status-dot"></span>
            <span class="status-text">{watchStatus.message}</span>
            {#if lastCheckTime}
              <span class="status-time">Last check: {formatTimeAgo(lastCheckTime)}</span>
            {/if}
          </div>
          <div class="watch-controls">
            <button 
              class="watch-button" 
              on:click={togglePollingPause} 
              title={isPollingPaused ? 'Resume polling' : 'Pause polling'}
            >
              {isPollingPaused ? '▶' : '⏸'}
            </button>
            <button 
              class="watch-button refresh" 
              on:click={forceCheckForChanges} 
              title="Check for changes now"
            >
              ↻
            </button>
          </div>
        {/if}
        <div class="file-count">
          <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
    
    <div class="stream-content">
      <FileStream 
        {files}
        {keywordCategories}
        {toggleState}
        {activeCategories}
        on:clearCategories={clearCategories}
      />
    </div>
  {/if}
</div>

<style>
  .stream-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  
  .stream-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: var(--secondary, var(--headerBackground, #252525));
    border-bottom: 1px solid var(--border, #3a3a3a);
  }
  
  .keyword-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .status-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
  }
  
  .watch-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--textSecondary, #b0b0b0);
    background-color: rgba(0, 0, 0, 0.2);
    padding: 4px 10px;
    border-radius: 4px;
    min-width: 220px;
    max-width: 350px;
    overflow: hidden;
    white-space: nowrap;
  }
  
  .watch-status.active .status-dot {
    background-color: var(--success, #28a745);
  }
  
  .watch-status.paused .status-dot {
    background-color: var(--warning, #ffc107);
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--error, #dc3545);
    display: inline-block;
  }
  
  .status-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 4px;
  }
  
  .status-time {
    font-size: 0.75rem;
    opacity: 0.8;
    white-space: nowrap;
  }
  
  .watch-controls {
    display: flex;
    gap: 4px;
  }
  
  .watch-button {
    background-color: var(--buttonBackground, var(--primary, #4a90e2));
    color: var(--buttonText, white);
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    transition: background-color 0.2s ease;
  }
  
  .watch-button:hover {
    background-color: var(--buttonHover, var(--primaryHover, #3a80d2));
  }
  
  .watch-button.refresh {
    font-size: 14px;
  }
  
  .file-count {
    font-size: 0.9rem;
    color: var(--textSecondary, #b0b0b0);
    font-weight: 500;
    white-space: nowrap;
  }
  
  .stream-content {
    flex: 1;
    overflow: auto;
    padding: 0;
  }
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 2rem;
    background-color: var(--background, #1e1e1e);
    color: var(--text, #e0e0e0);
  }
  
  .error-container {
    color: var(--errorText, var(--removedText, #f97583));
  }
  
  .error-container h2 {
    color: var(--error, #dc3545);
    margin-bottom: 1rem;
  }
  
  .retry-button {
    margin-top: 1rem;
    padding: 8px 16px;
    background-color: var(--buttonBackground, var(--primary, #4a90e2));
    color: var(--buttonText, white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease, transform 0.1s ease;
  }
  
  .retry-button:hover {
    background-color: var(--buttonHover, var(--primaryHover, #3a80d2));
    transform: translateY(-1px);
  }
  
  .retry-button:active {
    transform: translateY(0);
  }
</style>
