<script>
  // Props
  export let size = 'medium'; // small, medium, large
</script>

<div class="loading-spinner {size}"></div>

<style>
  .loading-spinner {
    display: inline-block;
    border-radius: 50%;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--primary, #4a90e2);
    animation: spin 1s ease-in-out infinite;
  }
  
  .small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
  
  .medium {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }
  
  .large {
    width: 48px;
    height: 48px;
    border-width: 4px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
