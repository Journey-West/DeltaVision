const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const debug = require('debug')('deltavision:network-server');
const crypto = require('crypto');
const { selectFilesToCompare } = require('./file-system-api');
const { compareFilePairs, compareFiles } = require('./file-diff');
const { searchFiles } = require('./file-search');
const { readFileContent } = require('./file-reader');
const { parseKeywordsFile } = require('./file-system-api');
const { getNotes, updateNotes } = require('./notes-manager');

// Store server instance for stopping/restarting
let server = null;
let serverPort = 3000;
// Internal tracking only, not for status display
let isServerRunning = false;

// Cache for directory watching
const directoryCache = new Map();

/**
 * Get the local IP address for network access
 * @returns {string} The first non-internal IPv4 address
 */
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

/**
 * Start the Express server for network access
 * @param {number} port - Port to listen on
 * @param {Object} options - Server options
 * @returns {Object} Server info including URL
 */
function startServer(port = 3000, options = {}) {
  if (isServerRunning) {
    debug('Server already running, stopping first');
    stopServer();
  }

  debug(`Starting network server on port ${port}`);
  serverPort = port;
  
  const app = express();
  
  // Apply middleware
  app.use(cors()); // Allow cross-origin requests
  app.use(express.json()); // Parse JSON request bodies
  
  // Set Content Security Policy headers for web client
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );
    next();
  });
  
  // Serve static files from the renderer dist directory
  const staticPath = path.join(__dirname, '../../renderer/dist');
  debug(`Serving static files from: ${staticPath}`);
  app.use(express.static(staticPath));
  
  // API endpoints that mirror the IPC handlers
  
  // Get app info and current application state
  app.get('/api/app-info', (req, res) => {
    const ipAddress = getLocalIpAddress();
    
    // Get the current application state from the global variables
    const appState = global.appState || {};
    
    res.json({
      networkUrl: `http://${ipAddress}:${serverPort}`,
      isNetworkAccessEnabled: true,
      serverPort,
      appState: {
        oldFilesDir: appState.oldFilesDir || '',
        newFilesDir: appState.newFilesDir || '',
        keywordsFilePath: appState.keywordsFilePath || '',
        highlightingEnabled: appState.highlightingEnabled || false,
        currentTheme: appState.currentTheme || 'dark'
      }
    });
  });
  
  // Directory comparison
  app.post('/api/compare-directories', async (req, res) => {
    try {
      const { oldDirPath, newDirPath, diffMode = 'line' } = req.body;
      
      // Validate inputs
      if (!oldDirPath || !newDirPath) {
        return res.status(400).json({ 
          success: false, 
          error: 'Both old and new directory paths are required' 
        });
      }
      
      debug(`Comparing directories: ${oldDirPath} and ${newDirPath}`);
      
      // Find files to compare
      const filePairs = await selectFilesToCompare(oldDirPath, newDirPath);
      
      // Compare file pairs with specified diff mode
      const diffResults = await compareFilePairs(filePairs.map(pair => ({ ...pair, diffMode })));
      
      res.json({ success: true, diffResults });
    } catch (error) {
      debug('Error in compare-directories endpoint:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Compare individual files
  app.post('/api/compare-files', async (req, res) => {
    try {
      const { oldFilePath, newFilePath, diffMode = 'line' } = req.body;
      
      // Validate inputs
      if (!oldFilePath && !newFilePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'At least one file path is required' 
        });
      }
      
      debug(`Comparing files: ${oldFilePath || 'none'} and ${newFilePath || 'none'}`);
      
      const result = await compareFiles(oldFilePath, newFilePath, diffMode);
      res.json({ success: true, result });
    } catch (error) {
      debug('Error in compare-files endpoint:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Search files
  app.post('/api/search-files', async (req, res) => {
    try {
      debug('Received search-files request with body:', req.body);
      const { directoryPath, searchTerm, options } = req.body;
      
      // Validate inputs
      if (!directoryPath || !searchTerm) {
        debug('Missing required search parameters:', { directoryPath, searchTerm });
        return res.status(400).json({ 
          success: false, 
          error: 'Directory path and search term are required' 
        });
      }
      
      debug(`Searching in ${directoryPath} for "${searchTerm}" with options:`, options);
      
      // Check if directory exists
      try {
        const stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
          debug(`Path is not a directory: ${directoryPath}`);
          return res.status(400).json({
            success: false,
            error: `Path is not a directory: ${directoryPath}`
          });
        }
      } catch (err) {
        debug(`Directory does not exist: ${directoryPath}`, err);
        return res.status(400).json({
          success: false,
          error: `Directory does not exist or not accessible: ${directoryPath}`
        });
      }
      
      // Perform the search
      try {
        const searchResult = await searchFiles(directoryPath, searchTerm, options);
        
        if (searchResult.success) {
          debug(`Search completed with ${searchResult.results.length} results`);
          
          // Sort results by modification time (newest first) to match Stream view behavior
          const sortedResults = searchResult.results.sort((a, b) => {
            const aTime = a.metadata?.modifiedTime ? new Date(a.metadata.modifiedTime) : new Date(0);
            const bTime = b.metadata?.modifiedTime ? new Date(b.metadata.modifiedTime) : new Date(0);
            return bTime - aTime; // Newest first
          });
          
          res.json({ 
            success: true, 
            results: sortedResults,
            stats: searchResult.stats
          });
        } else {
          debug('Search returned an error:', searchResult.error);
          res.status(400).json({ 
            success: false, 
            error: searchResult.error 
          });
        }
      } catch (searchError) {
        debug('Error during search operation:', searchError);
        res.status(500).json({ success: false, error: searchError.message });
      }
    } catch (error) {
      debug('Error in search-files endpoint:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Read file content
  app.post('/api/read-file-content', async (req, res) => {
    try {
      const { filePath } = req.body;
      
      // Validate inputs
      if (!filePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'File path is required' 
        });
      }
      
      debug(`Reading file content: ${filePath}`);
      
      const content = await readFileContent(filePath);
      res.json({ success: true, content });
    } catch (error) {
      debug('Error reading file content:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Parse keywords file
  app.post('/api/parse-keywords-file', async (req, res) => {
    try {
      const { keywordsFilePath } = req.body;
      
      // Validate inputs
      if (!keywordsFilePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'Keywords file path is required' 
        });
      }
      
      debug(`Parsing keywords file: ${keywordsFilePath}`);
      
      const keywords = await parseKeywordsFile(keywordsFilePath);
      
      // Ensure the keywords object has the expected structure
      const formattedKeywords = {
        categories: keywords.categories || [],
        // Include any other properties that might be needed
        filePath: keywordsFilePath
      };
      
      res.json({ success: true, keywords: formattedKeywords });
    } catch (error) {
      debug('Error parsing keywords file:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get notes
  app.get('/api/notes', (req, res) => {
    try {
      const notes = getNotes();
      res.json({ success: true, notes });
    } catch (error) {
      debug('Error getting notes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Update notes
  app.post('/api/notes', async (req, res) => {
    try {
      const { notes } = req.body;
      
      if (notes === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Notes content is required' 
        });
      }
      
      debug('Updating notes');
      const success = await updateNotes(notes);
      
      if (success) {
        // Broadcast to all connected clients that notes have been updated
        if (global.mainWindow) {
          global.mainWindow.webContents.send('notes-updated', notes);
        }
        res.json({ success: true });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to update notes' 
        });
      }
    } catch (error) {
      debug('Error updating notes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // New endpoint to list files for StreamView in browser
  app.get('/api/stream-files', async (req, res) => {
    try {
      const { directoryPath } = req.query;
      if (!directoryPath) {
        return res.status(400).json({
          success: false,
          error: 'directoryPath query parameter is required'
        });
      }

      debug(`Listing files for stream in directory: ${directoryPath}`);
      const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
      const files = dirents.map(dirent => ({
        name: dirent.name,
        path: path.join(directoryPath, dirent.name),
        isDirectory: dirent.isDirectory()
      }));

      res.json({ success: true, files });
    } catch (error) {
      debug('Error in /api/stream-files endpoint:', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Directory not found' });
      } else if (error.code === 'EACCES') {
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // New endpoint to read file content for StreamView in browser
  app.get('/api/stream-file-content', async (req, res) => {
    try {
      const { filePath } = req.query;
      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'filePath query parameter is required'
        });
      }

      debug(`Reading file content for stream view: ${filePath}`);
      
      // Check if file exists and is not a directory
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return res.status(400).json({
          success: false,
          error: 'Path is a directory, not a file'
        });
      }
      
      // Read file content
      const content = await fs.readFile(filePath, 'utf8');
      res.json({
        success: true,
        content,
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      });
    } catch (error) {
      debug('Error in /api/stream-file-content endpoint:', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'File not found' });
      } else if (error.code === 'EACCES') {
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for watching directory changes
  app.get('/api/watch-directory', async (req, res) => {
    try {
      const { directoryPath } = req.query;
      const { etag } = req.headers;
      
      if (!directoryPath) {
        return res.status(400).json({
          success: false,
          error: 'directoryPath query parameter is required'
        });
      }

      debug(`Checking for changes in directory: ${directoryPath}`);

      // Get current directory state
      const dirents = await fs.readdir(directoryPath, { withFileTypes: true });
      const currentState = await Promise.all(
        dirents.map(async dirent => {
          const filePath = path.join(directoryPath, dirent.name);
          try {
            // Get basic stats for all items
            const stats = await fs.stat(filePath);
            return {
              name: dirent.name,
              path: filePath,
              isDirectory: dirent.isDirectory(),
              size: stats.size,
              modified: stats.mtime
            };
          } catch (err) {
            // Skip files we can't access
            return null;
          }
        })
      );

      // Filter out null entries (files we couldn't access)
      const files = currentState.filter(item => item !== null);
      
      // Sort files by modification time (newest first)
      files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      // Create a hash of the current state for ETag
      const stateString = JSON.stringify(files);
      const currentEtag = crypto.createHash('md5').update(stateString).digest('hex');
      
      // Check if client has latest version
      if (etag && etag === `"${currentEtag}"`) {
        // No changes since last request
        return res.status(304).send();
      }
      
      // Get previous state from cache
      const cachedState = directoryCache.get(directoryPath);
      
      // Detect changes
      let changedFiles = [];
      if (cachedState) {
        // Compare with previous state to find changes
        const previousFiles = new Map(cachedState.files.map(f => [f.path, f]));
        
        // Find new or modified files
        changedFiles = files.filter(file => {
          const prevFile = previousFiles.get(file.path);
          if (!prevFile) return true; // New file
          // Check if file was modified
          return new Date(file.modified).getTime() !== new Date(prevFile.modified).getTime() || 
                 file.size !== prevFile.size;
        });
        
        // Find deleted files
        const currentPaths = new Set(files.map(f => f.path));
        const deletedFiles = cachedState.files
          .filter(f => !currentPaths.has(f.path))
          .map(f => ({ ...f, deleted: true }));
        
        changedFiles = [...changedFiles, ...deletedFiles];
      }
      
      // Update cache
      directoryCache.set(directoryPath, {
        etag: currentEtag,
        timestamp: new Date(),
        files: files
      });
      
      // Set ETag header
      res.setHeader('ETag', `"${currentEtag}"`);
      
      // Return results
      res.json({
        success: true,
        files,
        changes: changedFiles,
        timestamp: new Date(),
        hasChanges: changedFiles.length > 0
      });
    } catch (error) {
      debug('Error in /api/watch-directory endpoint:', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ success: false, error: 'Directory not found' });
      } else if (error.code === 'EACCES') {
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Serve the index.html for any other routes to support client-side routing
  // Use a specific path instead of wildcard to avoid path-to-regexp errors
  app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  // Handle other specific routes that might be needed
  app.get('/index.html', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  // Fallback route for any other paths
  app.use((req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  // Start the server
  server = app.listen(port, '0.0.0.0', () => {
    isServerRunning = true;
    const ipAddress = getLocalIpAddress();
    const networkUrl = `http://${ipAddress}:${port}`;
    debug(`Network server running at ${networkUrl}`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    debug('Server error:', error);
    isServerRunning = false;
    server = null;
  });
  
  return {
    isRunning: true,
    port,
    networkUrl: `http://${getLocalIpAddress()}:${port}`
  };
}

/**
 * Stop the Express server
 * @returns {boolean} Success status
 */
function stopServer() {
  if (server) {
    debug('Stopping network server');
    server.close();
    server = null;
    isServerRunning = false;
    return true;
  }
  return false;
}

// Internal function to check if server is running
// Not exposed to renderer
function isServerActive() {
  return isServerRunning;
}

module.exports = {
  startServer,
  stopServer,
  isServerActive,
  getLocalIpAddress
};
