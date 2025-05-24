const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const path = require('path');
const { registerIpcHandlers, masterGetNetworkStatus, masterToggleNetworkServer } = require('./modules/ipc-handlers');
const { enforceOfflineMode } = require('./modules/offline-enforcer');
const { startServer, stopServer, getServerStatus, getLocalIpAddress } = require('./modules/network-server');

// Initialize global application state for sharing with network clients
global.appState = {
  oldFilesDir: '',
  newFilesDir: '',
  keywordsFilePath: '',
  highlightingEnabled: false,
  currentTheme: 'dark'
};

const debug = require('debug')('deltavision:main');
const os = require('os');

// Enable debug logging if --enable-logging flag is present
if (process.argv.includes('--enable-logging')) {
  debug('Debug mode enabled');
  // Log all command line arguments
  debug('Command line arguments:', process.argv);
  // Log app paths
  debug('App path:', app.getAppPath());
  debug('User data path:', app.getPath('userData'));
}

// Enforce offline mode to ensure the app works without an internet connection
debug('Enforcing offline mode');
enforceOfflineMode();

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Network server configuration
let networkServerEnabled = false;
let networkServerPort = 3000;
let networkServerInfo = null;

/**
 * Create the main application window
 */
function createWindow() {
  debug('Creating main window');
  
  // Create the browser window with security-focused configuration
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false, // Don't show the window until ready
    webPreferences: {
      contextIsolation: true, // Isolate the preload script for security
      nodeIntegration: false, // Disable direct Node.js integration for security
      sandbox: true, // Enable sandbox for better security
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Enable web security for better protection
      allowRunningInsecureContent: false, // Block insecure content
      spellcheck: false, // Disable spellcheck which might try to download dictionaries
      disableDialogs: ['certificateError'] // Prevent cert error dialogs that appear when offline
    }
  });
  
  debug('Main window created with ID:', mainWindow.id);

  // Load the index.html file from the renderer build output
  const indexPath = path.join(__dirname, '../renderer/dist/index.html');
  debug('Loading index file from:', indexPath);
  mainWindow.loadFile(indexPath);

  // Wait for the content to be ready before showing the window
  mainWindow.once('ready-to-show', () => {
    debug('Window ready to show, applying security configuration');
    
    // Now apply security configurations after window is ready to show
    configureWindowSecurity(mainWindow);
    
    // Show the window
    mainWindow.show();
    
    // Open DevTools only in development mode or if specifically requested
    if (process.env.NODE_ENV === 'development' || process.argv.includes('--open-devtools')) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window close attempt with confirmation dialog
  mainWindow.on('close', (event) => {
    // Prevent the default close behavior
    event.preventDefault();
    
    debug('Window close attempted, showing confirmation dialog');
    
    // Show confirmation dialog
    const response = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1, // Default to "No"
      title: 'Confirm Exit',
      message: 'Are you sure you want to exit DeltaVision?',
      detail: 'Any unsaved changes will be lost.'
    });
    
    // If user confirms (clicks "Yes")
    if (response === 0) {
      debug('User confirmed exit');
      // Allow the window to close by removing the listener
      mainWindow.removeAllListeners('close');
      mainWindow.close();
    } else {
      debug('User cancelled exit');
      // User clicked "No", do nothing and keep app open
    }
  });
  
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

/**
 * Configure security settings for a window
 * This is moved to a separate function to keep the code organized
 * and to allow deferring this configuration
 */
function configureWindowSecurity(window) {
  debug('Configuring security settings for offline operation');
  
  // Set a strict Content Security Policy for offline operation
  // This restricts the application to only use local resources
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        // Set a strict CSP that blocks all network connections
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " + // Allow inline scripts for Svelte
          "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for Svelte
          "img-src 'self' data:; " + // Allow data URIs for images
          "font-src 'self' data:; " + // Allow embedded fonts
          "connect-src 'none'; " + // Block all network connections
          "media-src 'self'; " +
          "object-src 'none'; " +
          "child-src 'self'; " +
          "frame-src 'self'; " +
          "worker-src 'self'; " +
          "form-action 'self'; " +
          "base-uri 'self';"
        ]
      }
    });
  });
  
  // Configure permission handler to block network-related permissions
  window.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Block network-related permissions, allow file-related ones
    const networkPermissions = [
      'geolocation',
      'notifications',
      'midi',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal'
    ];
    
    // Only allow necessary permissions for offline operation
    callback(!networkPermissions.includes(permission));
  });
  
  // Force direct connections, disable proxy
  window.webContents.session.setProxy({ mode: 'direct' });
  
  // Disable HTTP cache to prevent stale network requests
  // Use the correct API method for this Electron version
  if (typeof window.webContents.session.setCacheEnabled === 'function') {
    window.webContents.session.setCacheEnabled(false);
  } else {
    // Alternative method for older Electron versions
    window.webContents.session.clearCache().catch(err => {
      debug('Error clearing cache:', err);
    });
    // Set cache storage to minimal size
    window.webContents.session.clearStorageData({
      storages: ['appcache', 'filesystem', 'indexdb', 'localstorage', 'cachestorage']
    }).catch(err => {
      debug('Error clearing storage data:', err);
    });
  }
  
  debug('Offline-focused security configuration complete');
}

/**
 * Initialize the application
 */
function initializeApp() {
  debug('Initializing application');
  
  // Create the main window first
  createWindow();
  
  // Register all IPC handlers and pass the mainWindow
  debug('Registering IPC handlers');
  registerIpcHandlers(mainWindow); // mainWindow is passed here

  // Listen for network state changes initiated from ipc-handlers
  ipcMain.on('network-state-changed-from-ipc', (event, newState) => {
    debug('Received network-state-changed-from-ipc in main.js:', newState);
    if (newState) {
      networkServerEnabled = newState.enabled;
      networkServerPort = newState.port;
      networkServerInfo = newState.enabled ? { networkUrl: newState.url, port: newState.port } : null;
      createApplicationMenu(); // Rebuild menu with the new state
    }
  });
  
  // Create application menu with network server toggle
  createApplicationMenu();
  
  debug('Application initialization complete');
}

/**
 * Create the application menu with network server options
 */
function createApplicationMenu() {
  debug('Creating application menu with network options');
  
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Network',
      submenu: [
        {
          label: 'Enable Network Access',
          type: 'checkbox',
          checked: networkServerEnabled,
          click: (menuItem) => {
            toggleNetworkServer(menuItem.checked);
          }
        },
        {
          label: 'Configure Network Port',
          click: () => {
            showNetworkPortDialog();
          }
        },
        { type: 'separator' },
        {
          label: 'Show Network URL',
          click: () => {
            showNetworkUrlDialog();
          },
          enabled: networkServerEnabled
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DeltaVision',
          click: () => {
            // Show a fancy custom modal for About dialog
            const modalPath = path.join(__dirname, '../renderer/about-modal.html');
            let aboutWindow = new BrowserWindow({
              width: 420,
              height: 450,
              parent: mainWindow,
              modal: true,
              resizable: false,
              minimizable: false,
              maximizable: false,
              backgroundColor: '#282c34',
              frame: false,
              show: false,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
              }
            });
            
            // Construct URL with query parameters
            const modalUrl = new URL(`file://${modalPath}`);
            modalUrl.searchParams.append('version', app.getVersion());
            modalUrl.searchParams.append('networkEnabled', networkServerEnabled.toString());
            
            if (networkServerEnabled) {
              const networkUrl = `http://${getLocalIpAddress()}:${networkServerPort}`;
              modalUrl.searchParams.append('networkUrl', networkUrl);
            }
            
            // Load the modal with parameters
            aboutWindow.loadURL(modalUrl.toString());
            
            // Show window when ready
            aboutWindow.once('ready-to-show', () => {
              aboutWindow.show();
            });
            
            // Clean up on close
            aboutWindow.on('closed', () => {
              aboutWindow = null;
            });
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Toggle the network server on/off
 * @param {boolean} enabled - Whether to enable the server
 */
async function toggleNetworkServer(enabled) { // Make async
  debug(`${enabled ? 'Enabling' : 'Disabling'} network server via direct call`);

  try {
    // Call the master function directly from ipc-handlers
    const result = await masterToggleNetworkServer(enabled);

    if (result && result.success && result.status) {
      networkServerEnabled = result.status.enabled;
      networkServerPort = result.status.port;
      networkServerInfo = result.status.url ? { networkUrl: result.status.url, port: result.status.port } : null;

      // Show a fancy custom modal for network status
      const modalPath = path.join(__dirname, '../renderer/network-status-modal.html');
      let networkStatusWindow = new BrowserWindow({
        width: 420,
        height: 340,
        parent: mainWindow,
        modal: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        backgroundColor: '#282c34',
        frame: false,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          preload: path.join(__dirname, 'preload.js')
        }
      });
      
      // Construct URL with query parameters
      const modalUrl = new URL(`file://${modalPath}`);
      modalUrl.searchParams.append('enabled', networkServerEnabled);
      if (networkServerEnabled && networkServerPort) {
        modalUrl.searchParams.append('port', networkServerPort);
      }
      if (networkServerEnabled && networkServerInfo && networkServerInfo.networkUrl) {
        modalUrl.searchParams.append('url', networkServerInfo.networkUrl);
      }
      
      // Load the modal with parameters
      networkStatusWindow.loadURL(modalUrl.toString());
      
      // Show window when ready
      networkStatusWindow.once('ready-to-show', () => {
        networkStatusWindow.show();
      });
      
      // Clean up on close
      networkStatusWindow.on('closed', () => {
        networkStatusWindow = null;
      });
    } else {
      const errorMsg = result && result.error ? result.error : 'Unknown error toggling network server.';
      dialog.showErrorBox('Network Error', `Failed to ${enabled ? 'enable' : 'disable'} network access: ${errorMsg}`);
      // Attempt to sync with actual state from ipc-handlers if call failed
      const actualStatus = masterGetNetworkStatus();
      networkServerEnabled = actualStatus.enabled;
      networkServerPort = actualStatus.port;
      networkServerInfo = actualStatus.url ? { networkUrl: actualStatus.url, port: actualStatus.port } : null;
    }
  } catch (error) {
    dialog.showErrorBox('IPC Error', `Error communicating with network module to ${enabled ? 'enable' : 'disable'} access.\n${error.message}`);
    // Attempt to sync with actual state from ipc-handlers on critical error
    const actualStatus = masterGetNetworkStatus();
    networkServerEnabled = actualStatus.enabled;
    networkServerPort = actualStatus.port;
    networkServerInfo = actualStatus.url ? { networkUrl: actualStatus.url, port: actualStatus.port } : null;
  }
  createApplicationMenu(); // Refresh menu
}

/**
 * Show dialog to configure network port
 */
async function showNetworkPortDialog() {
  // If server is running, show warning that it needs to be restarted
  if (networkServerEnabled) {
    const shouldProceed = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      title: 'Server Restart Required',
      message: 'Changing the port requires restarting the network server.',
      detail: 'Do you want to proceed?',
      buttons: ['Yes', 'No'],
      defaultId: 1
    });
    
    if (shouldProceed === 1) { // 'No' button
      return;
    }
    
    // Stop the server before changing port
    // This should ideally be handled by an IPC call too, but for now, direct stop
    stopServer(); 
    networkServerEnabled = false;
    // The menu will be updated when the port is actually set via IPC
  }

  let currentPort = 3000; // Default port
  try {
    // Get the current port from the authoritative source (ipc-handlers)
    const currentStatus = masterGetNetworkStatus();
    if (currentStatus && typeof currentStatus.port === 'number') {
      currentPort = currentStatus.port;
    }
    debug('Fetched current port for dialog:', currentPort);
  } catch (error) {
    debug('Error fetching network status for port dialog:', error);
    // Proceed with default or last known main.js port if IPC call fails
    currentPort = networkServerPort; 
  }

  // Send IPC message to renderer to open the port input dialog
  if (mainWindow) {
    mainWindow.webContents.send('open-port-input-dialog', currentPort);
  }
}

/**
 * Show dialog with network URL information
 */
function showNetworkUrlDialog() {
  if (!networkServerEnabled || !networkServerInfo) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Network Access',
      message: 'Network access is currently disabled.',
      detail: 'Enable network access from the Network menu to make DeltaVision accessible to other users on your local network.'
    });
    return;
  }
  
  // Show a fancy custom modal for network URL
  const modalPath = path.join(__dirname, '../renderer/network-url-modal.html');
  let networkUrlWindow = new BrowserWindow({
    width: 480,
    height: 500,
    parent: mainWindow,
    modal: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    backgroundColor: '#282c34',
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Construct URL with query parameters
  const modalUrl = new URL(`file://${modalPath}`);
  if (networkServerInfo && networkServerInfo.networkUrl) {
    modalUrl.searchParams.append('url', networkServerInfo.networkUrl);
  }
  
  // Load the modal with parameters
  networkUrlWindow.loadURL(modalUrl.toString());
  
  // Show window when ready
  networkUrlWindow.once('ready-to-show', () => {
    networkUrlWindow.show();
  });
  
  // Clean up on close
  networkUrlWindow.on('closed', () => {
    networkUrlWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(initializeApp);

// On macOS it's common to re-create a window when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
