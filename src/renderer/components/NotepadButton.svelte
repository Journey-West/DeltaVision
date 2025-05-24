<script>
  // Event dispatcher
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  // Props
  export let isNotepadOpen = false;
  
  // Toggle notepad
  function toggleNotepad() {
    dispatch('toggle');
  }
</script>

<button 
  type="button"
  class="notepad-button"
  class:active={isNotepadOpen}
  on:click={toggleNotepad}
  on:keydown={e => e.key === 'Enter' && toggleNotepad()}
  aria-label="Toggle notepad"
  title="Toggle shared notes"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
</button>

<style>
  .notepad-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 8px;
    border-radius: 4px;
    background-color: var(--notes-button-bg, var(--button-background, #e0e0e0));
    color: black !important;
    border: 1px solid var(--border, transparent);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 8px;
    text-shadow: 0px 1px 1px rgba(255, 255, 255, 0.5);
  }
  
  /* Icon-only button, no text styling needed */
  
  .notepad-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--notes-button-hover, var(--button-hover, #d0d0d0));
  }
  
  .notepad-button.active {
    background-color: var(--notes-button-active-bg, var(--primary, #4a90e2));
    color: black !important;
  }
  
  /* Icon-only button, no text styling needed */
  
  .notepad-button.active:hover {
    background-color: var(--notes-button-active-hover, var(--primaryHover, #3a80d2));
  }
</style>
