<script>
  import { onMount, onDestroy } from 'svelte';
  
  // Props
  export let isOpen = false;
  
  // Event dispatcher
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  // Local state
  let notes = '';
  let isLoading = true;
  let isSaving = false;
  let isWebBrowser = typeof window !== 'undefined' && !window.electronAPI;
  let unsubscribeNotesUpdates;
  let textareaElement;
  let isDirty = false;
  let debounceTimer;
  
  // Function to load notes
  async function loadNotes() {
    isLoading = true;
    
    try {
      if (isWebBrowser) {
        // In web browser, fetch notes from the server
        const response = await fetch('/api/notes');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            notes = data.notes;
          }
        }
      } else {
        // In desktop app, get notes via IPC
        const result = await window.electronAPI.getNotes();
        if (result.success) {
          notes = result.notes;
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // Function to save notes
  async function saveNotes() {
    if (!isDirty) return;
    
    isSaving = true;
    
    try {
      if (isWebBrowser) {
        // In web browser, send notes to the server
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes })
        });
        
        if (response.ok) {
          isDirty = false;
        }
      } else {
        // In desktop app, update notes via IPC
        const result = await window.electronAPI.updateNotes(notes);
        if (result.success) {
          isDirty = false;
        }
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      isSaving = false;
    }
  }
  
  // Handle notes change with debounce
  function handleNotesChange(event) {
    notes = event.target.value;
    isDirty = true;
    
    // Debounce save operation
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      saveNotes();
    }, 1000); // Save after 1 second of inactivity
  }
  
  // Handle external notes updates
  function handleNotesUpdated(updatedNotes) {
    // Only update if the notes are different and the textarea is not focused
    if (notes !== updatedNotes && document.activeElement !== textareaElement) {
      notes = updatedNotes;
      isDirty = false;
    }
  }
  
  // Close the notepad
  function closeNotepad() {
    // Save any unsaved changes before closing
    if (isDirty) {
      saveNotes();
    }
    dispatch('close');
  }
  
  onMount(async () => {
    // Load notes
    await loadNotes();
    
    // Subscribe to notes updates
    if (!isWebBrowser && window.electronAPI) {
      window.electronAPI.subscribeToNotesUpdates();
      unsubscribeNotesUpdates = window.electronAPI.onNotesUpdated(handleNotesUpdated);
    }
  });
  
  onDestroy(() => {
    // Clean up
    clearTimeout(debounceTimer);
    if (unsubscribeNotesUpdates) {
      unsubscribeNotesUpdates();
    }
  });
</script>

<div class="notepad-panel" class:open={isOpen}>
  <div class="notepad-header">
    <h2>Shared Notes</h2>
    <button 
      class="close-button" 
      on:click={closeNotepad}
      aria-label="Close notepad"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
  
  <div class="notepad-content">
    {#if isLoading}
      <div class="loading">Loading notes...</div>
    {:else}
      <textarea 
        bind:this={textareaElement}
        value={notes} 
        on:input={handleNotesChange}
        placeholder="Type your notes here. Notes are shared with all connected users."
        aria-label="Shared notes"
      ></textarea>
      
      {#if isSaving}
        <div class="save-indicator">Saving...</div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .notepad-panel {
    position: fixed;
    top: 60px; /* Below the header */
    right: -400px; /* Start off-screen */
    width: 400px;
    height: calc(100vh - 60px);
    background-color: var(--background, #ffffff);
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease;
    z-index: 100;
    border-left: 1px solid var(--border, #e0e0e0);
  }
  
  .notepad-panel.open {
    right: 0;
  }
  
  .notepad-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: var(--primary, #4a90e2);
    border-bottom: 1px solid var(--border, #e0e0e0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .notepad-header h2 {
    margin: 0;
    font-size: 18px;
    color: white;
    font-weight: 600;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  }
  
  .close-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .notepad-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 16px;
  }
  
  textarea {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: 12px;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 4px;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    background-color: var(--background-secondary, var(--background, #1e1e1e));
    color: var(--text, #e0e0e0);
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--primary, #4a90e2);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary, #666666);
  }
  
  .save-indicator {
    position: absolute;
    bottom: 24px;
    right: 24px;
    background-color: var(--primary, #4a90e2);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0.8;
  }
</style>
