// src/main/modules/offline-enforcer.js
const { app, net } = require('electron');
const debug = require('debug')('deltavision:offline');

/**
 * Enforces offline mode by disabling auto-updates and intercepting network requests
 * This helps ensure the application works completely offline as per our requirements
 */
function enforceOfflineMode() {
  debug('Setting up offline enforcement');
  
  // Disable auto-updater
  // Safely check if app is defined and has the property
  if (app && typeof app.runningUnderARM64Translation !== 'undefined') { // Check if autoUpdater might exist
    try {
      const { autoUpdater } = require('electron-updater');
      if (autoUpdater) {
        debug('Disabling electron-updater autoUpdater');
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;
      }
    } catch (e) {
      debug('electron-updater not found, no need to disable');
    }
  }

  // Prevent any outgoing requests
  const originalRequest = net.request;
  net.request = function(...args) {
    debug('⚠️ Network request attempted:', args[0]);
    // Return a dummy ClientRequest that errors immediately
    const EventEmitter = require('events');
    const dummyRequest = new EventEmitter();
    setTimeout(() => {
      dummyRequest.emit('error', new Error('Network requests disabled in offline mode'));
    }, 0);
    dummyRequest.end = () => {};
    return dummyRequest;
  };

  // Disable navigator.onLine to always return false in the renderer
  app.on('web-contents-created', (event, webContents) => {
    webContents.executeJavaScript(`
      Object.defineProperty(navigator, 'onLine', {
        get: function() { return false; },
        configurable: true
      });
    `).catch(err => {
      debug('Error overriding navigator.onLine:', err);
    });
  });

  debug('Offline enforcement active');
}

module.exports = { enforceOfflineMode };
