/**
 * Search store for managing search state
 * Handles search term, options, results, and selected file
 */
import { writable, derived } from 'svelte/store';

// Create the core search store
function createSearchStore() {
  const { subscribe, set, update } = writable({
    searchTerm: '',
    searchParams: {
      searchNames: true,
      searchContent: true,
      caseSensitive: false,
      fileTypes: []
    },
    results: [],
    selectedFile: null,
    isSearchActive: false,
    isSearching: false,
    error: null
  });
  
  return {
    subscribe,
    
    // Update search parameters
    setSearchParams: (params) => update(state => ({
      ...state,
      searchTerm: params.searchTerm,
      searchParams: {
        ...state.searchParams,
        searchNames: params.searchNames ?? state.searchParams.searchNames,
        searchContent: params.searchContent ?? state.searchParams.searchContent,
        caseSensitive: params.caseSensitive ?? state.searchParams.caseSensitive,
        fileTypes: params.fileTypes ?? state.searchParams.fileTypes
      }
    })),
    
    // Set search results
    setResults: (results) => update(state => ({
      ...state,
      results,
      isSearchActive: true,
      isSearching: false,
      error: null
    })),
    
    // Set selected file
    setSelectedFile: (file) => update(state => ({
      ...state,
      selectedFile: file
    })),
    
    // Start searching
    startSearch: () => update(state => ({
      ...state,
      isSearching: true,
      error: null
    })),
    
    // Set search error
    setError: (error) => update(state => ({
      ...state,
      error,
      isSearching: false
    })),
    
    // Clear search
    clearSearch: () => update(state => ({
      ...state,
      results: [],
      selectedFile: null,
      isSearchActive: false,
      isSearching: false,
      error: null
    }))
  };
}

// Create derived stores for convenience
export const searchStore = createSearchStore();

// Derived stores for UI convenience
export const hasResults = derived(
  searchStore,
  $searchStore => $searchStore.results.length > 0
);

export const resultCount = derived(
  searchStore,
  $searchStore => $searchStore.results.length
);

export const fileNameResults = derived(
  searchStore,
  $searchStore => $searchStore.results.filter(r => r.matches.inName)
);

export const contentResults = derived(
  searchStore,
  $searchStore => $searchStore.results.filter(r => r.matches.inContent.length > 0)
);

export const isSearching = derived(
  searchStore,
  $searchStore => $searchStore.isSearching
);

export const searchError = derived(
  searchStore,
  $searchStore => $searchStore.error
);
