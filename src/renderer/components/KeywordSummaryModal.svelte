<script>
  import { createEventDispatcher } from 'svelte';
  
  // Event dispatcher for communicating with parent component
  const dispatch = createEventDispatcher();
  
  // Props
  export let show = false;
  export let keywordCategories = [];
  export let activeKeywordFilter = null;
  
  // Close modal
  function closeModal() {
    dispatch('close');
  }
  
  // Handle keyword click
  function handleKeywordClick(keyword) {
    // If the keyword is already active, clicking it again clears the filter
    if (activeKeywordFilter === keyword) {
      dispatch('keywordFilter', { keyword: null });
    } else {
      dispatch('keywordFilter', { keyword });
    }
  }
</script>

<div class="keyword-summary-modal" class:show={show}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Keyword Summary</h2>
      <button class="close-button" on:click={closeModal}>×</button>
    </div>
    
    <div class="modal-body">
      {#if keywordCategories.length === 0}
        <div class="no-keywords">
          <p>No keywords found in the current files.</p>
        </div>
      {:else}
        {#each keywordCategories as category}
          {#if category.keywords.length > 0}
            <div class="category-section">
              <h3 class="category-header" style="background-color: var(--{category.color}, {category.color})">
                {category.name} ({category.keywords.length} keywords)
              </h3>
              
              <div class="keyword-list">
                {#each category.keywords as keyword}
                  <div 
                    class="keyword-item" 
                    class:active={activeKeywordFilter === keyword}
                    on:click={() => handleKeywordClick(keyword)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && handleKeywordClick(keyword)}
                  >
                    <span class="keyword">
                      {keyword}
                    </span>
                    {#if activeKeywordFilter === keyword}
                      <span class="active-indicator">✓</span>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .keyword-summary-modal {
    position: fixed;
    top: 61px; /* Position exactly below the header (header has 12px padding top/bottom + 1px border) */
    right: -400px;
    width: 400px;
    height: calc(100% - 61px); /* Adjust height to account for header */
    background-color: var(--modal-background, #ffffff);
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    transition: right 0.3s ease;
    z-index: 20; /* Higher z-index to ensure it's above the diff headers (which have z-index 10) but below the main header */
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border, #e0e0e0);
  }
  
  .keyword-summary-modal.show {
    right: 0;
  }
  
  .modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
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
    flex: 1;
    background-color: var(--background, #ffffff);
  }
  
  .no-keywords {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: var(--text, #666666);
    font-style: italic;
  }
  
  .category-section {
    margin-bottom: 30px;
    background-color: var(--secondary, #f5f5f5);
    border-radius: 6px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .category-section h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 16px;
    padding: 8px 12px;
    border-radius: 4px;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  }
  
  .keyword-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .keyword-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--secondary, #f5f5f5);
    border-radius: 4px;
    margin-bottom: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .keyword-item:hover {
    background-color: var(--background, #ffffff);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .keyword-item.active {
    background-color: var(--primary, #4a90e2);
    color: white;
    border-left: 3px solid var(--primary-dark, #3a80d2);
  }
  
  .keyword-item.active .keyword {
    color: white;
  }
  
  .active-indicator {
    font-weight: bold;
    color: white;
  }
  
  .keyword {
    font-family: monospace;
    font-weight: 500;
    font-size: 14px;
    color: var(--text, #333333);
  }
</style>
