<script>
  import { onMount, onDestroy } from 'svelte';
  
  // Network status state (only used internally)
  let networkEnabled = false;
  
  // Function to get current network status (without displaying it)
  async function getNetworkStatus() {
    try {
      if (window.electronAPI && window.electronAPI.getNetworkStatus) {
        const status = await window.electronAPI.getNetworkStatus();
        networkEnabled = status.enabled;
      }
    } catch (error) {
      console.error('Error getting network status:', error);
    }
  }
  
  // Function to toggle network server
  async function toggleNetwork() {
    try {
      if (window.electronAPI && window.electronAPI.toggleNetworkServer) {
        if (window.electronAPI.showNetworkUrlDialog) {
          await window.electronAPI.showNetworkUrlDialog();
          // After showing the dialog, update internal state
          await getNetworkStatus();
        }
      }
    } catch (error) {
      console.error('Error toggling network server:', error);
    }
  }
  
  // Set up network status listener
  let unsubscribeNetworkStatus;
  
  onMount(async () => {
    // Get initial network status
    await getNetworkStatus();
    
    // Set up listener for network status changes
    if (window.electronAPI && window.electronAPI.onNetworkStatusChanged) {
      unsubscribeNetworkStatus = window.electronAPI.onNetworkStatusChanged((status) => {
        networkEnabled = status.enabled;
      });
    }
  });
  
  onDestroy(() => {
    // Clean up listener
    if (unsubscribeNetworkStatus) {
      unsubscribeNetworkStatus();
    }
  });
  
  // Handle click event to toggle network
  function handleClick() {
    toggleNetwork();
  }
</script>

<button 
  type="button"
  class="network-indicator"
  class:enabled={networkEnabled}
  on:click={handleClick}
  on:keydown={e => e.key === 'Enter' && handleClick()}
  aria-label="Toggle network access"
  title="Toggle network access"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {#if networkEnabled}
      <!-- Network icon when enabled -->
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <circle cx="12" cy="20" r="2"></circle>
    {:else}
      <!-- Network icon when disabled -->
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    {/if}
  </svg>
</button>

<style>
  .network-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background-color: var(--button-background, #e0e0e0);
    color: var(--button-text, #333);
    cursor: pointer;
    position: relative;
    margin-left: 16px;
    transition: all 0.2s ease;
  }
  
  .network-indicator:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    background-color: var(--button-hover, #d0d0d0);
  }
  
  .network-indicator.enabled {
    background-color: var(--network-enabled-bg, var(--primary, #4a90e2));
    color: var(--network-enabled-text, var(--button-text, white));
  }
  
  .network-indicator.enabled:hover {
    background-color: var(--network-enabled-hover, var(--primaryHover, #3a80d2));
  }
</style>
