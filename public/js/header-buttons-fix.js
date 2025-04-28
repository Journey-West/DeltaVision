/**
 * Header Buttons Fix
 * 
 * This script ensures proper positioning of the header buttons (settings and theme)
 * and prevents positioning issues that occur on page load and hover.
 */

(function() {
  // Run at highest priority before other scripts
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Header buttons fix initializing...');
    
    // Run immediately 
    fixHeaderButtons();
    
    // And again after a short delay to handle race conditions
    setTimeout(fixHeaderButtons, 100);
    setTimeout(fixHeaderButtons, 500);
    setTimeout(fixHeaderButtons, 1000);
  });
  
  /**
   * Fix header buttons positioning
   */
  function fixHeaderButtons() {
    console.log('Fixing header button positions');
    
    // Fix settings button position
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      console.log('Ensuring settings button is properly positioned');
      Object.assign(settingsButton.style, {
        position: 'absolute',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: '2000',
        display: 'flex',
        alignItems: 'center'
      });
    }
    
    // Fix theme button container position
    const themeButtonContainer = document.querySelector('.theme-button-container');
    if (themeButtonContainer) {
      console.log('Ensuring theme button container is properly positioned');
      Object.assign(themeButtonContainer.style, {
        position: 'absolute',
        top: '50%',
        right: '120px', 
        transform: 'translateY(-50%)',
        zIndex: '2000',
        display: 'block',
        visibility: 'visible',
        opacity: '1'
      });
    }
    
    // Ensure theme button is visible
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      console.log('Ensuring theme toggle is visible');
      Object.assign(themeToggle.style, {
        display: 'flex',
        alignItems: 'center',
        visibility: 'visible',
        opacity: '1'
      });
    }
  }
})();
