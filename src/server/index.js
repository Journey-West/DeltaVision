const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const writeFileAsync = promisify(fs.writeFile);

const app = express();
const PORT = 3000;

// Default folder paths will be empty until user configures them
let oldFolderPath = "";
let newFolderPath = "";
let keywordFilePath = ""; // Path to the keywords file

// Config file path
const configFilePath = path.join(process.cwd(), 'folder-config.json');

// Load saved folder paths if they exist
async function loadFolderConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const configData = await readFileAsync(configFilePath, 'utf8');
      const config = JSON.parse(configData);
      if (config.oldFolderPath && config.newFolderPath) {
        oldFolderPath = config.oldFolderPath;
        newFolderPath = config.newFolderPath;
        console.log('Loaded folder configuration:');
        console.log(`Old folder: ${oldFolderPath}`);
        console.log(`New folder: ${newFolderPath}`);
      }
      
      // Load keyword file path if it exists
      if (config.keywordFilePath) {
        keywordFilePath = config.keywordFilePath;
        console.log(`Keyword file: ${keywordFilePath}`);
        
        // Load keywords from file
        await loadKeywordsFromFile();
      }
    } else {
      // Create default config with empty paths
      await saveFolderConfig("", "", "");
    }
  } catch (error) {
    console.error('Error loading folder configuration:', error);
  }
}

// Save folder configuration
async function saveFolderConfig(oldPath, newPath, keywordPath) {
  try {
    const config = {
      oldFolderPath: oldPath,
      newFolderPath: newPath,
      keywordFilePath: keywordPath
    };
    await writeFileAsync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    console.log('Folder configuration saved');
  } catch (error) {
    console.error('Error saving folder configuration:', error);
  }
}

// Set up watcher with initial config
let watcher = null;

function setupWatcher(folderPath) {
  if (watcher) {
    watcher.close();
  }
  
  // Only setup watcher if folderPath is provided and exists
  if (folderPath && fs.existsSync(folderPath)) {
    watcher = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => console.log(`File ${path} has been added`))
      .on('change', path => console.log(`File ${path} has been changed`))
      .on('unlink', path => console.log(`File ${path} has been removed`));
      
    console.log(`Watching for file changes in ${folderPath}`);
  } else {
    console.log('Folder watcher not set up - waiting for folder configuration');
  }
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.json());

// Function to extract command part before double underscore
function extractCommand(filename) {
  const parts = filename.split('__');
  return parts[0];
}

// Function to extract command ran from the first line of the file
async function extractCommandRan(filePath) {
  try {
    const data = await readFileAsync(filePath, 'utf8');
    const firstLine = data.split('\n')[0];
    
    // Extract command ran part from the line
    // Format is typically: DATE TIME "command ran"
    const match = firstLine.match(/"([^"]+)"/);
    return match ? match[1] : null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Function to get all files from a directory with their metadata
async function getFilesWithMetadata(dirPath) {
  try {
    // Check if directory exists
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.warn(`Directory ${dirPath} does not exist or is not set`);
      return [];
    }

    const files = await readdirAsync(dirPath);
    
    const intermediateFileData = await Promise.all(
      files
        .filter(file => file.includes('__') && file.endsWith('.txt'))
        .map(async (file) => {
          const filePath = path.join(dirPath, file);
          const command = extractCommand(file);
          const commandRan = await extractCommandRan(filePath);
          const stats = await statAsync(filePath);
          
          return {
            filename: file,
            path: filePath,
            command,
            commandRan,
            content: await readFileAsync(filePath, 'utf8'),
            mtime: stats.mtime.getTime() // Add modification time as timestamp
          };
        })
    );
    
    // Filter out files that don't have a valid command in their first line
    const fileData = intermediateFileData.filter(file => file.commandRan !== null);
    
    return fileData;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// API endpoint to get current folder configurations
app.get('/api/folders', (req, res) => {
  res.json({
    oldFolderPath,
    newFolderPath,
    keywordFilePath,
    keywordCount: Object.keys(keywordHighlights).length,
    scrollToTopEnabled: true // Default to true for new installs
  });
});

// API endpoint to update folder configurations
app.post('/api/folders', async (req, res) => {
  try {
    const { oldFolder, newFolder, keywordFile } = req.body;

    if (!oldFolder || !newFolder) {
      return res.status(400).json({ error: 'Both oldFolder and newFolder are required' });
    }

    // Validate if directories exist
    if (!fs.existsSync(oldFolder)) {
      return res.status(400).json({ error: `Old folder ${oldFolder} does not exist` });
    }

    if (!fs.existsSync(newFolder)) {
      return res.status(400).json({ error: `New folder ${newFolder} does not exist` });
    }
    
    // Validate keyword file if provided
    if (keywordFile && !fs.existsSync(keywordFile)) {
      return res.status(400).json({ error: `Keyword file ${keywordFile} does not exist` });
    }

    // Update folder paths
    oldFolderPath = oldFolder;
    newFolderPath = newFolder;
    
    // Update keyword file path
    keywordFilePath = keywordFile || "";
    
    if (keywordFilePath) {
      await loadKeywordsFromFile();
    } else {
      // Clear keywords if no file is specified
      keywordHighlights = {};
    }

    // Save new configuration
    await saveFolderConfig(oldFolderPath, newFolderPath, keywordFilePath);

    // Update watcher
    setupWatcher(newFolderPath);

    res.json({
      message: 'Folder paths updated successfully',
      oldFolderPath,
      newFolderPath,
      keywordFilePath,
      keywordCount: Object.keys(keywordHighlights).length
    });
  } catch (error) {
    console.error('Error updating folder paths:', error);
    res.status(500).json({ error: 'Failed to update folder paths' });
  }
});

// API endpoint to get all matched files
app.get('/api/files', async (req, res) => {
  try {
    // If folders are not configured yet, return empty array
    if (!oldFolderPath || !newFolderPath) {
      return res.json([]);
    }

    const oldFiles = await getFilesWithMetadata(oldFolderPath);
    const newFiles = await getFilesWithMetadata(newFolderPath);
    
    // Match files based on command and commandRan
    const matchedFiles = [];
    
    oldFiles.forEach(oldFile => {
      const matchingNewFiles = newFiles.filter(newFile => 
        newFile.command === oldFile.command && 
        newFile.commandRan === oldFile.commandRan
      );
      
      matchingNewFiles.forEach(newFile => {
        matchedFiles.push({
          oldFile: {
            filename: oldFile.filename,
            path: oldFile.path,
            mtime: oldFile.mtime
          },
          newFile: {
            filename: newFile.filename,
            path: newFile.path,
            mtime: newFile.mtime
          },
          command: oldFile.command,
          commandRan: oldFile.commandRan,
          // Use the newer file's timestamp for sorting
          timestamp: Math.max(oldFile.mtime, newFile.mtime)
        });
      });
    });
    
    // Sort files by timestamp (newest first)
    matchedFiles.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json(matchedFiles);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// API endpoint to get content of two files for comparison
app.get('/api/compare', async (req, res) => {
  try {
    const { oldPath, newPath } = req.query;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Both oldPath and newPath are required' });
    }
    
    const [oldContent, newContent] = await Promise.all([
      readFileAsync(oldPath, 'utf8'),
      readFileAsync(newPath, 'utf8')
    ]);
    
    res.json({
      oldContent,
      newContent
    });
  } catch (error) {
    console.error('Error comparing files:', error);
    res.status(500).json({ error: 'Failed to compare files' });
  }
});

// API endpoint to get time-based comparisons from just New folder
app.get('/api/time-comparisons', async (req, res) => {
  try {
    // If New folder is not configured yet, return empty array
    if (!newFolderPath) {
      return res.json([]);
    }

    // Get all files from New folder with metadata
    const newFiles = await getFilesWithMetadata(newFolderPath);
    
    // Group files by command and commandRan
    const groupedCommands = {};
    
    newFiles.forEach(file => {
      const key = `${file.command}__${file.commandRan}`;
      if (!groupedCommands[key]) {
        groupedCommands[key] = [];
      }
      groupedCommands[key].push(file);
    });
    
    // Create comparisons for commands that have multiple executions
    const timeComparisons = [];
    
    Object.keys(groupedCommands).forEach(key => {
      const fileGroup = groupedCommands[key];
      
      // Only include if there are at least 2 files to compare
      if (fileGroup.length >= 2) {
        // Sort by timestamp (newest first)
        fileGroup.sort((a, b) => b.mtime - a.mtime);
        
        // Create comparison between newest and second newest
        timeComparisons.push({
          newerFile: {
            filename: fileGroup[0].filename,
            path: fileGroup[0].path,
            mtime: fileGroup[0].mtime
          },
          olderFile: {
            filename: fileGroup[1].filename,
            path: fileGroup[1].path,
            mtime: fileGroup[1].mtime
          },
          command: fileGroup[0].command,
          commandRan: fileGroup[0].commandRan,
          timestamp: fileGroup[0].mtime,
          // Calculate time difference
          timeDiff: formatTimeDifference(fileGroup[0].mtime - fileGroup[1].mtime)
        });
      }
    });
    
    // Sort by timestamp (newest first)
    timeComparisons.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json(timeComparisons);
  } catch (error) {
    console.error('Error getting time-based comparisons:', error);
    res.status(500).json({ error: 'Failed to get time-based comparisons' });
  }
});

// Store keywords for highlighting
let keywordHighlights = {};

// Function to load keywords from file
async function loadKeywordsFromFile() {
  try {
    if (keywordFilePath && fs.existsSync(keywordFilePath)) {
      const fileContent = await readFileAsync(keywordFilePath, 'utf8');
      
      // Parse the keyword file (format: keyword:color)
      const newKeywords = {};
      const lines = fileContent.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.includes(':')) {
          const [keyword, color] = trimmedLine.split(':');
          if (keyword && color) {
            newKeywords[keyword.trim().toLowerCase()] = color.trim();
          }
        }
      });
      
      // Update keywords
      keywordHighlights = newKeywords;
      console.log(`Loaded ${Object.keys(keywordHighlights).length} keywords from ${keywordFilePath}`);
    } else if (keywordFilePath) {
      console.log(`Keyword file not found: ${keywordFilePath}`);
    }
  } catch (error) {
    console.error('Error loading keywords from file:', error);
  }
}

// API endpoint to get current keywords
app.get('/api/keywords', (req, res) => {
  res.json(keywordHighlights);
});

// API endpoint to upload keyword highlighting file
app.post('/api/keywords', express.text(), async (req, res) => {
  try {
    const fileContent = req.body;
    
    // Parse the keyword file (format: keyword:color)
    const newKeywords = {};
    const lines = fileContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.includes(':')) {
        const [keyword, color] = trimmedLine.split(':');
        if (keyword && color) {
          newKeywords[keyword.trim().toLowerCase()] = color.trim();
        }
      }
    });
    
    // Update keywords
    keywordHighlights = newKeywords;
    
    res.json({
      message: 'Keywords updated successfully',
      count: Object.keys(keywordHighlights).length
    });
  } catch (error) {
    console.error('Error uploading keywords:', error);
    res.status(500).json({ error: 'Failed to process keyword file' });
  }
});

// Helper function to format time difference in a human-readable way
function formatTimeDifference(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

// Initialize the application
async function initApp() {
  // Load saved folder configuration
  await loadFolderConfig();
  
  // Start the watcher if newFolderPath is configured
  if (newFolderPath) {
    setupWatcher(newFolderPath);
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    if (newFolderPath) {
      console.log(`Watching for file changes in ${newFolderPath}`);
    } else {
      console.log('Waiting for folder configuration...');
    }
  });
}

// Start the application
initApp();
