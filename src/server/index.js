const express = require('express');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { promisify } = require('util');
const componentLoader = require('./component-loader');
const http = require('http');
const socketIo = require('socket.io');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const writeFileAsync = promisify(fs.writeFile);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected to socket');
  
  // Send initial data to newly connected clients
  socket.emit('server-status', { status: 'connected' });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from socket');
  });
});

// Default folder paths will be empty until user configures them
let oldFolderPath = "";
let newFolderPath = "";
let keywordFilePath = ""; // Path to the keywords file

// Config file path
const configFilePath = path.join(process.cwd(), 'folder-config.json');

// Load saved folder paths if they exist
async function loadFolderConfig() {
  try {
    console.log('Loading folder configuration from:', configFilePath);
    if (fs.existsSync(configFilePath)) {
      const configData = await readFileAsync(configFilePath, 'utf8');
      console.log('Raw config data:', configData);
      const config = JSON.parse(configData);
      
      // Update oldFolderPath - allow it to be empty for new-only mode
      oldFolderPath = config.oldFolderPath !== undefined ? config.oldFolderPath : '';
      
      // Update newFolderPath - required
      if (config.newFolderPath) {
        newFolderPath = config.newFolderPath;
      }
      
      console.log('Loaded folder configuration:');
      console.log(`Old folder: ${oldFolderPath || '(empty - new-only mode)'}`);
      console.log(`New folder: ${newFolderPath}`);
      
      // Load keyword file path if it exists
      if (config.keywordFilePath) {
        keywordFilePath = config.keywordFilePath;
        console.log(`Keyword file: ${keywordFilePath}`);
        
        // Load keywords from file
        await loadKeywordsFromFile();
      }
    } else {
      console.log('No config file found - creating default empty config');
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
      .on('add', async path => {
        console.log(`File ${path} has been added`);
        // Emit socket event with a small delay to ensure file is fully written
        setTimeout(async () => {
          // Collect updated file list and emit to all connected clients
          try {
            io.emit('file-added', { path, timestamp: new Date().toISOString() });
          } catch (err) {
            console.error('Error emitting file-added event:', err);
          }
        }, 500); // Small delay to ensure file is fully written
      })
      .on('change', path => {
        console.log(`File ${path} has been changed`);
        io.emit('file-changed', { path, timestamp: new Date().toISOString() });
      })
      .on('unlink', path => {
        console.log(`File ${path} has been removed`);
        io.emit('file-removed', { path, timestamp: new Date().toISOString() });
      });
      
    console.log(`Watching for file changes in ${folderPath}`);
  } else {
    console.log('Folder watcher not set up - waiting for folder configuration');
  }
}

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
    
    // First try the quoted format: DATE TIME "command ran"
    const quoteMatch = firstLine.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }
    
    // If no quotes, try extracting the first line as-is (trimmed)
    if (firstLine && firstLine.trim()) {
      // If it's a long line, truncate it
      const trimmedLine = firstLine.trim();
      if (trimmedLine.length > 50) {
        return trimmedLine.substring(0, 47) + '...';
      }
      return trimmedLine;
    }
    
    // If both approaches fail, use the filename
    const filename = path.basename(filePath);
    // Remove the __test.txt or similar suffix
    const parts = filename.split('__');
    if (parts.length > 1) {
      return parts[0];
    }
    
    return filename;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return path.basename(filePath); // Fallback to filename
  }
}

// Function to get all files from a directory with their metadata
async function getFilesWithMetadata(dirPath, showAllFiles = false) {
  try {
    // Check if directory exists
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.log(`Directory not found: ${dirPath}`);
      return [];
    }

    console.time('getFilesWithMetadata');
    const files = await readdirAsync(dirPath);
    console.log(`Found ${files.length} total files/directories in ${dirPath}`);
    
    // Process all files in parallel for better performance
    const filePromises = files
      .filter(file => !file.startsWith('.')) // Skip hidden files
      .map(async (file) => {
        try {
          const filePath = path.join(dirPath, file);
          const stats = await statAsync(filePath);
          
          // Skip directories
          if (stats.isDirectory()) return null;
          
          const filename = file;
          let command = filename;
          let commandRan = '';
          
          // Try to extract command info for comparison files
          if (filename.includes('__')) {
            command = extractCommand(filename);
          }
          
          // Extract command ran from first line
          try {
            commandRan = await extractCommandRan(filePath);
          } catch (error) {
            console.log(`Error extracting command from ${filePath}: ${error.message}`);
            // Use filename as fallback
            commandRan = filename;
          }
          
          return {
            filename,
            path: filePath,
            command,
            commandRan,
            mtime: stats.mtimeMs
          };
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          return null;
        }
      });
    
    // Wait for all file processing to complete in parallel
    const results = await Promise.all(filePromises);
    
    // Filter out null results (from directories or errors)
    const validResults = results.filter(result => result !== null);
    
    console.timeEnd('getFilesWithMetadata');
    console.log(`Processed ${validResults.length} valid files from ${dirPath}`);
    
    return validResults;
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
    console.log('=== /api/files endpoint called ===');
    // If new folder is not configured, return empty array
    if (!newFolderPath) {
      console.log('New folder path not configured, returning empty array');
      return res.json([]);
    }

    // If old folder is not configured, show all files in the new folder
    const showAllFiles = !oldFolderPath;
    
    console.log('oldFolderPath:', oldFolderPath ? oldFolderPath : '(empty)');
    console.log('newFolderPath:', newFolderPath); 
    console.log('showAllFiles:', showAllFiles);
    
    const newFiles = await getFilesWithMetadata(newFolderPath, showAllFiles);
    console.log(`Found ${newFiles.length} files in new folder`);
    
    const matchedFiles = [];
    
    // If old folder is not configured, show all new files as "new only"
    if (!oldFolderPath) {
      console.log('Running in new-only mode, adding all files from new folder');
      
      newFiles.forEach(newFile => {
        matchedFiles.push({
          oldFile: null, // Indicates "new only" file
          newFile: {
            filename: newFile.filename,
            path: newFile.path,
            mtime: newFile.mtime
          },
          command: newFile.command,
          commandRan: newFile.commandRan,
          timestamp: newFile.mtime,
          fileType: 'new-only' // Special file type for new-only files
        });
      });
      
      console.log(`Added ${matchedFiles.length} files to the result`);
    } else {
      // Normal case: match files between old and new directories
      const oldFiles = await getFilesWithMetadata(oldFolderPath);
      
      // Group old files by command and commandRan
      const oldFileGroups = {};
      oldFiles.forEach(oldFile => {
        const key = `${oldFile.command}|${oldFile.commandRan}`;
        if (!oldFileGroups[key]) {
          oldFileGroups[key] = [];
        }
        oldFileGroups[key].push(oldFile);
      });
      
      // For each group, select only the most recent old file
      const uniqueOldFiles = [];
      Object.values(oldFileGroups).forEach(group => {
        // Sort by modification time (newest first)
        group.sort((a, b) => b.mtime - a.mtime);
        // Take only the most recent file from each group
        uniqueOldFiles.push(group[0]);
      });
      
      // Process the unique old files (most recent from each group)
      uniqueOldFiles.forEach(oldFile => {
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
            timestamp: Math.max(oldFile.mtime, newFile.mtime),
            fileType: 'comparison' // Regular comparison file
          });
        });
      });
      
      // Also include new files that don't have a matching old file
      // Only check against the unique (most recent) old files we selected
      const unmatchedNewFiles = newFiles.filter(newFile => 
        !uniqueOldFiles.some(oldFile => 
          oldFile.command === newFile.command && 
          oldFile.commandRan === newFile.commandRan
        )
      );
      
      unmatchedNewFiles.forEach(newFile => {
        matchedFiles.push({
          oldFile: null,
          newFile: {
            filename: newFile.filename,
            path: newFile.path,
            mtime: newFile.mtime
          },
          command: newFile.command,
          commandRan: newFile.commandRan,
          timestamp: newFile.mtime,
          fileType: 'new-only'
        });
      });
      
      // Add old-only files (files that exist only in the old directory)
      // Only check against the unique (most recent) old files we selected
      const unmatchedOldFiles = uniqueOldFiles.filter(oldFile => 
        !newFiles.some(newFile => 
          newFile.command === oldFile.command && 
          newFile.commandRan === oldFile.commandRan
        )
      );
      
      unmatchedOldFiles.forEach(oldFile => {
        matchedFiles.push({
          oldFile: {
            filename: oldFile.filename,
            path: oldFile.path,
            mtime: oldFile.mtime
          },
          newFile: null,
          command: oldFile.command,
          commandRan: oldFile.commandRan,
          timestamp: oldFile.mtime,
          fileType: 'old-only'
        });
      });
    }
    
    // Sort files by timestamp (newest first)
    matchedFiles.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json(matchedFiles);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// API endpoint to get all matched files
app.get('/api/compare', async (req, res) => {
  try {
    let { oldPath, newPath } = req.query;
    
    // Only require one path - allow comparing a new file with nothing or an old file with nothing
    if (!oldPath && !newPath) {
      return res.status(400).json({ error: 'At least one of oldPath or newPath is required' });
    }

    // Add very detailed debugging
    console.log('Compare endpoint called with:');
    console.log('Original oldPath:', oldPath);
    console.log('Original newPath:', newPath);
    console.log('Files exist check:');
    
    if (oldPath) {
      console.log(`oldPath exists: ${fs.existsSync(oldPath)}`);
    }
    
    if (newPath) {
      console.log(`newPath exists: ${fs.existsSync(newPath)}`);
    }
    
    // Don't try to fix the paths - the frontend is already sending the correct paths
    // Just use the paths as-is
    
    let oldContent = '';
    let newContent = '';
    
    // Load file contents
    if (oldPath) {
      try {
        console.log(`Attempting to read oldPath: ${oldPath}`);
        // First check if file exists
        if (!fs.existsSync(oldPath)) {
          throw new Error(`File does not exist: ${oldPath}`);
        }
        oldContent = await readFileAsync(oldPath, 'utf8');
        console.log(`Successfully read oldContent, length: ${oldContent.length}`);
      } catch (error) {
        console.error(`Error reading oldPath ${oldPath}:`, error);
        return res.status(404).json({ error: `Old file not found or cannot be read: ${error.message}` });
      }
    }
    
    if (newPath) {
      try {
        console.log(`Attempting to read newPath: ${newPath}`);
        // First check if file exists
        if (!fs.existsSync(newPath)) {
          throw new Error(`File does not exist: ${newPath}`);
        }
        newContent = await readFileAsync(newPath, 'utf8');
        console.log(`Successfully read newContent, length: ${newContent.length}`);
      } catch (error) {
        console.error(`Error reading newPath ${newPath}:`, error);
        return res.status(404).json({ error: `New file not found or cannot be read: ${error.message}` });
      }
    }
    
    // Create diff by comparing line by line
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    // Simple diff algorithm
    const diff = [];
    const movedLines = {
      removed: [],
      added: []
    };
    
    // Add file type information
    const fileType = oldPath ? (newPath ? 'comparison' : 'old-only') : 'new-only';
    
    // Track potential moved lines (lines that are removed and then added elsewhere)
    const removedLines = [];
    
    // First pass: identify removed lines
    for (let i = 0; i < oldLines.length; i++) {
      const line = oldLines[i];
      if (!newLines.includes(line)) {
        removedLines.push({ content: line, oldIndex: i });
        diff.push(`-${line}`);
      } else {
        diff.push(` ${line}`);
      }
    }
    
    // Second pass: identify added and moved lines
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i];
      if (!oldLines.includes(line)) {
        // Check if this added line was in the removed lines (moved)
        const movedIndex = removedLines.findIndex(removed => removed.content === line);
        if (movedIndex >= 0) {
          // This is a moved line
          movedLines.removed.push(removedLines[movedIndex]);
          movedLines.added.push({ content: line, newIndex: i });
        }
        diff.push(`+${line}`);
      }
    }
    
    res.json({
      oldContent,
      newContent,
      diff,
      movedLines,
      fileType // Include the file type in the response
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

// API endpoint to get old and new file comparisons
app.get('/api/comparisons', async (req, res) => {
  try {
    console.log('=== /api/comparisons endpoint called ===');
    
    // If new folder is not configured, return empty arrays
    if (!newFolderPath) {
      console.log('New folder path not configured, returning empty arrays');
      return res.json({ oldFiles: [], newFiles: [] });
    }

    // Determine if we're in new-only mode
    const newOnlyMode = !oldFolderPath || oldFolderPath === '';
    console.log('Running in new-only mode:', newOnlyMode);
    console.log('oldFolderPath:', oldFolderPath || '(empty)');
    console.log('newFolderPath:', newFolderPath);

    // Get files from new folder with metadata
    // In new-only mode, show all files, not just comparison-formatted ones
    const newFiles = await getFilesWithMetadata(newFolderPath, newOnlyMode);
    console.log(`Found ${newFiles.length} files in new folder:`, newFiles.map(f => f.filename));
    
    // Get old files only if we're not in new-only mode
    let oldFiles = [];
    if (!newOnlyMode) {
      oldFiles = await getFilesWithMetadata(oldFolderPath);
      console.log(`Found ${oldFiles.length} files in old folder`);
    }
    
    res.json({
      oldFiles,
      newFiles
    });
  } catch (error) {
    console.error('Error getting comparisons:', error);
    res.status(500).json({ error: 'Failed to get comparisons' });
  }
});

// API endpoint to get keyword counts from files
app.get('/api/keyword-counts', async (req, res) => {
  try {
    // If folders are not configured yet or no keywords are defined, return empty object
    if ((!newFolderPath) || Object.keys(keywordHighlights).length === 0) {
      return res.json({});
    }
    
    // Get all files
    const oldFiles = oldFolderPath ? await getFilesWithMetadata(oldFolderPath) : [];
    const newFiles = newFolderPath ? await getFilesWithMetadata(newFolderPath) : [];
    
    // Count keyword occurrences with separate counts for old and new files
    const keywordCounts = {};
    
    // Initialize counts for all keywords
    Object.keys(keywordHighlights).forEach(keyword => {
      keywordCounts[keyword] = {
        old: 0,
        new: 0,
        total: 0
      };
    });
    
    // Load file contents
    await Promise.all([
      ...oldFiles.map(async file => {
        try {
          file.content = await readFileAsync(file.path, 'utf8');
        } catch (err) {
          console.error(`Error reading file ${file.path}:`, err);
          file.content = '';
        }
      }),
      ...newFiles.map(async file => {
        try {
          file.content = await readFileAsync(file.path, 'utf8');
        } catch (err) {
          console.error(`Error reading file ${file.path}:`, err);
          file.content = '';
        }
      })
    ]);
    
    // Count occurrences in old files (if available)
    if (oldFiles.length > 0) {
      oldFiles.forEach(file => {
        const content = file.content || '';
        
        Object.keys(keywordHighlights).forEach(keyword => {
          // Case insensitive search for keyword
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = content.match(regex);
          
          if (matches) {
            keywordCounts[keyword].old += matches.length;
            keywordCounts[keyword].total += matches.length;
          }
        });
      });
    }
    
    // Count occurrences in new files
    newFiles.forEach(file => {
      const content = file.content || '';
      
      Object.keys(keywordHighlights).forEach(keyword => {
        // Case insensitive search for keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          keywordCounts[keyword].new += matches.length;
          keywordCounts[keyword].total += matches.length;
        }
      });
    });
    
    res.json(keywordCounts);
  } catch (error) {
    console.error('Error getting keyword counts:', error);
    res.status(500).json({ error: 'Failed to get keyword counts' });
  }
});

// API endpoint for filtering files by keyword
app.get('/api/filter-by-keyword', async (req, res) => {
  try {
    console.log('=== /api/filter-by-keyword endpoint called ===');
    const keyword = req.query.keyword;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }
    
    console.log(`Filtering by keyword: "${keyword}"`);
    
    // If folders are not configured yet, return empty arrays
    if ((!oldFolderPath && !newFolderPath) || Object.keys(keywordHighlights).length === 0) {
      console.log('Folders not configured or no keywords loaded, returning empty arrays');
      return res.json({ oldNewFiles: [], timeComparisons: [], sameCommandDiffs: [] });
    }
    
    // Get all files
    const oldFiles = oldFolderPath ? await getFilesWithMetadata(oldFolderPath) : [];
    const newFiles = newFolderPath ? await getFilesWithMetadata(newFolderPath) : [];
    
    console.log(`Found ${oldFiles.length} old files and ${newFiles.length} new files to search`);
    
    // Escape special regex characters in keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    
    // Load content and filter old files containing the keyword
    const filteredOldFiles = await Promise.all(
      oldFiles.map(async (file) => {
        try {
          // Load file content
          const content = await readFileAsync(file.path, 'utf8');
          // Check if content matches keyword
          if (content.match(regex)) {
            return { ...file, content };
          }
          return null;
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error);
          return null;
        }
      })
    ).then(results => results.filter(Boolean));
    
    // Load content and filter new files containing the keyword
    const filteredNewFiles = await Promise.all(
      newFiles.map(async (file) => {
        try {
          // Load file content
          const content = await readFileAsync(file.path, 'utf8');
          // Check if content matches keyword
          if (content.match(regex)) {
            return { ...file, content };
          }
          return null;
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error);
          return null;
        }
      })
    ).then(results => results.filter(Boolean));
    
    console.log(`Found ${filteredOldFiles.length} old files and ${filteredNewFiles.length} new files containing keyword "${keyword}"`);
    
    // Build old-new comparisons with file paths structured for the client
    const oldNewFiles = [];
    
    console.log(`Building comparisons from ${filteredOldFiles.length} old files and ${filteredNewFiles.length} new files`);
    
    // Files that exist in both old and new
    filteredOldFiles.forEach(oldFile => {
      const matchingNewFiles = filteredNewFiles.filter(newFile => 
        newFile.command === oldFile.command
      );
      
      if (matchingNewFiles.length > 0) {
        // Use the most recent new file
        const newFile = matchingNewFiles.sort((a, b) => b.mtime - a.mtime)[0];
        
        oldNewFiles.push({
          command: oldFile.command,
          commandRan: oldFile.commandRan || newFile.commandRan,
          oldPath: oldFile.path,
          newPath: newFile.path,
          timestamp: Math.max(oldFile.mtime, newFile.mtime),
          fileType: 'modified'
        });
        console.log(`Added modified file comparison: ${oldFile.command}`);
      } else {
        // Old only
        oldNewFiles.push({
          command: oldFile.command,
          commandRan: oldFile.commandRan,
          oldPath: oldFile.path,
          newPath: null,
          timestamp: oldFile.mtime,
          fileType: 'deleted'
        });
        console.log(`Added deleted file: ${oldFile.command}`);
      }
    });
    
    // New files that don't have a match in old
    const unmatchedNewFiles = filteredNewFiles.filter(newFile => 
      !filteredOldFiles.some(oldFile => oldFile.command === newFile.command)
    );
    
    unmatchedNewFiles.forEach(newFile => {
      oldNewFiles.push({
        command: newFile.command,
        commandRan: newFile.commandRan,
        oldPath: null,
        newPath: newFile.path,
        timestamp: newFile.mtime,
        fileType: 'new-only'
      });
      console.log(`Added new-only file: ${newFile.command}`);
    });
    
    // Build time-based comparisons
    const timeComparisons = [];
    
    // Group new files by command
    const groupedByCommand = {};
    filteredNewFiles.forEach(file => {
      if (!groupedByCommand[file.command]) {
        groupedByCommand[file.command] = [];
      }
      groupedByCommand[file.command].push(file);
    });
    
    // Create time comparisons for commands with multiple executions
    Object.values(groupedByCommand).forEach(fileGroup => {
      if (fileGroup.length >= 2) {
        // Sort by time (newest first)
        fileGroup.sort((a, b) => b.mtime - a.mtime);
        
        // Compare newest with second newest
        timeComparisons.push({
          command: fileGroup[0].command,
          commandRan: fileGroup[0].commandRan,
          newerPath: fileGroup[0].path,
          olderPath: fileGroup[1].path,
          timeDiff: formatTimeDifference(fileGroup[0].mtime - fileGroup[1].mtime)
        });
      }
    });
    
    // Sort files by timestamp (newest first)
    oldNewFiles.sort((a, b) => b.timestamp - a.timestamp);
    
    // Add counts to the response
    const response = {
      oldNewFiles,
      timeComparisons,
      counts: {
        oldFiles: filteredOldFiles.length,
        newFiles: filteredNewFiles.length,
        timeComparisons: timeComparisons.length,
        total: oldNewFiles.length + timeComparisons.length
      }
    };
    
    console.log(`Returning ${response.counts.total} total matches for keyword "${keyword}"`);
    console.log(`Raw data size: ${JSON.stringify(response).length} bytes`);
    
    // Log summary of what we're sending
    if (oldNewFiles.length > 0) {
      console.log('Sample oldNewFile entry:', JSON.stringify(oldNewFiles[0]));
    }
    if (timeComparisons.length > 0) {
      console.log('Sample timeComparison entry:', JSON.stringify(timeComparisons[0]));
    }
    
    // Send the response
    res.json(response);
  } catch (error) {
    console.error('Error filtering by keyword:', error);
    res.status(500).json({ error: 'Failed to filter by keyword' });
  }
});

// API endpoint to get file metadata (size, modified date, etc.)
app.get('/api/file-metadata', async (req, res) => {
    try {
        const { path: requestedPath } = req.query;
        
        if (!requestedPath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        console.log('[API /api/file-metadata] Received request for path:', requestedPath);
        
        // Determine if this is a path from old or new directory
        let filePath = requestedPath;
        
        // If the path doesn't exist as-is, try to resolve it relative to old or new folders
        if (!fs.existsSync(filePath)) {
            // Try to resolve against the new folder first
            if (newFolderPath && requestedPath.includes(newFolderPath)) {
                filePath = requestedPath;
            } else if (newFolderPath && !path.isAbsolute(requestedPath)) {
                filePath = path.join(newFolderPath, requestedPath);
            } else if (oldFolderPath && requestedPath.includes(oldFolderPath)) {
                filePath = requestedPath;
            } else if (oldFolderPath && !path.isAbsolute(requestedPath)) {
                filePath = path.join(oldFolderPath, requestedPath);
            }
            
            console.log('Resolved file path:', filePath);
        }
        
        // Check if file exists after resolution
        if (!fs.existsSync(filePath)) {
            console.log('[API /api/file-metadata] File not found after path resolution:', filePath);
            return res.status(404).json({ 
                error: 'File not found', 
                requestedPath,
                resolvedPath: filePath 
            });
        }
        
        // Get file metadata
        const stats = await statAsync(filePath);
        
        // Get file extension
        const extension = path.extname(filePath).replace('.', '').toUpperCase() || 'TXT';
        
        // Return formatted metadata
        res.json({
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            isDirectory: stats.isDirectory(),
            extension: extension
        });
        
        console.log('Successfully sent metadata for:', filePath);
    } catch (error) {
        console.error('[API /api/file-metadata] Error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve file metadata',
            message: error.message
        });
    }
});

// API endpoint to get current keywords
app.get('/api/keywords', (req, res) => {
  res.json(keywordHighlights);
});

// API endpoint to upload keyword highlighting file
app.post('/api/keywords', express.text(), async (req, res) => {
  try {
    const fileContent = req.body;
    
    // Parse the keyword file (format: category:color:keyword or keyword:color)
    const newKeywords = {};
    const lines = fileContent.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(':');
      if (parts.length === 2) {
        const [keyword, color] = parts;
        newKeywords[keyword.trim().toLowerCase()] = color.trim();
      } else if (parts.length >= 3) {
        const category = parts[0].trim();
        const color = parts[1].trim();
        const keyword = parts.slice(2).join(':').trim();
        newKeywords[keyword.toLowerCase()] = { color, category };
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

// API endpoint to get theme files
app.get('/api/themes', (req, res) => {
    const themesDir = path.join(__dirname, '../../public/themes');
    
    fs.readdir(themesDir, (err, files) => {
        if (err) {
            console.error('Error reading themes directory:', err);
            return res.status(500).json({ error: 'Failed to read themes directory' });
        }
        
        // Filter for JSON files only
        const themeFiles = files.filter(file => file.endsWith('.json'));
        res.json(themeFiles);
    });
});

// API endpoint to get folder paths (for the settings panel)
app.get('/api/folder-paths', (req, res) => {
    res.json({
        oldFolderPath,
        newFolderPath,
        keywordFilePath
    });
});

// API endpoint to update folder paths
app.post('/api/folder-paths', express.json(), async (req, res) => {
    try {
        const { oldFolderPath: oldPath, newFolderPath: newPath, keywordFilePath: keywordPath } = req.body;

        // Only require newFolderPath - allow oldFolderPath to be empty for "new-only" mode
        if (!newPath) {
            return res.status(400).json({ error: 'newFolderPath is required' });
        }

        // Update the global variables
        oldFolderPath = oldPath || ''; // Allow empty string for oldFolderPath
        newFolderPath = newPath;
        keywordFilePath = keywordPath || '';

        // Save the new configuration
        await saveFolderConfig(oldFolderPath, newFolderPath, keywordFilePath);

        // If there's a keyword file, load keywords from it
        if (keywordFilePath) {
            await loadKeywordsFromFile();
        }

        // Update watcher for new folder
        setupWatcher(newFolderPath);

        res.json({
            success: true,
            message: 'Folder paths updated successfully'
        });
    } catch (error) {
        console.error('Error updating folder paths:', error);
        res.status(500).json({ success: false, error: 'Failed to update folder paths' });
    }
});

// Store keywords for highlighting
let keywordHighlights = {};

// Function to load keywords from file
async function loadKeywordsFromFile() {
  try {
    if (keywordFilePath && fs.existsSync(keywordFilePath)) {
      const fileContent = await readFileAsync(keywordFilePath, 'utf8');
      
      // Parse the keyword file (format: category:color:keyword or keyword:color)
      const newKeywords = {};
      const lines = fileContent.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const parts = trimmed.split(':');
        if (parts.length === 2) {
          const [keyword, color] = parts;
          newKeywords[keyword.trim().toLowerCase()] = color.trim();
        } else if (parts.length >= 3) {
          const category = parts[0].trim();
          const color = parts[1].trim();
          const keyword = parts.slice(2).join(':').trim();
          newKeywords[keyword.toLowerCase()] = { color, category };
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

// Serve modular index.html at root route
app.get('/', async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../../public/index.html');
    console.log('Rendering modular template from', templatePath);
    const renderedHtml = await componentLoader.renderTemplate(templatePath);
    console.log('Template rendered successfully, sending response');
    res.send(renderedHtml);
  } catch (error) {
    console.error('Error serving modular index.html:', error);
    res.status(500).send('Error loading application');
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.json());

// Simple ping endpoint for connection testing
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Search files by content
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log(`[Search] Received search request for: "${query}"`);  
    
    // Check if the folders exist
    if (!oldFolderPath || !newFolderPath) {
      console.error('[Search] Folder paths not configured');
      return res.status(500).json({ error: 'Folder paths not configured' });
    }
    
    // Instead of using metadata, directly search files in old/new folders
    const searchResults = [];
    
    // Function to search files in a directory
    async function searchDirectory(directory, isOldDir) {
      try {
        if (!fs.existsSync(directory)) {
          console.log(`[Search] Directory does not exist: ${directory}`);
          return;
        }

        const files = await readdirAsync(directory);
        console.log(`[Search] Found ${files.length} files in ${directory}`);
        
        // Process files sequentially to avoid overwhelming the system
        for (const filename of files) {
          try {
            // Skip non-text files and hidden files
            if (filename.startsWith('.')) continue;
            
            const filePath = path.join(directory, filename);
            const stats = await statAsync(filePath);
            
            // Skip directories
            if (stats.isDirectory()) continue;
            
            try {
              // Read file content
              const content = await fs.promises.readFile(filePath, 'utf8');
              
              // Simple string search (case insensitive)
              if (content.toLowerCase().includes(query.toLowerCase())) {
                // Count matches with regex for accuracy
                const searchRegex = new RegExp(query, 'gi');
                const matches = (content.match(searchRegex) || []).length;
                
                if (matches > 0) {
                  console.log(`[Search] Found ${matches} matches in ${filename}`);
                  
                  // Create result object based on whether it's from old or new dir
                  const resultObj = {
                    command: '',
                    commandRan: '',
                    timestamp: stats.mtime.getTime(),
                    matches: matches
                  };
                  
                  if (isOldDir) {
                    resultObj.fileType = 'old-only';
                    resultObj.oldFile = {
                      filename,
                      path: filePath,
                      mtime: stats.mtime
                    };
                  } else {
                    resultObj.fileType = 'new-only';
                    resultObj.newFile = {
                      filename,
                      path: filePath,
                      mtime: stats.mtime
                    };
                  }
                  
                  // Check if this file also exists in the other directory
                  const otherDir = isOldDir ? newFolderPath : oldFolderPath;
                  const otherPath = path.join(otherDir, filename);
                  
                  if (fs.existsSync(otherPath)) {
                    const otherStats = await statAsync(otherPath);
                    
                    // This is a comparison file (exists in both dirs)
                    resultObj.fileType = 'comparison';
                    
                    if (isOldDir) {
                      resultObj.newFile = {
                        filename,
                        path: otherPath,
                        mtime: otherStats.mtime
                      };
                    } else {
                      resultObj.oldFile = {
                        filename,
                        path: otherPath,
                        mtime: otherStats.mtime
                      };
                    }
                  }
                  
                  // Add to results
                  searchResults.push(resultObj);
                }
              }
            } catch (readErr) {
              console.error(`[Search] Error reading ${filePath}: ${readErr.message}`);
            }
          } catch (fileErr) {
            console.error(`[Search] Error processing ${filename}: ${fileErr.message}`);
          }
        }
      } catch (dirErr) {
        console.error(`[Search] Error searching directory ${directory}: ${dirErr.message}`);
      }
    }
    
    // Search both directories
    await searchDirectory(oldFolderPath, true);
    await searchDirectory(newFolderPath, false);
    
    // Deduplicate results based on filename
    const uniqueResults = [];
    const seen = new Set();
    
    for (const result of searchResults) {
      const filename = result.oldFile?.filename || result.newFile?.filename;
      if (!seen.has(filename)) {
        seen.add(filename);
        uniqueResults.push(result);
      }
    }
    
    // Sort results by number of matches (descending)
    uniqueResults.sort((a, b) => b.matches - a.matches);
    
    console.log(`[Search] Found ${uniqueResults.length} unique files containing "${query}"`);
    
    res.json(uniqueResults);
  } catch (error) {
    console.error('[Search] Error in search endpoint:', error);
    res.status(500).json({ error: 'An error occurred during search' });
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
  
  // Start the server with Socket.IO
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Socket.IO service enabled for real-time updates`);
    if (newFolderPath) {
      console.log(`Watching for file changes in ${newFolderPath}`);
    } else {
      console.log('Waiting for folder configuration...');
    }
  });
}

// API endpoint to detect and retrieve same commands run at different times
app.get('/api/same-command-diffs', async (req, res) => {
  try {
    // Only check the new folder for same command diffs
    if (!newFolderPath) {
      return res.json({ sameCommandDiffs: [] });
    }

    const files = await readdirAsync(newFolderPath);
    const commandGroups = {};

    // Process each file to extract command information
    for (const file of files) {
      try {
        const filePath = path.join(newFolderPath, file);
        const stats = await statAsync(filePath);
        
        if (stats.isFile()) {
          // Read the first line to extract timestamp and command
          const data = await readFileAsync(filePath, 'utf8');
          const firstLine = data.split('\n')[0] || '';
          
          // Extract timestamp (format: YYYY-MM-DD HH:MM:SS)
          const timestampMatch = firstLine.match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
          // Create a proper Date object from the extracted timestamp
          let timestamp;
          if (timestampMatch) {
            try {
              timestamp = new Date(timestampMatch[1]);
              // Validate if the date is valid
              if (isNaN(timestamp.getTime())) {
                console.warn(`Invalid date format in file ${file}: ${timestampMatch[1]}`);
                timestamp = stats.mtime;
              }
            } catch (e) {
              console.warn(`Error parsing date in file ${file}: ${e.message}`);
              timestamp = stats.mtime;
            }
          } else {
            timestamp = stats.mtime;
          }
          
          // Extract command from quoted part or use filename
          const commandMatch = firstLine.match(/"([^"]+)"/); 
          const command = commandMatch ? commandMatch[1] : path.basename(file, path.extname(file));
          
          // Group by command
          if (!commandGroups[command]) {
            commandGroups[command] = [];
          }
          
          commandGroups[command].push({
            path: filePath,
            filename: file,
            timestamp: timestamp
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    // Find commands with multiple runs
    const sameCommandDiffs = [];
    
    for (const [command, runs] of Object.entries(commandGroups)) {
      // Only include commands with multiple runs
      if (runs.length > 1) {
        // Sort by timestamp (newest first)
        runs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Find the time difference between newest and oldest run
        const newestRun = runs[0];
        const oldestRun = runs[runs.length - 1];
        const timeDiff = newestRun.timestamp - oldestRun.timestamp;
        
        sameCommandDiffs.push({
          command,
          runs,
          timeDiff: formatTimeDifference(timeDiff)
        });
      }
    }
    
    res.json({ sameCommandDiffs });
  } catch (error) {
    console.error('Error detecting same command diffs:', error);
    res.status(500).json({ error: 'Failed to detect same command diffs' });
  }
});

// Start the application
initApp();
