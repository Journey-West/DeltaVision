/**
 * Solarized Theme
 * 
 * A scientifically designed theme with carefully selected colors to reduce eye strain.
 * Available in light and dark variants.
 * @see https://ethanschoonover.com/solarized/
 */

const solarizedLightTheme = {
  id: 'solarized-light',
  name: 'Solarized Light',
  colors: {
    background: '#fdf6e3',
    text: '#657b83',
    primary: '#268bd2',
    secondary: '#eee8d5',
    border: '#93a1a1',
    added: '#d8e5c5',
    removed: '#f8d1d0',
    addedText: '#1d4010',
    removedText: '#9b1a19',
    unchanged: '#fdf6e3',
    sidebar: '#eee8d5',
    sidebarText: '#657b83',
    sidebarHover: '#fdf6e3',
    sidebarActive: '#93a1a1',
    headerBackground: '#eee8d5',
    headerText: '#073642',
    buttonBackground: '#268bd2',
    buttonText: '#fdf6e3',
    buttonHover: '#2aa198',
    modalBackground: '#fdf6e3',
    modalOverlay: 'rgba(0, 0, 0, 0.4)',
  }
};

const solarizedDarkTheme = {
  id: 'solarized-dark',
  name: 'Solarized Dark',
  colors: {
    background: '#002b36',
    text: '#839496',
    primary: '#268bd2',
    secondary: '#073642',
    border: '#586e75',
    added: '#2a4004',
    removed: '#6d1a19',
    addedText: '#e3f0c1',
    removedText: '#ffd0cf',
    unchanged: '#002b36',
    sidebar: '#073642',
    sidebarText: '#839496',
    sidebarHover: '#002b36',
    sidebarActive: '#586e75',
    headerBackground: '#073642',
    headerText: '#fdf6e3',
    buttonBackground: '#268bd2',
    buttonText: '#fdf6e3',
    buttonHover: '#2aa198',
    modalBackground: '#002b36',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
  }
};

export { solarizedLightTheme, solarizedDarkTheme };
