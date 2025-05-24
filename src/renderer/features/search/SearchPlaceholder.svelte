<!--
  SearchPlaceholder.svelte
  Component for displaying a placeholder when no search results are available
-->
<script>
  // Props
  export let icon = true;
  export let heading = "Search Files";
  export let message = "Enter a search term and click the search button to find files by name or content.";
</script>

<div class="search-placeholder">
  <div class="placeholder-content">
    {#if icon}
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    {/if}
    <h3>{heading}</h3>
    <p>{message}</p>
  </div>
</div>

<style>
  .search-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 400px;
    padding: 3rem;
    border-radius: 12px;
    background-color: var(--searchPlaceholderBackground);
    box-shadow: 0 2px 8px var(--searchPlaceholderShadow);
    border: 1px solid var(--border);
  }

  .placeholder-content svg {
    color: var(--searchPlaceholderIcon);
    margin-bottom: 2rem;
    opacity: 0.8;
  }

  .placeholder-content h3 {
    color: var(--searchPlaceholderHeading);
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0 0 1.2rem 0;
    letter-spacing: 0.5px;
  }

  .placeholder-content p {
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0;
    color: var(--searchPlaceholderText);
    text-align: center;
    max-width: 320px;
  }
</style>
