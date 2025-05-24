import { writable } from 'svelte/store';

// Define available themes
// This makes it easy to add new themes in the future
export const themes = {
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      background: '#ffffff',
      text: '#333333',
      primary: '#4a90e2',
      secondary: '#f5f5f5',
      border: '#e0e0e0',
      added: '#e6ffed',
      removed: '#ffeef0',
      addedText: '#22863a',
      removedText: '#cb2431',
      unchanged: '#ffffff',
      sidebar: '#f8f8f8',
      sidebarText: '#333333',
      sidebarHover: '#e8e8e8',
      sidebarActive: '#e0e0e0',
      headerBackground: '#e8e8e8',
      headerText: '#222222',
      buttonBackground: '#4a90e2',
      buttonText: '#ffffff',
      buttonHover: '#3a80d2',
      modalBackground: '#ffffff',
      modalOverlay: 'rgba(0, 0, 0, 0.5)',
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: '#1e1e1e',
      text: '#e0e0e0',
      primary: '#4a90e2',
      secondary: '#2d2d2d',
      border: '#3a3a3a',
      added: '#133929',
      removed: '#3b1d26',
      addedText: '#85e89d',
      removedText: '#f97583',
      unchanged: '#1e1e1e',
      sidebar: '#252525',
      sidebarText: '#e0e0e0',
      sidebarHover: '#333333',
      sidebarActive: '#3a3a3a',
      headerBackground: '#252525',
      headerText: '#e0e0e0',
      buttonBackground: '#4a90e2',
      buttonText: '#ffffff',
      buttonHover: '#3a80d2',
      modalBackground: '#2d2d2d',
      modalOverlay: 'rgba(0, 0, 0, 0.7)',
    }
  },
  // Add more themes here in the future
  // Example:
  // blue: {
  //   id: 'blue',
  //   name: 'Blue',
  //   colors: { ... }
  // }
};

// Get the initial theme from localStorage or default to light
const getInitialTheme = () => {
  if (typeof localStorage !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes[savedTheme] ? themes[savedTheme] : themes.light;
  }
  return themes.light;
};

// Create the theme store
const createThemeStore = () => {
  const { subscribe, set, update } = writable(getInitialTheme());

  return {
    subscribe,
    setTheme: (themeId) => {
      if (themes[themeId]) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', themeId);
        }
        set(themes[themeId]);
      }
    },
    toggleDarkMode: () => {
      update(currentTheme => {
        const newTheme = currentTheme.id === 'light' ? themes.dark : themes.light;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', newTheme.id);
        }
        return newTheme;
      });
    }
  };
};

export const theme = createThemeStore();
