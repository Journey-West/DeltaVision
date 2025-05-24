<script>
  import { theme } from '../themes';
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let isOpen = false;
  
  const dispatch = createEventDispatcher();
  let selectedThemeId = $theme.id;
  
  // Get all available themes from the theme store
  let themesList = [];
  
  // Store the original theme ID when opening the modal
  let originalThemeId;
  
  // Reactive variable to track the selected theme object
  $: selectedTheme = themesList.find(t => t.id === selectedThemeId) || null;
  
  // Sort themes by name and then by light/dark
  $: sortedThemesList = [...themesList].sort((a, b) => {
    // First group by light/dark
    const aIsLight = isLightTheme(a);
    const bIsLight = isLightTheme(b);
    if (aIsLight !== bIsLight) return aIsLight ? 1 : -1; // Dark themes first
    // Then sort by name
    return a.name.localeCompare(b.name);
  });
  
  // Update themes list when the component is mounted and when the modal is opened
  $: if (isOpen) {
    themesList = theme.getAllThemes();
    selectedThemeId = $theme.id;
    originalThemeId = $theme.id;
    // Set initial focus and scroll to the current theme when modal opens
    setTimeout(() => {
      scrollSelectedThemeIntoView();
    }, 100);
  }
  
  function scrollSelectedThemeIntoView() {
    const selectedElement = document.querySelector('.theme-list-item.active');
    if (selectedElement) {
      selectedElement.focus();
      selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      const firstItem = document.querySelector('.theme-list-item');
      if (firstItem) firstItem.focus();
    }
  }
  
  function closeModal() {
    // If we close without applying, cancel any active preview
    theme.cancelPreview();
    dispatch('close');
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  function selectTheme(themeId) {
    selectedThemeId = themeId;
    // Preview the selected theme immediately
    theme.previewTheme(themeId);
  }
  
  function applyTheme() {
    // Apply the current preview theme permanently
    theme.applyPreview();
    closeModal();
  }
  
  // Determine if a theme is light or dark based on its background color
  function isLightTheme(themeOption) {
    // Simple heuristic: if background color is closer to white than black
    const bgColor = themeOption.colors.background.replace('#', '');
    if (bgColor.length === 6) {
      const r = parseInt(bgColor.substring(0, 2), 16);
      const g = parseInt(bgColor.substring(2, 4), 16);
      const b = parseInt(bgColor.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 125;
    }
    // Default to dark if we can't determine
    return false;
  }
  
  // Get indices for dark and light themes for proper keyboard navigation
  function getDarkThemeIndex(index) {
    return index;
  }
  
  function getLightThemeIndex(index) {
    const darkThemesCount = sortedThemesList.filter(t => !isLightTheme(t)).length;
    return darkThemesCount + index;
  }
  
  // Handle keyboard navigation between list items
  function handleListKeydown(event, index) {
    const listItems = document.querySelectorAll('.theme-list-item');
    const totalItems = listItems.length;
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % totalItems;
      listItems[nextIndex].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = (index - 1 + totalItems) % totalItems;
      listItems[prevIndex].focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Find the theme corresponding to this index
      const darkThemes = sortedThemesList.filter(t => !isLightTheme(t));
      const lightThemes = sortedThemesList.filter(t => isLightTheme(t));
      
      const darkThemesCount = darkThemes.length;
      if (index < darkThemesCount) {
        selectTheme(darkThemes[index].id);
      } else {
        selectTheme(lightThemes[index - darkThemesCount].id);
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div 
    class="modal-backdrop" 
    on:click={closeModal} 
    on:keydown={(e) => e.key === 'Enter' && closeModal()} 
    role="button" 
    tabindex="0" 
    aria-label="Close theme modal"
  ></div>
  <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
    <div class="modal-header">
      <h2 id="theme-modal-title">Select Theme</h2>
      <button class="close-button" on:click={closeModal} aria-label="Close">×</button>
    </div>
    
    <div class="modal-content">
      <div class="theme-modal-split">
        <!-- Theme list (left side) -->
        <div class="theme-list-container">
          <!-- Dark themes section -->
          <div class="theme-section-header">Dark Themes</div>
          {#each sortedThemesList.filter(t => !isLightTheme(t)) as themeOption, index}
            <div 
              class="theme-list-item" 
              class:active={selectedThemeId === themeOption.id}
              on:click={() => selectTheme(themeOption.id)}
              on:keydown={(e) => handleListKeydown(e, getDarkThemeIndex(index))}
              role="button"
              tabindex="0"
              aria-label="Theme: {themeOption.name}"
              aria-pressed={selectedThemeId === themeOption.id}
            >
              <!-- Color preview indicator -->
              <div class="theme-color-preview">
                <div class="color-preview-background" style="background-color: {themeOption.colors.background}"></div>
                <div class="color-preview-grid">
                  <div style="background-color: {themeOption.colors.primary}"></div>
                  <div style="background-color: {themeOption.colors.headerBackground}"></div>
                  <div style="background-color: {themeOption.colors.buttonBackground || themeOption.colors.primary}"></div>
                  <div style="background-color: {themeOption.colors.sidebar || themeOption.colors.headerBackground}"></div>
                </div>
              </div>
              <!-- Theme info -->
              <div class="theme-list-info">
                <div class="theme-list-name">{themeOption.name}</div>
              </div>
              
              <!-- Selected indicator -->
              {#if selectedThemeId === themeOption.id}
                <div class="theme-list-selected-indicator">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none">
                    <polyline points="6 12 10 16 18 8"></polyline>
                  </svg>
                </div>
              {/if}
            </div>
          {/each}
          
          <!-- Light themes section -->
          <div class="theme-section-header">Light Themes</div>
          {#each sortedThemesList.filter(t => isLightTheme(t)) as themeOption, index}
            <div 
              class="theme-list-item" 
              class:active={selectedThemeId === themeOption.id}
              on:click={() => selectTheme(themeOption.id)}
              on:keydown={(e) => handleListKeydown(e, getLightThemeIndex(index))}
              role="button"
              tabindex="0"
              aria-label="Theme: {themeOption.name}"
              aria-pressed={selectedThemeId === themeOption.id}
            >
              <!-- Color preview indicator -->
              <div class="theme-color-preview">
                <div class="color-preview-background" style="background-color: {themeOption.colors.background}"></div>
                <div class="color-preview-grid">
                  <div style="background-color: {themeOption.colors.primary}"></div>
                  <div style="background-color: {themeOption.colors.headerBackground}"></div>
                  <div style="background-color: {themeOption.colors.buttonBackground || themeOption.colors.primary}"></div>
                  <div style="background-color: {themeOption.colors.sidebar || themeOption.colors.headerBackground}"></div>
                </div>
              </div>
              <!-- Theme info -->
              <div class="theme-list-info">
                <div class="theme-list-name">{themeOption.name}</div>
              </div>
              
              <!-- Selected indicator -->
              {#if selectedThemeId === themeOption.id}
                <div class="theme-list-selected-indicator">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none">
                    <polyline points="6 12 10 16 18 8"></polyline>
                  </svg>
                </div>
              {/if}
            </div>
          {/each}
          
          {#if themesList.length === 0}
            <div class="no-themes-message">
              <p>No themes available.</p>
            </div>
          {/if}
        </div>
        
        <!-- Large theme preview (right side) -->
        {#if selectedTheme}
          <div class="theme-preview-large" 
               style="background-color: {selectedTheme.colors.background}; 
                      color: {selectedTheme.colors.text}">
            <div class="preview-title">
              <span>{selectedTheme.name}</span>
              <span class="preview-type-indicator">
                {isLightTheme(selectedTheme) ? 'Light Theme' : 'Dark Theme'}
              </span>
            </div>
            
            <!-- App window preview -->
            <div class="preview-app-window">
              <!-- Header with app controls -->
              <div class="preview-app-header" 
                   style="background-color: {selectedTheme.colors.headerBackground}; 
                          color: {selectedTheme.colors.headerText}">
                <div class="window-controls">
                  <div class="window-control close"></div>
                  <div class="window-control minimize"></div>
                  <div class="window-control maximize"></div>
                </div>
                <div class="preview-app-title">DeltaVision</div>
                <div class="preview-app-toolbar">
                  <div class="toolbar-button" 
                       style="background-color: {selectedTheme.colors.buttonBackground}; 
                              color: {selectedTheme.colors.buttonText}"></div>
                </div>
              </div>
              
              <!-- App content with sidebar and diff view -->
              <div class="preview-app-content">
                <!-- Sidebar -->
                <div class="preview-app-sidebar" 
                     style="background-color: {selectedTheme.colors.sidebar}">
                  <div class="sidebar-item active" 
                       style="background-color: {selectedTheme.colors.primary}; 
                              color: {selectedTheme.colors.headerText}"></div>
                  <div class="sidebar-item"></div>
                  <div class="sidebar-item"></div>
                </div>
                
                <!-- Main content area with diff view -->
                <div class="preview-app-main">
                  <div class="preview-diff-file-header" 
                       style="border-color: {selectedTheme.colors.border}">
                    File: example.js
                  </div>
                  
                  <!-- Sample diff content -->
                  <div class="preview-diff-content">
                    <div class="diff-line">
                      <span class="line-number">1</span>
                      <span class="line-content">function example() &#123;</span>
                    </div>
                    
                    <div class="diff-line removed" style="background-color: rgba(255, 100, 100, 0.3)">
                      <span class="line-number">2</span>
                      <span class="line-content">  console.log('This is old code');</span>
                    </div>
                    
                    <div class="diff-line added" style="background-color: rgba(100, 255, 100, 0.3)">
                      <span class="line-number">2</span>
                      <span class="line-content">  console.log('This is new code');</span>
                    </div>
                    
                    <div class="diff-line">
                      <span class="line-number">3</span>
                      <span class="line-content">&#125;</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer with actions -->
              <div class="preview-app-footer" 
                   style="background-color: {selectedTheme.colors.headerBackground}; 
                          color: {selectedTheme.colors.headerText}">
                <div class="preview-action-button" 
                     style="background-color: {selectedTheme.colors.buttonBackground}; 
                            color: {selectedTheme.colors.buttonText}">
                  Action
                </div>
              </div>
            </div>
          </div>
        {:else}
          <div class="theme-preview-large no-theme-selected">
            <p>Select a theme from the list to preview</p>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="button button-primary" on:click={applyTheme}>Apply Selected Theme</button>
      <button class="button button-secondary" on:click={closeModal}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  /* Modal backdrop */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--modalOverlay);
    z-index: 1000;
    cursor: pointer;
    animation: fadeIn 0.2s ease-out;
  }
  
  /* Modal container */
  .modal-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 1000px;
    background-color: var(--modalBackground, #1e1e1e);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.25s ease-out;
    max-height: 90vh;
    overflow: hidden; /* Prevent content from overflowing */
  }
  
  /* Modal header */
  .modal-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* Use a consistent dark color for the header regardless of theme */
    background-color: #2d2d30 !important;
    /* Add a subtle border for definition */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  /* Close button */
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #ffffff !important;
    opacity: 0.8;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  
  .close-button:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  /* Modal content */
  .modal-content {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 70vh;
    max-height: calc(90vh - 120px); /* Adjust for header and footer */
  }
  
  /* Split layout for the theme modal */
  .theme-modal-split {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  /* Theme list container (left side) */
  .theme-list-container {
    width: 280px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    background-color: var(--modalBackground);
  }
  
  /* Theme list item */
  .theme-list-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    position: relative;
    border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  }
  
  .theme-list-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .theme-list-item:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.08);
  }
  
  .theme-list-item.active {
    background-color: rgba(77, 144, 254, 0.15);
  }
  
  /* Theme color preview in list */
  .theme-color-preview {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    margin-right: 12px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  
  /* Color grid for theme previews */
  .color-preview-background {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  
  .color-preview-grid {
    position: absolute;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 1px;
    width: 24px;
    height: 24px;
    top: 8px;
    left: 8px;
    border-radius: 3px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
  
  /* Theme section header */
  .theme-section-header {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 10px 16px;
    background-color: var(--background);
    color: var(--textPrimary);
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
  }
  
  /* Theme info in list */
  .theme-list-info {
    flex: 1;
  }
  
  .theme-list-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
  }
  
  /* Selected indicator in list */
  .theme-list-selected-indicator {
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* No themes message */
  .no-themes-message {
    padding: 40px 0;
    text-align: center;
    color: var(--textSecondary);
  }
  
  .no-themes-message p {
    font-size: 16px;
    margin: 0;
  }
  
  /* Large theme preview (right side) */
  .theme-preview-large {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  /* Preview title */
  .preview-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    font-size: 18px;
    font-weight: 600;
  }
  
  .preview-type-indicator {
    font-size: 14px;
    font-weight: normal;
    opacity: 0.7;
  }
  
  /* App window preview */
  .preview-app-window {
    border-radius: 8px;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  /* App header */
  .preview-app-header {
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    justify-content: space-between;
  }
  
  /* Window controls */
  .window-controls {
    display: flex;
    gap: 8px;
  }
  
  .window-control {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .window-control.close {
    background-color: #ff5f57;
  }
  
  .window-control.minimize {
    background-color: #febc2e;
  }
  
  .window-control.maximize {
    background-color: #28c840;
  }
  
  .preview-app-title {
    font-weight: 600;
  }
  
  .preview-app-toolbar {
    display: flex;
    gap: 8px;
  }
  
  .toolbar-button {
    width: 60px;
    height: 24px;
    border-radius: 4px;
  }
  
  /* App content area */
  .preview-app-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  /* App sidebar */
  .preview-app-sidebar {
    width: 64px;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .sidebar-item {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background-color: rgba(127, 127, 127, 0.1);
  }
  
  .sidebar-item.active {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  /* Main content area */
  .preview-app-main {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Diff file header */
  .preview-diff-file-header {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    border-bottom: 1px solid;
  }
  
  /* Diff content */
  .preview-diff-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .diff-line {
    display: flex;
    font-family: monospace;
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .diff-line.removed {
    opacity: 0.9;
  }
  
  .diff-line.added {
    opacity: 0.9;
  }
  
  .line-number {
    min-width: 30px;
    opacity: 0.6;
    user-select: none;
  }
  
  .line-content {
    white-space: pre;
  }
  
  /* Footer */
  .preview-app-footer {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 16px;
  }
  
  .preview-app-footer .preview-action-button {
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
  }
  
  /* Empty state for preview */
  .no-theme-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--textSecondary);
    font-size: 16px;
    border: 2px dashed var(--border, rgba(255, 255, 255, 0.1));
  }
  
  /* Modal footer */
  .modal-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    /* Use consistent styling for footer */
    background-color: #2d2d30 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Footer buttons */
  .modal-footer .button {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  /* Secondary button (Cancel) */
  .modal-footer .button-secondary {
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff !important;
  }
  
  .modal-footer .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .modal-footer .button:focus-visible {
    outline: 2px solid #4d90fe;
    outline-offset: 2px;
  }
  
  /* Primary button (Apply Selected Theme) */
  .modal-footer .button-primary {
    background-color: #4d90fe !important;
    color: white !important;
    border: none;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  .modal-footer .button-primary:hover {
    background-color: #5c9eff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  }
  
  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translate(-50%, -48%);
    }
    to { 
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .theme-modal-split {
      flex-direction: column;
    }
    
    .theme-list-container {
      width: 100%;
      max-height: 200px;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
    
    .theme-list-item {
      padding: 10px 12px;
    }
    
    .theme-color-preview {
      width: 32px;
      height: 32px;
    }
    
    .theme-list-name {
      font-size: 13px;
    }
    
    .preview-title {
      font-size: 16px;
      margin-bottom: 12px;
    }
    
    .modal-footer .button {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
  
  @media (max-width: 576px) {
    .theme-color-preview {
      width: 28px;
      height: 28px;
    }
    
    .preview-app-header {
      height: 36px;
    }
    
    .modal-container {
      width: 95%;
      max-height: 95vh;
    }
    
    .modal-content {
      max-height: calc(95vh - 110px);
    }
    
    .modal-header h2 {
      font-size: 16px;
    }
    
    .preview-app-sidebar {
      width: 48px;
    }
    
    .sidebar-item {
      width: 36px;
      height: 36px;
    }
  }
  
  @media (max-width: 400px) {
    .theme-list-container {
      max-height: 150px;
    }
    
    .modal-footer {
      flex-direction: column-reverse;
      gap: 8px;
    }
    
    .modal-footer .button {
      width: 100%;
      padding: 8px;
    }
  }
</style>
