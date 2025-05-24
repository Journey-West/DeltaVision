<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { theme } from './themes';
  import ThemeModal from './components/ThemeModal.svelte';
  
  // Event dispatcher for communicating with parent component
  const dispatch = createEventDispatcher();
  
  // Detect if running in web browser (no window.electronAPI)
  const isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  
  // Props
  export let show = false;
  export let oldFilesDir = '';
  export let newFilesDir = '';
  export let keywordsFilePath = '';
  export let highlightingEnabled = false;
  export let networkEnabled = false;
  export let networkUrl = '';
  
  // Theme state
  let isThemeModalOpen = false;
  let currentTheme = $theme;
  
  // Local state
  let localOldFilesDir = oldFilesDir;
  let localNewFilesDir = newFilesDir;
  let localKeywordsFilePath = keywordsFilePath;
  let localHighlightingEnabled = highlightingEnabled;
  let keywordCategories = [];
  let isLoadingKeywords = false;
  let showPortInput = false;
  let newPortNumber = null;
  let originalPort = null;
  
  // Helper to get current port from networkUrl
  function getCurrentPort() {
    if (!networkUrl) return null;
    try {
      const url = new URL(networkUrl);
      const port = parseInt(url.port);
      return isNaN(port) ? null : port;
    } catch (e) {
      // Fallback for potentially malformed URLs or environments without URL
      const match = networkUrl.match(/:(\d+)\/?$/);
      if (match && match[1]) {
        const port = parseInt(match[1]);
        return isNaN(port) ? null : port;
      }
      return null;
    }
  }
  
  // Function to open port configuration input
  function openPortConfig() {
    originalPort = getCurrentPort();
    newPortNumber = originalPort || 3000; // Default to 3000 if not parsable
    showPortInput = true;
  }
  
  // Function to cancel port configuration
  function cancelPortConfig() {
    showPortInput = false;
    newPortNumber = null; // Reset to avoid accidental save
  }
  
  // Methods for directory selection
  async function selectOldDirectory() {
    try {
      if (isWebBrowser) {
        console.log('Directory selection not available in web browser mode');
        return;
      }
      
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const selectedPath = await window.electronAPI.selectDirectory('Select Old Files Directory');
        if (selectedPath) {
          localOldFilesDir = selectedPath;
        }
      }
    } catch (error) {
      console.error('Error selecting old files directory:', error);
    }
  }
  
  async function selectNewDirectory() {
    try {
      if (isWebBrowser) {
        console.log('Directory selection not available in web browser mode');
        return;
      }
      
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const selectedPath = await window.electronAPI.selectDirectory('Select New Files Directory');
        if (selectedPath) {
          localNewFilesDir = selectedPath;
        }
      }
    } catch (error) {
      console.error('Error selecting new files directory:', error);
    }
  }
  
  // Select keywords file
  async function selectKeywordsFile() {
    try {
      if (isWebBrowser) {
        console.log('File selection not available in web browser mode');
        return;
      }
      
      if (window.electronAPI && window.electronAPI.selectKeywordsFile) {
        const selectedPaths = await window.electronAPI.selectKeywordsFile('Select Keywords File');
        if (selectedPaths && selectedPaths.length > 0) {
          localKeywordsFilePath = selectedPaths[0];
          await loadKeywordCategories();
        }
      }
    } catch (error) {
      console.error('Error selecting keywords file:', error);
    }
  }
  
  // Load keyword categories from the selected file
  async function loadKeywordCategories() {
    if (!localKeywordsFilePath) {
      keywordCategories = [];
      return;
    }
    
    try {
      isLoadingKeywords = true;
      
      if (isWebBrowser) {
        // In web browser, use the API endpoint to parse keywords file
        try {
          const response = await fetch('/api/parse-keywords-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              keywordsFilePath: localKeywordsFilePath
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.keywords) {
              keywordCategories = data.keywords.categories || [];
            }
          } else {
            console.error('Error parsing keywords file via API:', response.statusText);
            keywordCategories = [];
          }
        } catch (error) {
          console.error('Error parsing keywords file via API:', error);
          keywordCategories = [];
        }
      } else if (window.electronAPI && window.electronAPI.parseKeywordsFile) {
        // In desktop app, call the main process to parse keywords file
        const result = await window.electronAPI.parseKeywordsFile(localKeywordsFilePath);
        keywordCategories = result.categories || [];
      }
    } catch (error) {
      console.error('Error loading keyword categories:', error);
      keywordCategories = [];
    } finally {
      isLoadingKeywords = false;
    }
  }
  
  // Highlighting is now controlled from the main app header
  
  // Open theme modal
  function openThemeModal() {
    isThemeModalOpen = true;
  }
  
  // Handle theme modal close
  function handleThemeModalClose() {
    isThemeModalOpen = false;
  }
  
  // Subscribe to theme changes
  $: currentTheme = $theme;
  
  // Save settings
  async function saveSettings() {
    let portChanged = false;
    if (showPortInput && newPortNumber !== null) {
      const portToSet = parseInt(newPortNumber);
      if (portToSet >= 1024 && portToSet <= 65535) {
        if (portToSet !== originalPort) {
          try {
            if (window.electronAPI && window.electronAPI.setNetworkPort) {
              await window.electronAPI.setNetworkPort(portToSet);
              portChanged = true; // Port change attempted
            }
          } catch (error) {
            console.error('Error setting network port:', error);
            // Optionally, show an error to the user
          }
        }
      } else {
        console.warn('Invalid port number entered:', newPortNumber);
        // Optionally, show an error to the user and prevent closing modal
        alert(`Invalid port number: ${newPortNumber}. Port must be between 1024 and 65535.`);
        return; // Stop saving if port is invalid
      }
    }
    
    dispatch('save', {
      oldFilesDir: localOldFilesDir,
      newFilesDir: localNewFilesDir,
      keywordsFilePath: localKeywordsFilePath,
      highlightingEnabled: localHighlightingEnabled,
      portChanged // Pass this info if App.svelte needs to react specifically
    });
    closeModal();
  }
  
  // Close modal without saving
  function closeModal() {
    // Reset local values to props
    localOldFilesDir = oldFilesDir;
    localNewFilesDir = newFilesDir;
    localKeywordsFilePath = keywordsFilePath;
    localHighlightingEnabled = highlightingEnabled;
    dispatch('close');
    showPortInput = false; // Reset port input visibility on close
    newPortNumber = null; // Reset port number on close
  }
  
  // Update local values when props change
  $: {
    localOldFilesDir = oldFilesDir;
    localNewFilesDir = newFilesDir;
    localKeywordsFilePath = keywordsFilePath;
    localHighlightingEnabled = highlightingEnabled;
  }
  
  // Load categories when modal is shown
  $: if (show && localKeywordsFilePath) {
    loadKeywordCategories();
  }
  
  // Load keyword categories when the component is mounted or when the file path changes
  $: if (localKeywordsFilePath) {
    loadKeywordCategories();
  }
</script>

<!-- Modal overlay -->
{#if show}
<div class="modal-overlay">
  <div class="modal-container">
    <div class="modal-header">
      <h2>Settings</h2>
      <button class="close-button" on:click={closeModal}>×</button>
    </div>
    
    <div class="modal-body">
      <div class="settings-section">
        <!-- Theme Selection -->
        <div class="form-group">
          <label for="theme-selector">Application Theme</label>
          <div class="theme-button-container">
            <button id="theme-selector" class="theme-button" on:click={openThemeModal}>
              <span class="theme-name">{currentTheme?.name || 'Default'}</span>
              <span class="theme-change">Change</span>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="oldFilesDir">Old Files Directory</label>
          <div class="directory-input">
            <input 
              type="text" 
              id="oldFilesDir" 
              bind:value={localOldFilesDir} 
              readonly
              placeholder="Select a directory for old files"
            />
            <button on:click={selectOldDirectory}>Browse</button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="newFilesDir">New Files Directory</label>
          <div class="directory-input">
            <input 
              type="text" 
              id="newFilesDir" 
              bind:value={localNewFilesDir} 
              readonly
              placeholder="Select a directory for new files"
            />
            <button on:click={selectNewDirectory}>Browse</button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="keywordsFile">Keywords File</label>
          <div class="directory-input">
            <input 
              type="text" 
              id="keywordsFile" 
              bind:value={localKeywordsFilePath} 
              readonly
              placeholder="Select a keywords file for highlighting"
            />
            <button on:click={selectKeywordsFile}>Browse</button>
          </div>
        </div>
        
        {#if keywordCategories.length > 0}
          <div class="keyword-categories">
            <h3>Keyword Categories</h3>
            <div class="category-list">
              {#each keywordCategories as category}
                <div class="category-item" style="color: var(--{category.color}, {category.color})">
                  {category.name} ({category.keywords.length})
                </div>
              {/each}
            </div>
          </div>
        {:else if isLoadingKeywords}
          <div class="loading-keywords">Loading keywords...</div>
        {/if}
      </div>
      
      <div class="settings-section">
        <h3>Network Configuration</h3>
        <div class="form-group">
          <div class="form-label">Network Status</div>
          <p>{networkEnabled ? 'Enabled' : 'Disabled'}</p>
          {#if networkEnabled && networkUrl}
            <p>Current URL: <code>{networkUrl}</code></p>
          {/if}
        </div>
        
        {#if networkEnabled}
          {#if showPortInput}
            <div class="form-group">
              <label for="networkPort">New Port Number (1024-65535)</label>
              <input 
                type="number" 
                id="networkPort" 
                bind:value={newPortNumber} 
                min="1024" 
                max="65535"
                placeholder="Enter port (e.g., 3000)"
              />
              <div class="port-config-buttons" style="margin-top: 10px;">
                <button class="button-secondary" on:click={cancelPortConfig}>Cancel Change</button>
                <!-- Save button of the modal will handle the actual saving -->
              </div>
            </div>
          {:else}
            <button class="button-primary" on:click={openPortConfig}>Configure Port</button>
          {/if}
        {/if}
      </div>
    </div>
    
    <div class="modal-footer">
      <div class="footer-buttons">
        <button class="cancel-button" on:click={closeModal}>Cancel</button>
        <button class="save-button" on:click={saveSettings}>Save</button>
      </div>
    </div>
  </div>
</div>

<!-- Theme Modal -->
{#if isThemeModalOpen}
  <ThemeModal isOpen={isThemeModalOpen} on:close={handleThemeModalClose} />
{/if}
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--modal-overlay, rgba(0, 0, 0, 0.5));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-container {
    background-color: var(--modal-background, #ffffff);
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 500px;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border, #e0e0e0);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--border, #e0e0e0);
    background-color: var(--header-background, #f0f0f0);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--header-text, #333333);
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--header-text, #333333);
    opacity: 0.7;
  }
  
  .close-button:hover {
    opacity: 1;
  }
  
  .modal-body {
    padding: 20px;
    overflow-y: auto;
    background-color: var(--modal-background, #ffffff);
    color: var(--text, #333333);
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 700;
    color: var(--text, #333333);
  }
  
  .directory-input {
    display: flex;
  }
  
  .directory-input input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 4px 0 0 4px;
    font-size: 14px;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
  }
  
  .directory-input button {
    padding: 8px 15px;
    background-color: var(--button-background, #4a90e2);
    border: 1px solid var(--border, #e0e0e0);
    border-left: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    color: var(--button-text, #ffffff);
  }
  
  .directory-input button:hover {
    background-color: var(--button-hover, #3a80d2);
  }
  
  .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border, #e0e0e0);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--header-background, #f0f0f0);
  }
  
  .modal-footer button {
    padding: 8px 15px;
    margin-left: 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  
  .cancel-button {
    background-color: var(--secondary, #f5f5f5);
    border: 1px solid var(--border, #e0e0e0);
    color: var(--text, #333333);
  }
  
  .save-button {
    background-color: #4CAF50;
    border: 1px solid #4CAF50;
    color: white;
  }
  
  .cancel-button:hover {
    background-color: var(--sidebar-hover, #e8e8e8);
  }
  
  .save-button:hover {
    background-color: #45a049;
  }
  
  /* Theme button styling */
  .theme-button-container {
    display: flex;
    width: 100%;
  }
  
  .theme-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px 15px;
    background-color: var(--secondary, #2d2d2d);
    color: var(--text, #e0e0e0);
    border: 1px solid var(--border, #3a3a3a);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .theme-button:hover {
    background-color: var(--primary, #4a90e2);
    border-color: var(--primary, #4a90e2);
  }
  
  .theme-name {
    font-weight: 500;
  }
  
  .theme-change {
    font-size: 12px;
    opacity: 0.7;
  }
  
  /* Highlighting toggle moved to main app header */
  

  
  .footer-buttons {
    display: flex;
    gap: 10px;
  }
  
  .keyword-categories {
    margin-top: 15px;
    padding: 10px;
    background-color: var(--secondary, #f5f5f5);
    border-radius: 4px;
    border: 1px solid var(--border, #e0e0e0);
  }
  
  .keyword-categories h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 16px;
    color: var(--text, #333333);
  }
  
  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .category-item {
    padding: 5px 10px;
    border-radius: 4px;
    background-color: var(--background, #ffffff);
    border: 1px solid var(--border, #e0e0e0);
    font-weight: 500;
  }
  
  .loading-keywords {
    margin-top: 10px;
    font-style: italic;
    color: var(--text, #333333);
    opacity: 0.7;
  }
</style>
