const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Network server APIs
  onNetworkStatusChanged: (callback) => {
    ipcRenderer.on('network-status-changed', (event, status) => callback(status));
    return () => ipcRenderer.removeListener('network-status-changed', callback);
  },
  // Example API for getting app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Directory and file selection APIs
  selectDirectory: (title) => ipcRenderer.invoke('select-directory', title),
  selectFiles: (title, multiSelections) => ipcRenderer.invoke('select-files', title, multiSelections),
  
  // File comparison APIs
  compareFiles: (oldFilePath, newFilePath, diffMode = 'line') => 
    ipcRenderer.invoke('compare-files', { oldFilePath, newFilePath, diffMode }),
  compareDirectories: (oldDirPath, newDirPath, diffMode = 'line') => 
    ipcRenderer.invoke('compare-directories', oldDirPath, newDirPath, diffMode),
  
  // File watching APIs
  startWatchingDirectories: (oldDirPath, newDirPath) => ipcRenderer.invoke('start-watching-directories', oldDirPath, newDirPath),
  stopWatchingDirectories: () => ipcRenderer.invoke('stop-watching-directories'),
  
  // Event listeners
  onDirectoryChanged: (callback) => {
    ipcRenderer.on('directory-changed', (event, diffResults) => callback(diffResults));
    return () => ipcRenderer.removeListener('directory-changed', callback);
  },
  
  // Keywords highlighting API
  selectKeywordsFile: (title) => ipcRenderer.invoke('select-files', title, false),
  parseKeywordsFile: (filePath) => ipcRenderer.invoke('parse-keywords-file', filePath),
  
  // Search API
  searchFiles: ({ directoryPath, searchTerm, options }) => {
    // Validate input
    if (!directoryPath || !searchTerm) {
      return Promise.reject(new Error('Directory path and search term are required'));
    }
    
    return ipcRenderer.invoke('search:files', { directoryPath, searchTerm, options });
  },
  
  // File content API
  readFileContent: (filePath) => {
    // Validate input
    if (!filePath) {
      return Promise.reject(new Error('File path is required'));
    }
    
    return ipcRenderer.invoke('read-file-content', filePath)
      .then(result => {
        if (result.success) {
          return result.content;
        } else {
          throw new Error(result.error);
        }
      });
  },
  
  // Network server control APIs
  getNetworkStatus: () => ipcRenderer.invoke('get-network-status'),
  toggleNetworkServer: (enabled) => ipcRenderer.invoke('toggle-network-server', enabled),
  setNetworkPort: (port) => ipcRenderer.invoke('set-network-port', port),
  showNetworkUrlDialog: () => ipcRenderer.invoke('show-network-url-dialog'),
  
  // Notes API
  getNotes: () => ipcRenderer.invoke('get-notes'),
  updateNotes: (notes) => ipcRenderer.invoke('update-notes', notes),
  onNotesUpdated: (callback) => {
    ipcRenderer.on('notes-updated', (event, notes) => callback(notes));
    return () => ipcRenderer.removeListener('notes-updated', callback);
  },
  subscribeToNotesUpdates: () => ipcRenderer.send('subscribe-to-notes-updates'),
  
  // Stream View API
  getStreamFiles: (directoryPath) => {
    // Validate input
    if (!directoryPath) {
      return Promise.reject(new Error('Directory path is required'));
    }
    
    return ipcRenderer.invoke('get-stream-files', directoryPath);
  },
  
  // Stream directory watching APIs
  watchStreamDirectory: (directoryPath) => {
    // Validate input
    if (!directoryPath) {
      return Promise.reject(new Error('Directory path is required'));
    }
    
    return ipcRenderer.invoke('watch-stream-directory', directoryPath);
  },
  
  stopWatchingStreamDirectory: () => ipcRenderer.invoke('stop-watching-stream-directory'),
  
  onStreamFileChange: (callback) => {
    ipcRenderer.on('stream-file-change', (event, data) => callback(event, data));
    return () => ipcRenderer.removeListener('stream-file-change', callback);
  },
  
  subscribeToStreamFileChanges: () => ipcRenderer.send('subscribe-to-stream-file-changes'),
  
  handleDirectoryChanged: (callback) => ipcRenderer.on('directory-changed', (event, diffResults) => callback(diffResults)),
  // Expose a listener for opening the port input dialog
  onOpenPortInputDialog: (callback) => ipcRenderer.on('open-port-input-dialog', (event, currentPort) => callback(currentPort)),
  // Cleanup function for the port input dialog listener
  cleanupOpenPortInputDialogListener: () => ipcRenderer.removeAllListeners('open-port-input-dialog'),

  // Keywords API
  selectKeywordsFile: (title) => ipcRenderer.invoke('select-files', title, false),
  parseKeywordsFile: (filePath) => ipcRenderer.invoke('parse-keywords-file', filePath),
});
