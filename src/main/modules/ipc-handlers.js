const { ipcMain, app, dialog } = require('electron');
const { selectDirectory, selectFiles, selectFilesToCompare, parseKeywordsFile } = require('./file-system-api');
const { compareFilePairs, compareFiles } = require('./file-diff');
const { watchDirectory, stopWatching, stopAllWatchers } = require('./file-watcher');
const { searchFiles } = require('./file-search');
const { readFileContent } = require('./file-reader');
const { startServer, stopServer, isServerActive } = require('./network-server'); // Assuming isServerActive is exported
const { initializeNotes, getNotes, updateNotes } = require('./notes-manager');
const { getNewDirectoryFiles } = require('./file-stream-api');

// Store active directory paths for watching
let activeOldDirPath = null;
let activeNewDirPath = null;
let activeStreamDirPath = null;
let mainWindow = null; // Will be set by registerIpcHandlers

// Network server configuration - Single source of truth
let networkServerEnabled = false;
let networkServerPort = 3000;
let networkServerInfo = null;

// Helper function to get the current network status object
function getCurrentNetworkFullStatus() {
  return {
    enabled: networkServerEnabled,
    port: networkServerPort,
    url: networkServerInfo && networkServerInfo.networkUrl ? networkServerInfo.networkUrl : null,
  };
}

// Internal logic for toggling the server
async function _performToggleServer(enable) {
  console.log(`_performToggleServer called with: ${enable}`);
  try {
    if (enable === networkServerEnabled) {
      return { success: true, status: getCurrentNetworkFullStatus() };
    }

    if (enable) {
      networkServerInfo = startServer(networkServerPort);
      if (networkServerInfo && networkServerInfo.isRunning) {
        networkServerEnabled = true;
        console.log('Network server started successfully by _performToggleServer.');
      } else {
        networkServerEnabled = false;
        networkServerInfo = null;
        console.error('_performToggleServer: Failed to start network server.');
        // Notify and return failure
        if (mainWindow) mainWindow.webContents.send('network-state-changed-from-ipc', getCurrentNetworkFullStatus());
        return { success: false, error: 'Failed to start network server.', status: getCurrentNetworkFullStatus() };
      }
    } else {
      const stopped = stopServer();
      networkServerEnabled = false; // Assume stopped even if stopServer returns false (was already stopped)
      networkServerInfo = null;
      console.log(`Network server stop attempt by _performToggleServer (stopped: ${stopped}).`);
    }

    if (mainWindow) mainWindow.webContents.send('network-state-changed-from-ipc', getCurrentNetworkFullStatus());
    return { success: true, status: getCurrentNetworkFullStatus() };

  } catch (error) {
    console.error('Error in _performToggleServer:', error);
    // Try to reflect actual state if possible, then notify
    networkServerEnabled = isServerActive ? isServerActive() : false; 
    networkServerInfo = networkServerEnabled && networkServerInfo ? networkServerInfo : null;
    if (mainWindow) mainWindow.webContents.send('network-state-changed-from-ipc', getCurrentNetworkFullStatus());
    return { success: false, error: error.message, status: getCurrentNetworkFullStatus() };
  }
}

// Internal logic for setting the port
function _performSetPort(port) {
  const newPort = parseInt(port, 10);
  if (isNaN(newPort) || newPort < 1024 || newPort > 65535) {
    return { success: false, error: 'Invalid port number. Must be between 1024 and 65535.', status: getCurrentNetworkFullStatus() };
  }

  const oldPort = networkServerPort;
  networkServerPort = newPort;
  console.log(`_performSetPort: Network port set to ${networkServerPort}`);

  if (networkServerEnabled) {
    console.log('_performSetPort: Server is enabled, restarting with new port.');
    stopServer();
    networkServerInfo = startServer(networkServerPort);
    if (!(networkServerInfo && networkServerInfo.isRunning)) {
      console.error(`_performSetPort: Failed to restart server on new port ${networkServerPort}. Reverting to old port ${oldPort}.`);
      networkServerPort = oldPort;
      networkServerInfo = startServer(networkServerPort);
      if (!(networkServerInfo && networkServerInfo.isRunning)) {
        networkServerEnabled = false;
        networkServerInfo = null;
        console.error('_performSetPort: Critical error - failed to restart server on old port. Disabling server.');
      }
    } else {
      console.log(`_performSetPort: Server restarted successfully on port ${networkServerPort}`);
    }
  }
  if (mainWindow) mainWindow.webContents.send('network-state-changed-from-ipc', getCurrentNetworkFullStatus());
  return { success: true, status: getCurrentNetworkFullStatus() };
}

/**
 * Register all IPC handlers
 * @param {BrowserWindow} window - The main browser window
 */
function registerIpcHandlers(win) {
  mainWindow = win;
  global.mainWindow = win; // For other modules that might need it, if any.
  
  initializeNotes().catch(error => console.error('Error initializing notes manager:', error));
  
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('select-directory', async (event, title) => selectDirectory(title));
  ipcMain.handle('select-files', async (event, title, multiSelections) => selectFiles(title, multiSelections));
  ipcMain.handle('compare-files', async (event, { oldFilePath, newFilePath, diffMode = 'line' }) => {
    try {
      return await compareFiles(oldFilePath, newFilePath, diffMode);
    } catch (error) {
      console.error('Error in compare-files handler:', error);
      return { error: error.message };
    }
  });
  ipcMain.handle('compare-directories', async (event, oldDirPath, newDirPath, diffMode = 'line') => {
    try {
      if (!oldDirPath || !newDirPath) throw new Error('Both old and new directory paths are required');
      activeOldDirPath = oldDirPath;
      activeNewDirPath = newDirPath;
      global.appState.oldFilesDir = oldDirPath;
      global.appState.newFilesDir = newDirPath;
      const filePairs = await selectFilesToCompare(oldDirPath, newDirPath);
      const diffResults = await compareFilePairs(filePairs.map(pair => ({ ...pair, diffMode })));
      setupDirectoryWatchers(oldDirPath, newDirPath);
      return diffResults;
    } catch (error) {
      console.error('Error in compare-directories handler:', error);
      throw error;
    }
  });
  ipcMain.handle('start-watching-directories', async (event, oldDirPath, newDirPath) => {
    try {
      if (!oldDirPath || !newDirPath) throw new Error('Both old and new directory paths are required');
      activeOldDirPath = oldDirPath;
      activeNewDirPath = newDirPath;
      return setupDirectoryWatchers(oldDirPath, newDirPath);
    } catch (error) {
      console.error('Error starting directory watchers:', error);
      return false;
    }
  });
  ipcMain.handle('stop-watching-directories', async () => {
    try {
      stopAllWatchers();
      activeOldDirPath = null;
      activeNewDirPath = null;
      return true;
    } catch (error) {
      console.error('Error stopping directory watchers:', error);
      return false;
    }
  });
  ipcMain.handle('parse-keywords-file', async (event, keywordsFilePath) => {
    try {
      global.appState.keywordsFilePath = keywordsFilePath;
      return await parseKeywordsFile(keywordsFilePath);
    } catch (error) {
      console.error('Error parsing keywords file:', error);
      throw error;
    }
  });
  ipcMain.handle('search:files', async (event, { directoryPath, searchTerm, options }) => {
    try {
      if (!directoryPath || !searchTerm) throw new Error('Directory path and search term are required');
      console.log(`Searching in ${directoryPath} for "${searchTerm}"`);
      return await searchFiles(directoryPath, searchTerm, options);
    } catch (error) {
      console.error('Error in search:files handler:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle('read-file-content', async (event, filePath) => {
    try {
      if (!filePath) throw new Error('File path is required');
      console.log(`Reading file content: ${filePath}`);
      const content = await readFileContent(filePath);
      return { success: true, content };
    } catch (error) {
      console.error('Error reading file content:', error);
      return { success: false, error: error.message };
    }
  });

  // Network server related IPC handlers
  ipcMain.handle('get-network-status', () => getCurrentNetworkFullStatus());
  ipcMain.handle('toggle-network-server', async (event, enable) => _performToggleServer(enable));
  ipcMain.handle('set-network-port', (event, port) => _performSetPort(port));

  ipcMain.handle('show-network-url-dialog', () => {
    // This dialog logic can remain here or be moved to main.js if preferred
    // For now, keeping it here as it's simple dialog display based on current state.
    if (!networkServerEnabled || !networkServerInfo) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Network Access',
        message: 'Network access is currently disabled.',
        detail: 'Enable network access from the Network menu to make FileDiff accessible to other users on your local network.'
      });
      return { success: true, enabled: false };
    }
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Network Access',
      message: 'FileDiff Network Access',
      detail: `Network access is enabled. Users on your local network can access FileDiff.\n\nNote: This only works for users on the same local network and does not require an internet connection.`
    });
    return { success: true, enabled: true };
  });

  // Notes IPC handlers
  ipcMain.handle('get-notes', async () => {
    try {
      return { success: true, notes: getNotes() };
    } catch (error) {
      console.error('Error getting notes:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle('update-notes', async (event, notes) => {
    try {
      const success = await updateNotes(notes);
      if (success) {
        mainWindow.webContents.send('notes-updated', notes);
        return { success: true };
      }
      return { success: false, error: 'Failed to update notes' };
    } catch (error) {
      console.error('Error updating notes:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.on('subscribe-to-notes-updates', (event) => console.log('Renderer process subscribed to notes updates'));
  ipcMain.on('subscribe-to-stream-file-changes', (event) => console.log('Renderer process subscribed to stream file changes'));

  // StreamView related IPC handlers
  ipcMain.handle('get-stream-files', async (event, directoryPath) => {
    try {
      if (!directoryPath) throw new Error('Directory path is required');
      return { success: true, files: await getNewDirectoryFiles(directoryPath) };
    } catch (error) {
      console.error('Error getting files for stream view:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle('watch-stream-directory', async (event, directoryPath) => {
    try {
      if (!directoryPath) throw new Error('Directory path is required');
      activeStreamDirPath = directoryPath;
      const success = watchDirectory(directoryPath, 'stream-dir', (eventType, filePath) => {
        if (mainWindow && activeStreamDirPath) {
          mainWindow.webContents.send('stream-file-change', { type: eventType, path: filePath });
        }
      });
      return { success };
    } catch (error) {
      console.error('Error watching stream directory:', error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle('stop-watching-stream-directory', async () => {
    try {
      const success = stopWatching('stream-dir');
      activeStreamDirPath = null;
      return { success };
    } catch (error) {
      console.error('Error stopping stream directory watcher:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * Set up directory watchers for file changes
 * @param {string} oldDirPath - Path to old files directory
 * @param {string} newDirPath - Path to new files directory
 * @returns {boolean} - Success status
 */
function setupDirectoryWatchers(oldDirPath, newDirPath) {
  try {
    watchDirectory(oldDirPath, 'old-dir', async (eventType, filePath) => {
      if (mainWindow && activeOldDirPath && activeNewDirPath) {
        const filePairs = await selectFilesToCompare(activeOldDirPath, activeNewDirPath);
        const diffResults = await compareFilePairs(filePairs.map(pair => ({ ...pair, diffMode: 'line' })));
        mainWindow.webContents.send('directory-changed', diffResults);
      }
    });
    watchDirectory(newDirPath, 'new-dir', async (eventType, filePath) => {
      if (mainWindow && activeOldDirPath && activeNewDirPath) {
        const filePairs = await selectFilesToCompare(activeOldDirPath, activeNewDirPath);
        const diffResults = await compareFilePairs(filePairs.map(pair => ({ ...pair, diffMode: 'line' })));
        mainWindow.webContents.send('directory-changed', diffResults);
      }
    });
    return true;
  } catch (error) {
    console.error('Error setting up directory watchers:', error);
    return false;
  }
}

// Functions to be called directly by main.js
const masterGetNetworkStatus = () => getCurrentNetworkFullStatus();
const masterToggleNetworkServer = async (enable) => _performToggleServer(enable);
// masterSetNetworkPort is not strictly needed for main.js if port changes are only renderer-initiated,
// but _performSetPort handles the logic if main.js ever needed to set it.

module.exports = {
  registerIpcHandlers,
  masterGetNetworkStatus,
  masterToggleNetworkServer
};
