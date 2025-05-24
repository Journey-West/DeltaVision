<script>
  import { onMount, onDestroy } from 'svelte';
  import DiffViewer from './components/DiffViewer.svelte';
  import SettingsModal from './SettingsModal.svelte';
  // ThemeModal import removed - now used in SettingsModal
  import StreamView from './features/stream/StreamView.svelte';
  import ThemeProvider from './components/ThemeProvider.svelte';
  import KeywordSummaryModal from './components/KeywordSummaryModal.svelte';
  import NetworkStatusButton from './components/NetworkStatusButton.svelte';
  import NotepadButton from './components/NotepadButton.svelte';
  import NotepadPanel from './components/NotepadPanel.svelte';
  import SearchView from './features/search/SearchView.svelte';
  import { theme } from './themes';
  import { searchStore } from './stores/searchStore';
  import PortInputDialog from './components/PortInputDialog.svelte'; // Import new dialog
  
  // Subscribe to the current theme
  let currentTheme;

  // State
  let showSettingsModal = false;
  let showKeywordSummaryModal = false;
  let oldFilesDir = '';
  let newFilesDir = '';
  let keywordsFilePath = '';
  // Network server state
  let networkServer = null;
  let networkUrl = '';
  let networkEnabled = false;
  // Notepad state
  let isNotepadOpen = false;
  let showPortInputDialog = false; // State for new dialog visibility
  let portForDialog = 3000; // State to hold current port for the dialog
  
  // Detect if running in a web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  let isLoadingNetworkState = false;
  let highlightingEnabled = false;
  let keywordCategories = [];
  let diffResults = [];
  let isComparing = false;
  let showDiffViewer = false;
  let showSearchView = false;
  let showStreamView = false;
  // Theme modal moved to settings
  let isWatchingDirectories = false;
  let unsubscribeFromDirectoryChanges = null;
  let activeKeywordFilter = null;
  
  // Determine if we're on the first page (no directories selected yet)
  $: isFirstPage = !oldFilesDir || !newFilesDir || (!showDiffViewer && !showSearchView);
  
  // Diff functionality is handled by the DiffViewer component

  // Log when component is initialized
  console.log('App component initialized');
  console.log('Checking if electronAPI is available:', !!window.electronAPI);
  
  // Function to fetch application state from the server when running in a web browser
  async function fetchAppStateFromServer() {
    if (!isWebBrowser) return;
    
    isLoadingNetworkState = true;
    try {
      const response = await fetch('/api/app-info');
      if (response.ok) {
        const data = await response.json();
        if (data.appState) {
          // Update local state with the state from the server
          oldFilesDir = data.appState.oldFilesDir || '';
          newFilesDir = data.appState.newFilesDir || '';
          keywordsFilePath = data.appState.keywordsFilePath || '';
          highlightingEnabled = data.appState.highlightingEnabled || false;
          
          // If directories are set, automatically load the comparison
          if (oldFilesDir && newFilesDir) {
            compareDirectories();
          }
          
          // If keywords file is set, automatically load it
          if (keywordsFilePath) {
            parseKeywordsFile(keywordsFilePath);
          }
          
          // Set the theme if provided
          if (data.appState.currentTheme) {
            try {
              // Try to use the theme from the desktop app or fall back to a simple dark/light theme
              if (theme && typeof theme.setTheme === 'function') {
                try {
                  // First try the desktop theme
                  theme.setTheme(data.appState.currentTheme);
                } catch (themeError) {
                  // If that fails, try a simple dark theme that should always exist
                  console.log('Falling back to a simple theme');
                  theme.setTheme('dark');
                }
              }
              // Fallback: if theme is a simple writable store
              else if (theme && typeof theme.set === 'function') {
                // Get the default theme from the registry
                const defaultTheme = theme.getDefaultTheme ? theme.getDefaultTheme() : 'dark';
                theme.set(defaultTheme);
              }
            } catch (error) {
              console.error('Error setting theme:', error);
              // Final fallback - set a simple theme value if all else fails
              if (theme && typeof theme.set === 'function') {
                theme.set('dark');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching app state from server:', error);
    } finally {
      isLoadingNetworkState = false;
    }
  }

  onMount(async () => {
    // Subscribe to theme changes
    const unsubscribeTheme = theme.subscribe(value => {
      currentTheme = value;
    });
    
    // If running in a web browser, fetch the application state from the server
    if (isWebBrowser) {
      fetchAppStateFromServer();
    } else {
      // Get network status for desktop app
      await refreshNetworkStatus();
      
      // Set up interval to periodically check network status (every 2 seconds)
      const networkStatusInterval = setInterval(refreshNetworkStatus, 2000);
      
      // Add to cleanup function
      return () => {
        if (unsubscribeTheme) unsubscribeTheme();
        clearInterval(networkStatusInterval);
        // Clean up IPC listener for port dialog if it was set up
        if (window.electronAPI && window.electronAPI.cleanupOpenPortInputDialogListener) {
          window.electronAPI.cleanupOpenPortInputDialogListener();
        }
      };
    }
    
    return () => {
      if (unsubscribeTheme) unsubscribeTheme();
    };
  });
  
  // Set up global keyboard shortcuts
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Version checking functionality removed
  
  // Open settings modal
  function openSettings() {
    // Refresh network status when opening settings
    refreshNetworkStatus();
    showSettingsModal = true;
  }
  
  // Handle settings modal close
  function handleCloseSettings() {
    showSettingsModal = false;
  }
  
  // Handle settings save
  function handleSaveSettings(event) {
    const { 
      oldFilesDir: newOldFilesDir, 
      newFilesDir: newNewFilesDir,
      keywordsFilePath: newKeywordsFilePath,
      highlightingEnabled: newHighlightingEnabled 
    } = event.detail;
    
    oldFilesDir = newOldFilesDir;
    newFilesDir = newNewFilesDir;
    keywordsFilePath = newKeywordsFilePath;
    highlightingEnabled = newHighlightingEnabled;
    console.log('Settings saved:', { oldFilesDir, newFilesDir });
    showSettingsModal = false;
    
    // Refresh network status after settings are saved
    refreshNetworkStatus();
  }
  
  // Function to refresh network status
  async function refreshNetworkStatus() {
    try {
      if (isWebBrowser) {
        // In browser mode, network is always enabled
        networkEnabled = true;
        networkUrl = window.location.origin;
      } else if (window.electronAPI && window.electronAPI.getNetworkStatus) {
        const status = await window.electronAPI.getNetworkStatus();
        networkEnabled = status.enabled;
        networkUrl = status.url;
        console.log('Network status refreshed:', { networkEnabled, networkUrl });
      }
    } catch (error) {
      console.error('Error getting network status:', error);
    }
  }
  
  // Start watching the directories if they're both set in handleSaveSettings
  if (oldFilesDir && newFilesDir) {
    startWatchingDirectories();
  }
  
  // Compare files in the selected directories
  async function compareDirectories() {
    if (!oldFilesDir || !newFilesDir) {
      console.error('Both old and new directories must be selected');
      return;
    }
    
    try {
      isComparing = true;
      showDiffViewer = true;
      console.log('Comparing files in directories:', { oldFilesDir, newFilesDir });
      
      if (isWebBrowser) {
        // In web browser, use the API endpoint to compare files
        const response = await fetch('/api/compare-directories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldDirPath: oldFilesDir,
            newDirPath: newFilesDir,
            diffMode: 'line' // Default diff mode
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.diffResults) {
            diffResults = data.diffResults;
            console.log('Received diff results from server:', diffResults);
          } else {
            console.error('Error in server response:', data.error || 'Unknown error');
            diffResults = [];
          }
        } else {
          console.error('Error comparing files via API:', response.statusText);
          diffResults = [];
        }
      } else {
        // In desktop app, call the main process to compare files
        diffResults = await window.electronAPI.compareDirectories(oldFilesDir, newFilesDir);
        console.log('Received diff results from electron:', diffResults);
      }
      
      // Load keyword categories if a file is selected
      if (keywordsFilePath) {
        await parseKeywordsFile(keywordsFilePath);
      }
      
      // Set up directory change listener if not already set and in desktop mode
      if (!isWebBrowser && !unsubscribeFromDirectoryChanges) {
        setupDirectoryChangeListener();
      }
    } catch (error) {
      console.error('Error comparing files:', error);
      diffResults = [];
    } finally {
      isComparing = false;
    }
  }
  
  // Parse keywords file function for both desktop and web environments
  async function parseKeywordsFile(filePath) {
    if (!filePath) {
      console.error('Keywords file path is required');
      return;
    }
    
    try {
      if (isWebBrowser) {
        // In web browser, use the API endpoint to parse keywords file
        const response = await fetch('/api/parse-keywords-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            keywordsFilePath: filePath
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.keywords) {
            keywordCategories = data.keywords.categories || [];
            console.log('Loaded keyword categories from server:', keywordCategories);
          }
        } else {
          console.error('Error parsing keywords file via API:', response.statusText);
          keywordCategories = [];
        }
      } else {
        // In desktop app, call the main process to parse keywords file
        const result = await window.electronAPI.parseKeywordsFile(filePath);
        keywordCategories = result.categories || [];
        console.log('Loaded keyword categories from electron:', keywordCategories);
      }
    } catch (error) {
      console.error('Error parsing keywords file:', error);
      keywordCategories = [];
    }
  }
  
  // Close diff viewer and return to main screen
  function closeDiffViewer() {
    showDiffViewer = false;
  }
  
  // Open search view
  function openSearchView() {
    showDiffViewer = false;
    showSearchView = true;
    showStreamView = false;
    // Clear any previous search results
    searchStore.clearSearch();
  }
  
  // Open stream view
  function openStreamView() {
    showDiffViewer = false;
    showSearchView = false;
    showStreamView = true;
  }
  
  // Close search view and return to main screen
  function closeSearchView() {
    showSearchView = false;
  }
  
  // Handle keyboard shortcuts
  function handleKeyDown(event) {
    // Allow Escape key to exit diff viewer or search view
    if (event.key === 'Escape') {
      if (showDiffViewer) {
        closeDiffViewer();
      } else if (showSearchView) {
        closeSearchView();
      }
    }
  }
  
  // Diff functionality is handled by the DiffViewer component

  // Theme modal functions moved to settings
  
  // Toggle keyword highlighting
  function toggleHighlighting() {
    highlightingEnabled = !highlightingEnabled;
    console.log('Highlighting toggled:', highlightingEnabled);
  }
  
  // Toggle keyword summary modal
  function toggleKeywordSummary() {
    showKeywordSummaryModal = !showKeywordSummaryModal;
  }
  
  // Close keyword summary modal
  function closeKeywordSummary() {
    showKeywordSummaryModal = false;
  }
  
  // Toggle notepad
  function toggleNotepad() {
    isNotepadOpen = !isNotepadOpen;
  }
  
  // Close notepad
  function closeNotepad() {
    isNotepadOpen = false;
  }
  
  // Handle keyword filter selection
  function handleKeywordFilter(event) {
    const { keyword } = event.detail;
    activeKeywordFilter = keyword;
    
    // If a keyword is selected, show a notification
    if (keyword) {
      // You could add a toast notification here
      console.log(`Filtering files by keyword: ${keyword}`);
    } else {
      console.log('Keyword filter cleared');
    }
  }
  
  // Handle keyword filter change from DiffViewer
  function handleKeywordFilterChange(event) {
    const { keywordFilter } = event.detail;
    // Only update if it's different to avoid loops
    if (activeKeywordFilter !== keywordFilter) {
      activeKeywordFilter = keywordFilter;
    }
  }
  
  // Handle highlighting state changes from DiffViewer
  function handleHighlightingChange(event) {
    // Simplified event handler with no logging
  }
  
  // Start watching directories for changes
  async function startWatchingDirectories() {
    if (!oldFilesDir || !newFilesDir) {
      console.error('Both old and new directories must be selected');
      return;
    }
    
    try {
      const success = await window.electronAPI.startWatchingDirectories(oldFilesDir, newFilesDir);
      isWatchingDirectories = success;
      console.log(`Directory watching ${success ? 'started' : 'failed'}`);
      
      // Set up directory change listener if not already set
      if (success && !unsubscribeFromDirectoryChanges) {
        setupDirectoryChangeListener();
      }
    } catch (error) {
      console.error('Error starting directory watchers:', error);
      isWatchingDirectories = false;
    }
  }
  
  // Stop watching directories
  async function stopWatchingDirectories() {
    try {
      const success = await window.electronAPI.stopWatchingDirectories();
      isWatchingDirectories = !success;
      console.log(`Directory watching ${success ? 'stopped' : 'failed to stop'}`);
      
      // Remove directory change listener
      if (success && unsubscribeFromDirectoryChanges) {
        unsubscribeFromDirectoryChanges();
        unsubscribeFromDirectoryChanges = null;
      }
    } catch (error) {
      console.error('Error stopping directory watchers:', error);
    }
  }
  
  // Set up listener for directory changes
  function setupDirectoryChangeListener() {
    // Clean up any existing listener
    if (unsubscribeFromDirectoryChanges) {
      unsubscribeFromDirectoryChanges();
    }
    
    // Set up new listener
    unsubscribeFromDirectoryChanges = window.electronAPI.onDirectoryChanged((newDiffResults) => {
      console.log('Directory changed, received new diff results:', newDiffResults);
      diffResults = newDiffResults;
    });
  }
  
  // Cleanup on component destruction
  onDestroy(() => {
    if (unsubscribeFromDirectoryChanges) {
      unsubscribeFromDirectoryChanges();
    }
    stopWatchingDirectories();
    unsubscribeTheme();
    // Clean up IPC listener for port dialog if it was set up
    if (window.electronAPI && window.electronAPI.cleanupOpenPortInputDialogListener) {
      window.electronAPI.cleanupOpenPortInputDialogListener();
    }
  });
  
  // Listen for request to open port input dialog from main process
  if (window.electronAPI && window.electronAPI.onOpenPortInputDialog) {
    window.electronAPI.onOpenPortInputDialog((currentPort) => {
      console.log('Received open-port-input-dialog with port:', currentPort);
      portForDialog = currentPort || 3000;
      showPortInputDialog = true;
    });
  }
</script>

<ThemeProvider>
<main>
  {#if showDiffViewer}
    <!-- Diff Viewer Mode -->
    <header style="background-color: var(--header-background); color: var(--header-text);">
      <div class="header-left">
        <h1>File Comparison</h1>
        {#if activeKeywordFilter}
          <div class="title-filter-indicator">
            <span class="filter-pill">Filtered by: <span class="keyword">{activeKeywordFilter}</span></span>
            <button 
              class="clear-filter-btn" 
              on:click={() => activeKeywordFilter = null}
              aria-label="Clear keyword filter"
            >
              ×
            </button>
          </div>
        {/if}
      </div>
      <div class="actions">
        <button class="header-button search-button" on:click={openSearchView}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path fill="none" stroke="currentColor" stroke-width="2" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14z"></path>
          </svg>
          Search
        </button>
        <button class="header-button stream-button" on:click={openStreamView}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path fill="none" stroke="currentColor" stroke-width="2" d="M4 6c2 0 4 2 6 2s4-2 6-2 4 2 6 2M4 12c2 0 4 2 6 2s4-2 6-2 4 2 6 2M4 18c2 0 4 2 6 2s4-2 6-2 4 2 6 2"></path>
          </svg>
          Stream
        </button>

        
        {#if keywordsFilePath}
          <button 
            class="header-button keyword-toggle-button"
            class:active={highlightingEnabled} 
            on:click={() => highlightingEnabled = !highlightingEnabled}
            aria-pressed={highlightingEnabled}
            title={highlightingEnabled ? 'Disable Keyword Highlighting' : 'Enable Keyword Highlighting'}
          >
            Keywords: {highlightingEnabled ? 'On' : 'Off'}
          </button>
          <button 
            class="header-button keyword-summary-button" 
            on:click={toggleKeywordSummary}
            title="View Keyword List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path fill="none" stroke="currentColor" stroke-width="2" d="M8 6h13"></path>
              <path fill="none" stroke="currentColor" stroke-width="2" d="M8 12h13"></path>
              <path fill="none" stroke="currentColor" stroke-width="2" d="M8 18h13"></path>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Keyword List
          </button>
        {/if}
        
        {#if !isFirstPage || showSearchView}
          <NotepadButton isNotepadOpen={isNotepadOpen} on:toggle={toggleNotepad} />
        {/if}
        
        <!-- Settings Button moved to the far right -->
        <button 
          class="header-button settings-button" 
          style="margin-left: 8px;"
          on:click={openSettings}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
    
    <div class="diff-viewer-container">
      <DiffViewer 
        diffResults={diffResults} 
        isLoading={isComparing} 
        keywordCategories={keywordCategories}
        highlightingEnabled={highlightingEnabled}
        keywordFilter={activeKeywordFilter}
        on:highlightingChange={handleHighlightingChange}
        on:keywordFilterChange={handleKeywordFilterChange}
      />
    </div>
  {:else if showSearchView}
    <!-- Search Mode -->
    <header style="background-color: var(--header-background); color: var(--header-text);">
      <div class="header-left">
        <h1>File Search</h1>
      </div>
      <div class="actions">
        <button class="header-button compare-button" on:click={() => {
          showSearchView = false;
          showStreamView = false;
          showDiffViewer = true;
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Compare
        </button>

        
        <!-- Notepad Button for Search View -->
        <NotepadButton isNotepadOpen={isNotepadOpen} on:toggle={toggleNotepad} />
        
        <!-- Settings button moved to the far right with gear icon -->
        <button 
          class="header-button settings-button" 
          style="margin-left: 8px;"
          on:click={openSettings}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
    
    <div class="search-view-container">
      <SearchView directoryPath={newFilesDir || oldFilesDir} />
    </div>
  {:else if showStreamView}
    <!-- Stream Mode -->
    <header style="background-color: var(--header-background); color: var(--header-text);">
      <div class="header-left">
        <h1>File Stream</h1>
      </div>
      <div class="actions">
        <button class="header-button compare-button" on:click={() => {
          showSearchView = false;
          showStreamView = false;
          showDiffViewer = true;
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Compare
        </button>

        
        <!-- Notepad Button for Stream View -->
        <NotepadButton isNotepadOpen={isNotepadOpen} on:toggle={toggleNotepad} />
        
        <!-- Settings button moved to the far right with gear icon -->
        <button 
          class="header-button settings-button" 
          style="margin-left: 8px;"
          on:click={openSettings}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>
    
    <div class="stream-view-container">
      <StreamView 
        directoryPath={newFilesDir} 
        keywordCategories={keywordCategories}
        highlightingEnabled={highlightingEnabled}
      />
    </div>
  {:else}
    <!-- Main Mode -->
    <header style="background-color: var(--header-background); color: var(--header-text);">
      <h1>DeltaVision</h1>
      <div class="actions">

      </div>
    </header>
    
    <div class="content">
      <div class="directories-info">
        {#if oldFilesDir && newFilesDir}
          <div class="directory-info">
            <h3>Old Files Directory:</h3>
            <p class="directory-path">{oldFilesDir}</p>
          </div>
          <div class="directory-info">
            <h3>New Files Directory:</h3>
            <p class="directory-path">{newFilesDir}</p>
          </div>
          <div class="action-buttons">
            <button class="primary-button" on:click={compareDirectories} disabled={isComparing || !oldFilesDir || !newFilesDir}>
              {#if isComparing}
                Comparing Files...
              {:else}
                Compare Files
              {/if}
            </button>
          </div>
        {:else}
          <div class="setup-prompt">
            <svg class="setup-prompt-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2>Welcome to DeltaVision</h2>
            <p class="setup-instructions">To begin comparing files, please select your old and new file directories using the button below.</p>
            <button class="primary-button configure-button-large" on:click={openSettings}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 16px;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Configure Directories
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Settings Modal -->
  <SettingsModal 
    show={showSettingsModal} 
    oldFilesDir={oldFilesDir} 
    newFilesDir={newFilesDir}
    keywordsFilePath={keywordsFilePath}
    highlightingEnabled={highlightingEnabled}
    networkEnabled={networkEnabled}
    networkUrl={networkUrl}
    on:close={handleCloseSettings} 
    on:save={handleSaveSettings} 
  />

  <!-- Theme Modal moved to settings -->
  
  <!-- Notepad Panel -->
  <NotepadPanel isOpen={isNotepadOpen} on:close={closeNotepad} />
  
  {#if showPortInputDialog}
    <PortInputDialog 
      bind:show={showPortInputDialog} 
      currentPort={portForDialog}
      on:close={() => {
        showPortInputDialog = false;
        refreshNetworkStatus(); // Refresh status after dialog closes
      }}
    />
  {/if}
</main>

<KeywordSummaryModal 
  show={showKeywordSummaryModal}
  keywordCategories={keywordCategories}
  activeKeywordFilter={activeKeywordFilter}
  on:close={closeKeywordSummary}
  on:keywordFilter={handleKeywordFilter}
/>

</ThemeProvider>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
  }
  
  :global(#app) {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
  }
  
  main {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background-color: var(--header-background, #ffffff);
    color: var(--header-text, #333333);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid var(--border, #e0e0e0);
    position: relative;
    z-index: 10;
  }
  
  header h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    /* Ensure high contrast by using specific color rather than inheriting */
    color: var(--primary, #4a90e2) !important;
    /* Multiple text shadows to create an outline effect for better contrast */
    text-shadow: 
      -1px -1px 0 rgba(0, 0, 0, 0.5),
      1px -1px 0 rgba(0, 0, 0, 0.5),
      -1px 1px 0 rgba(0, 0, 0, 0.5),
      1px 1px 0 rgba(0, 0, 0, 0.5),
      0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .title-filter-indicator {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    padding: 4px 8px;
    margin-left: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1;
    white-space: nowrap;
  }
  
  .filter-pill {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .filter-pill .keyword {
    font-family: monospace;
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.15);
    padding: 2px 6px;
    border-radius: 3px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .clear-filter-btn {
    background: none;
    border: none;
    color: var(--header-text);
    font-size: 18px;
    cursor: pointer;
    padding: 0 0 0 8px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }
  
  .clear-filter-btn:hover {
    opacity: 1;
  }

  h1 {
    color: var(--headerText, #e0e0e0);
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  }

  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
    text-align: center; /* Fallback for older browsers or if flex fails */
    display: flex;
    flex-direction: column;
    align-items: center; /* Center .description and .directories-info */
    justify-content: center; /* Vertically center content if possible */
    height: calc(100vh - 60px); /* Full viewport height minus header */
    box-sizing: border-box;
  }

  .directories-info {
    background-color: var(--secondary, #f5f5f5);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    border: 1px solid var(--border, #e0e0e0);
    margin: 0;
    word-break: break-all;
    color: var(--text, #333333);
  }

  .directory-info {
    margin-bottom: 15px;
  }

  .directory-info h3 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: var(--text, #333333);
  }

  .directory-path {
    background-color: var(--background, #ffffff);
    padding: 10px;
    border-radius: 4px;
    border: 1px solid var(--border, #e0e0e0);
    margin: 0;
    word-break: break-all;
    color: var(--text, #333333);
  }

  .setup-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; 
    text-align: center;
    padding: 40px 20px;
    background-color: var(--secondary-background, var(--secondary, #f5f5f5));
    border-radius: 12px;
    border: 1px solid var(--border-light, var(--border, #e0e0e0));
    max-width: 600px;
    margin: 0 auto; /* Centering the box if .directories-info is wider */
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    /* Add a subtle background gradient for better contrast with text */
    background-image: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.1),
      rgba(0, 0, 0, 0.05)
    );
  }

  .setup-prompt-icon {
    color: var(--primary, #4a90e2);
    margin-bottom: 20px;
    opacity: 0.8;
  }

  .setup-prompt h2 {
    font-size: 1.8em;
    color: var(--text-strong, var(--text, #333333));
    margin-top: 0; /* Remove default h2 margin if .setup-prompt-icon is above */
    margin-bottom: 15px;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    font-weight: 700;
  }

  .setup-prompt .setup-instructions {
    font-size: 1.1em;
    color: var(--text, #333333);
    line-height: 1.6;
    margin-bottom: 30px;
    max-width: 450px; /* Fixed width instead of percentage */
    padding: 0 10px; /* Add some padding */
    word-wrap: normal; /* Prevent awkward breaks */
    hyphens: none; /* Disable hyphenation */
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
    font-weight: 500;
  }

  .setup-prompt .configure-button-large {
    padding: 12px 25px;
    font-size: 1.1em;
    display: inline-flex;
    align-items: center;
  }

  .primary-button {
    background-color: var(--primary, #007bff);
    color: var(--primary-text, white);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    text-decoration: none;
    padding: 10px 20px; /* Default padding */
    font-weight: 500;
  }

  .primary-button:hover {
    background-color: var(--primary-hover, #0056b3);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  button {
    padding: 8px 15px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid transparent;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .header-button {
    background-color: var(--button-background, #f0f0f0);
    color: var(--headerButtonText, black);
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-left: 8px; /* Consistent spacing between buttons */
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 90px;
    line-height: 1;
    text-shadow: 0px 1px 1px rgba(255, 255, 255, 0.5);
  }

  .header-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--button-hover, #e8e8e8);
  }

  .header-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Theme button styles removed - now in SettingsModal.svelte */
  
  .keyword-toggle-button {
    background-color: var(--keywordsButtonBg, var(--button-background, #9ece6a)); /* Green for Keywords button */
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    /* Inherits other base styles from .header-button */
  }

  .keyword-toggle-button:hover:not(.active) {
    background-color: var(--keywordsButtonHover, var(--button-hover, #7fb352));
  }

  .keyword-toggle-button.active {
    background-color: var(--keywordsButtonActiveBg, var(--primary, #73d0b5)); /* Active state background */
    /* Use consistent text color from header-button */
    border-color: var(--border, transparent);
  }

  .keyword-toggle-button.active:hover {
    background-color: var(--keywordsButtonActiveHover, var(--primaryHover, #5ebfa6));
  }

  .keyword-summary-button {
    background-color: var(--keywordListButtonBg, var(--button-background, #e0af68)); /* Yellow/Gold for Keyword List */
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    /* Inherits other base styles from .header-button */
  }

  .keyword-summary-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--keywordListButtonHover, var(--button-hover, #c99a4f));
  }

  .keyword-summary-button svg {
    margin-right: 6px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0; /* Remove gap since we're using margin on buttons */
    margin-right: 8px; /* Add right margin to the actions container */
  }

  .settings-button {
    background-color: var(--settings-button-bg, var(--accent1, #f5923e));
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    min-width: 36px !important; /* Override the min-width for icon-only button */
    width: 36px;
    padding: 8px;
    justify-content: center;
  }
  
  .settings-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--settings-button-hover, var(--accent1Hover, #e07d2e));
  }
  
  .search-button {
    background-color: var(--search-button-bg, var(--accent2, #9c27b0));
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .search-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--search-button-hover, var(--accent2Hover, #7b1fa2));
  }
  
  .compare-button {
    background-color: var(--compare-button-bg, var(--accent3, #2196F3));
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    display: flex;
    align-items: center;
  }
  
  .compare-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--compare-button-hover, var(--accent3Hover, #1976D2));
  }
  
  /* Search view container styles */
  .search-view-container {
    flex: 1;
    height: calc(100vh - 60px); /* Full viewport height minus header */
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .diff-viewer-container {
    flex: 1;
    height: calc(100vh - 60px); /* Full viewport height minus header */
    overflow: hidden;
  }
  
  .stream-view-container {
    flex: 1;
    height: calc(100vh - 60px); /* Full viewport height minus header */
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .stream-button {
    background-color: var(--stream-button-bg, var(--accent5, #009688));
    /* Use consistent text color from header-button */
    border: 1px solid var(--border, transparent);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .stream-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--stream-button-hover, var(--accent5Hover, #00796b));
  }
  
  /* CSP now allows inline styles for better development efficiency */
</style>
