<script>
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let currentPort = 3000;

  const dispatch = createEventDispatcher();

  let newPortNumber = currentPort;
  let errorMessage = '';

  function validateAndSubmit() {
    const port = parseInt(newPortNumber);
    if (isNaN(port) || port < 1024 || port > 65535) {
      errorMessage = 'Invalid port. Must be between 1024 and 65535.';
      return;
    }
    errorMessage = '';
    if (window.electronAPI && window.electronAPI.setNetworkPort) {
      window.electronAPI.setNetworkPort(port)
        .then(() => {
          dispatch('close');
        })
        .catch(err => {
          console.error('Error setting port via API:', err);
          errorMessage = err.message || 'Failed to set port.';
        });
    } else {
      console.error('setNetworkPort API not available');
      errorMessage = 'API for setting port is not available.';
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  // Reset when shown
  $: if (show) {
    newPortNumber = currentPort;
    errorMessage = '';
  }
</script>

{#if show}
<div class="modal-overlay">
  <div class="modal-container port-input-dialog">
    <div class="modal-header">
      <h2>Configure Network Port</h2>
    </div>
    <div class="modal-body">
      <p>Enter network port number:</p>
      <p class="current-port-info">Current port: {currentPort}</p>
      <div class="form-group">
        <label for="newPortInput">New Port (1024-65535):</label>
        <input 
          type="number" 
          id="newPortInput" 
          bind:value={newPortNumber} 
          min="1024" 
          max="65535"
          placeholder="Enter port"
        />
      </div>
      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}
    </div>
    <div class="modal-footer">
      <button class="button-secondary" on:click={handleCancel}>Cancel</button>
      <button class="button-primary" on:click={validateAndSubmit}>OK</button>
    </div>
  </div>
</div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--modal-overlay, rgba(0, 0, 0, 0.6));
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050; /* Higher than settings modal */
  }

  .port-input-dialog {
    background-color: var(--modal-background, #ffffff);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    width: 380px;
    max-width: 90%;
    border: 1px solid var(--border, #ccc);
  }

  .modal-header {
    padding: 12px 15px;
    border-bottom: 1px solid var(--border, #e0e0e0);
    background-color: var(--header-background, #f0f0f0);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 16px;
    color: var(--header-text, #333333);
  }

  .modal-body {
    padding: 15px;
    color: var(--text, #333333);
  }
  
  .current-port-info {
    font-size: 0.9em;
    color: var(--text-muted, #666);
    margin-bottom: 10px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 0.9em;
  }

  .form-group input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--border, #ccc);
    border-radius: 3px;
    font-size: 14px;
    box-sizing: border-box;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
  }

  .error-message {
    color: var(--error-text, #d9534f);
    font-size: 0.9em;
    margin-top: 10px;
  }

  .modal-footer {
    padding: 12px 15px;
    border-top: 1px solid var(--border, #e0e0e0);
    display: flex;
    justify-content: flex-end;
    background-color: var(--header-background, #f0f0f0);
  }

  .modal-footer button {
    padding: 8px 15px;
    margin-left: 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid transparent;
  }

  .button-primary {
    background-color: var(--button-primary-bg, #007bff);
    color: var(--button-primary-text, white);
    border-color: var(--button-primary-bg, #007bff);
  }
  .button-primary:hover {
    background-color: var(--button-primary-hover-bg, #0056b3);
  }

  .button-secondary {
    background-color: var(--button-secondary-bg, #6c757d);
    color: var(--button-secondary-text, white);
    border-color: var(--button-secondary-bg, #6c757d);
  }
  .button-secondary:hover {
    background-color: var(--button-secondary-hover-bg, #545b62);
  }
</style>
