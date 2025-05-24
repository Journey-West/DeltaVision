<script>
  import { createEventDispatcher } from 'svelte';
  
  // Toggle states: 0 = Off, 1 = On, 2 = Only Keywords
  export let toggleState = 0;
  export let keywordCategories = [];
  export let activeCategories = [];
  
  $: enabled = toggleState > 0;
  $: onlyKeywords = toggleState === 2;
  
  const dispatch = createEventDispatcher();
  
  // Toggle highlighting
  function toggleKeywords() {
    // Cycle through states: Off -> On -> Only Keywords -> Off
    const newState = (toggleState + 1) % 3;
    dispatch('toggle', { toggleState: newState });
  }
  
  // Toggle a keyword category filter
  function setKeywordFilter(category) {
    // If the category is already active, send null to remove it
    // If not active, send the category to add it
    const isActive = activeCategories.includes(category);
    dispatch('keywordFilterChange', category);
  }
</script>

<div class="keyword-toggle">
  <button 
    class="toggle-button {toggleState > 0 ? 'active' : ''} {toggleState === 2 ? 'only-keywords' : ''}"
    on:click={toggleKeywords}
    aria-label="Toggle keyword highlighting"
  >
    <span class="toggle-label">Keywords: {toggleState === 0 ? 'Off' : toggleState === 1 ? 'On' : 'Only'}</span>
  </button>
  
  {#if enabled && keywordCategories.length > 0}
    <div class="category-filters">
      <span class="filter-label">Filter by:</span>
      <div class="category-buttons">
        {#each keywordCategories as category}
          <button 
            class="category-button"
            class:active={activeCategories.includes(category.name)}
            style="--category-color: var(--{category.color}, {category.color})"
            on:click={() => setKeywordFilter(category.name)}
            title={activeCategories.includes(category.name) ? 'Clear filter' : `Filter by ${category.name}`}
          >
            {category.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .keyword-toggle {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .toggle-button {
    padding: 6px 12px;
    background-color: var(--keywordsButtonBg, var(--button-background, #9ece6a));
    color: #000000 !important;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-weight: normal;
    transition: background-color 0.2s ease, transform 0.1s ease;
  }
  
  /* Directly target the span to ensure text color is black */
  .toggle-button .toggle-label {
    color: #000000 !important;
    font-weight: normal;
  }
  
  .toggle-button:hover:not(.active) {
    background-color: var(--keywordsButtonHover, var(--button-hover, #7fb352));
  }
  
  .toggle-button.active {
    background-color: var(--primary, #4a90e2);
    color: #000000 !important;
    border-color: var(--primary, #4a90e2);
  }
  
  .toggle-button.active .toggle-label {
    color: #000000 !important;
    font-weight: normal;
  }
  
  .toggle-button.only-keywords {
    background-color: var(--warning, #ffc107);
    color: #000000 !important; /* Force black text with !important */
    border-color: var(--warning, #ffc107);
  }
  
  .toggle-button.only-keywords .toggle-label {
    color: #000000 !important;
    font-weight: bold;
  }
  
  .category-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .filter-label {
    font-size: 0.9rem;
    color: var(--textSecondary, #b0b0b0);
    font-weight: 500;
  }
  
  .category-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .category-button {
    padding: 4px 8px;
    background-color: var(--buttonSecondary, var(--secondary, #2d2d2d));
    color: var(--buttonSecondaryText, var(--text, #e0e0e0));
    border: 1px solid var(--border, #3a3a3a);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  
  .category-button:hover {
    border-color: var(--category-color);
    box-shadow: 0 0 0 1px var(--category-color);
  }
  
  .category-button.active {
    background-color: var(--category-color);
    color: white;
    border-color: var(--category-color);
  }
</style>
