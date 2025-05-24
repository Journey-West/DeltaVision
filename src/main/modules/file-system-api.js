const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { dialog } = require('electron');
const debug = require('debug')('deltavision:fs-api');

/**
 * File system operations module
 * Handles file reading, directory scanning, and file matching
 */

/**
 * Read the content of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - File content as string
 */
async function readFileContent(filePath) {
  debug(`Reading file content: ${filePath}`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    debug(`File read successfully: ${filePath} (${content.length} bytes)`);
    return content;
  } catch (error) {
    debug(`Error reading file ${filePath}:`, error);
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get all files in a directory (non-recursive)
 * @param {string} directoryPath - Path to the directory
 * @returns {Promise<string[]>} - Array of file paths
 */
async function getFilesInDirectory(directoryPath) {
  debug(`Getting files in directory: ${directoryPath}`);
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => path.join(directoryPath, entry.name));
    debug(`Found ${files.length} files in ${directoryPath}`);
    return files;
  } catch (error) {
    debug(`Error reading directory ${directoryPath}:`, error);
    console.error(`Error reading directory ${directoryPath}:`, error);
    throw error;
  }
}

/**
 * Extract the prefix before double underline from a filename
 * @param {string} filePath - Path to the file
 * @returns {string} - Prefix before double underline
 */
function extractFilePrefix(filePath) {
  const fileName = path.basename(filePath);
  const parts = fileName.split('__');
  return parts[0];
}

/**
 * Extract document title from the first line
 * @param {string} content - File content
 * @returns {string|null} - Document title or null if not found
 */
function extractDocumentTitle(content) {
  const firstLine = content.split('\n')[0].trim();
  
  // Try to extract title from quoted text
  const quoteMatch = firstLine.match(/"([^"]*)"/); 
  if (quoteMatch) return quoteMatch[1];
  
  // Try to extract markdown-style title (# Title)
  const markdownMatch = firstLine.match(/^#\s+(.+)$/); 
  if (markdownMatch) return markdownMatch[1];
  
  // If no specific format is found but the line has content, use it as the title
  if (firstLine.length > 0) return firstLine;
  
  return null;
}

/**
 * Group files by their prefix and document title
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - Object with groups of files
 */
async function groupFilesByPrefixAndTitle(files) {
  const groups = {};
  
  for (const filePath of files) {
    const prefix = extractFilePrefix(filePath);
    
    // Skip files without a prefix (no double underline)
    if (!prefix) continue;
    
    try {
      const content = await readFileContent(filePath);
      const title = extractDocumentTitle(content);
      
      // Skip files without a title
      if (!title) continue;
      
      const key = `${prefix}:${title}`;
      
      if (!groups[key]) {
        groups[key] = {
          prefix,
          title,
          files: []
        };
      }
      
      groups[key].files.push({
        path: filePath,
        filename: path.basename(filePath)
      });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      // Continue with other files
    }
  }
  
  return groups;
}

/**
 * Select files to compare based on the matching rules
 * @param {string} oldDirPath - Path to the old files directory
 * @param {string} newDirPath - Path to the new files directory
 * @returns {Promise<Array>} - Array of file pairs to compare
 */
async function selectFilesToCompare(oldDirPath, newDirPath) {
  debug(`Selecting files to compare between: ${oldDirPath} and ${newDirPath}`);
  try {
    // Get all files in both directories
    const oldFiles = await getFilesInDirectory(oldDirPath);
    const newFiles = await getFilesInDirectory(newDirPath);
    
    debug(`Found ${oldFiles.length} files in old directory and ${newFiles.length} files in new directory`);
    
    // Group files by prefix and title
    const oldGroups = await groupFilesByPrefixAndTitle(oldFiles);
    const newGroups = await groupFilesByPrefixAndTitle(newFiles);
    
    debug(`Grouped into ${Object.keys(oldGroups).length} old groups and ${Object.keys(newGroups).length} new groups`);
    
    const filePairsToCompare = [];
    
    // Track which groups have been processed
    const processedOldGroups = new Set();
    const processedNewGroups = new Set();
    
    // Find matching groups
    for (const key in oldGroups) {
      if (newGroups[key]) {
        const oldGroup = oldGroups[key];
        const newGroup = newGroups[key];
        
        // Sort files by filename (assuming version info is in the filename)
        oldGroup.files.sort((a, b) => a.filename.localeCompare(b.filename));
        newGroup.files.sort((a, b) => a.filename.localeCompare(b.filename));
        
        // Select oldest from old and newest from new
        const oldestFile = oldGroup.files[0];
        const newestFile = newGroup.files[newGroup.files.length - 1];
        
        // Get file stats for the new file to use for sorting
        let timestamp;
        try {
          const stats = fsSync.statSync(newestFile.path);
          timestamp = stats.mtimeMs; // Use modification time for sorting
        } catch (error) {
          console.error(`Error getting file stats for ${newestFile.path}:`, error);
          timestamp = Date.now(); // Fallback to current time if stats fail
        }
        
        filePairsToCompare.push({
          prefix: oldGroup.prefix,
          title: oldGroup.title,
          oldFile: oldestFile.path,
          newFile: newestFile.path,
          oldFileName: oldestFile.filename,
          newFileName: newestFile.filename,
          timestamp: timestamp,
          isNewFile: false,      // This is a matched file, not a new file
          isOldFile: false,      // This is a matched file, not an old-only file
          isNewVersionsCompare: false // This is not a comparison between versions in new dir
        });
        
        // Mark these groups as processed
        processedOldGroups.add(key);
        processedNewGroups.add(key);
      }
    }
    
    // Process new files that don't have a match in the old directory
    for (const key in newGroups) {
      if (!processedNewGroups.has(key)) {
        const newGroup = newGroups[key];
        
        // Sort files by filename
        newGroup.files.sort((a, b) => a.filename.localeCompare(b.filename));
        
        // Select newest file from the new group
        const newestFile = newGroup.files[newGroup.files.length - 1];
        
        // Get file stats for the new file
        let timestamp;
        try {
          const stats = fsSync.statSync(newestFile.path);
          timestamp = stats.mtimeMs;
        } catch (error) {
          console.error(`Error getting file stats for ${newestFile.path}:`, error);
          timestamp = Date.now();
        }
        
        filePairsToCompare.push({
          prefix: newGroup.prefix,
          title: newGroup.title,
          oldFile: null, // No matching old file
          newFile: newestFile.path,
          oldFileName: null, // No matching old filename
          newFileName: newestFile.filename,
          timestamp: timestamp,
          isNewFile: true,       // This is a new file without a match
          isOldFile: false,      // This is not an old-only file
          isNewVersionsCompare: false // This is not a comparison between versions in new dir
        });
      }
    }
    
    // Process old files that don't have a match in the new directory
    for (const key in oldGroups) {
      if (!processedOldGroups.has(key)) {
        const oldGroup = oldGroups[key];
        
        // Sort files by filename
        oldGroup.files.sort((a, b) => a.filename.localeCompare(b.filename));
        
        // Select oldest file from the old group
        const oldestFile = oldGroup.files[0];
        
        // Get file stats for the old file
        let timestamp;
        try {
          const stats = fsSync.statSync(oldestFile.path);
          timestamp = stats.mtimeMs;
        } catch (error) {
          console.error(`Error getting file stats for ${oldestFile.path}:`, error);
          timestamp = Date.now();
        }
        
        filePairsToCompare.push({
          prefix: oldGroup.prefix,
          title: oldGroup.title,
          oldFile: oldestFile.path,
          newFile: null, // No matching new file
          oldFileName: oldestFile.filename,
          newFileName: null, // No matching new filename
          timestamp: timestamp,
          isNewFile: false,      // This is not a new-only file
          isOldFile: true,       // This is an old-only file
          isNewVersionsCompare: false // This is not a comparison between versions in new dir
        });
      }
    }
    
    // Process multiple versions of the same file in the new directory
    for (const key in newGroups) {
      const newGroup = newGroups[key];
      
      // Only process groups with multiple files (multiple versions)
      if (newGroup.files.length > 1) {
        // Sort files by modification time (newest to oldest)
        const sortedFiles = [...newGroup.files];
        
        // Get file stats and add to each file object
        for (const file of sortedFiles) {
          try {
            const stats = fsSync.statSync(file.path);
            file.mtime = stats.mtimeMs;
          } catch (error) {
            console.error(`Error getting file stats for ${file.path}:`, error);
            file.mtime = 0; // Default to 0 if stats fail
          }
        }
        
        // Sort by modification time (newest first)
        sortedFiles.sort((a, b) => b.mtime - a.mtime);
        
        // Get the two most recent versions
        if (sortedFiles.length >= 2) {
          const newestFile = sortedFiles[0];
          const secondNewestFile = sortedFiles[1];
          
          // Only add if they have different modification times
          if (newestFile.mtime !== secondNewestFile.mtime) {
            // Calculate time difference
            const timeDiffMs = newestFile.mtime - secondNewestFile.mtime;
            const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
            const timeDiffHours = Math.floor(timeDiffMinutes / 60);
            const timeDiffDays = Math.floor(timeDiffHours / 24);
            
            // Format time difference string
            let timeDiffStr = '';
            if (timeDiffDays > 0) {
              timeDiffStr = `${timeDiffDays}d ${timeDiffHours % 24}h`;
            } else if (timeDiffHours > 0) {
              timeDiffStr = `${timeDiffHours}h ${timeDiffMinutes % 60}m`;
            } else {
              timeDiffStr = `${timeDiffMinutes}m`;
            }
            
            filePairsToCompare.push({
              prefix: newGroup.prefix,
              title: `${newGroup.title}`,
              oldFile: secondNewestFile.path,
              newFile: newestFile.path,
              oldFileName: secondNewestFile.filename,
              newFileName: newestFile.filename,
              timestamp: newestFile.mtime,
              isNewFile: false,      // This is not a new-only file
              isOldFile: false,      // This is not an old-only file
              isNewVersionsCompare: true, // This is a comparison between versions in new dir
              timeDifference: timeDiffStr // Time difference between versions
            });
            
            debug(`Added version comparison for ${newGroup.title}: ${secondNewestFile.filename} vs ${newestFile.filename} (${timeDiffStr} apart)`);
          }
        }
      }
    }
    
    // Sort file pairs from newest to oldest
    filePairsToCompare.sort((a, b) => b.timestamp - a.timestamp);
    
    debug(`Final comparison list contains ${filePairsToCompare.length} file pairs`);
    debug(`Regular files: ${filePairsToCompare.filter(p => !p.isNewFile && !p.isOldFile && !p.isNewVersionsCompare).length}`);
    debug(`New-only files: ${filePairsToCompare.filter(p => p.isNewFile).length}`);
    debug(`Old-only files: ${filePairsToCompare.filter(p => p.isOldFile).length}`);
    debug(`New version comparisons: ${filePairsToCompare.filter(p => p.isNewVersionsCompare).length}`);
    
    return filePairsToCompare;
  } catch (error) {
    console.error('Error selecting files to compare:', error);
    throw error;
  }
}

/**
 * Open a directory selection dialog
 * @param {string} title - Dialog title
 * @returns {Promise<string|null>} - Selected directory path or null
 */
async function selectDirectory(title = 'Select Directory') {
  debug(`Opening directory selection dialog: "${title}"`);
  
  // Get the focused BrowserWindow or the first available window
  const { BrowserWindow } = require('electron');
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  
  const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow, {
    properties: ['openDirectory'],
    title: title,
    // Ensure dialog is modal and stays on top
    modal: true
  });
  
  if (canceled) {
    debug('Directory selection canceled by user');
    return null;
  }
  
  debug(`Selected directory: ${filePaths[0]}`);
  return filePaths[0];
}

/**
 * Open a file selection dialog
 * @param {string} title - Dialog title
 * @param {boolean} multiSelections - Allow multiple selections
 * @returns {Promise<string[]|null>} - Selected file paths or null
 */
async function selectFiles(title = 'Select Files', multiSelections = true) {
  debug(`Opening file selection dialog: "${title}"`);
  
  // Get the focused BrowserWindow or the first available window
  const { BrowserWindow } = require('electron');
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  
  const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow, {
    properties: ['openFile', multiSelections ? 'multiSelections' : null].filter(Boolean),
    title: title,
    // Ensure dialog is modal and stays on top
    modal: true
  });
  
  if (canceled) {
    debug('File selection canceled by user');
    return null;
  }
  
  debug(`Selected ${filePaths.length} files`);
  return filePaths;
}
/**
 * Parse keywords file for highlighting
 * @param {string} filePath - Path to the keywords file
 * @returns {Promise<Object>} - Object with keyword categories and their settings
 */
async function parseKeywordsFile(filePath) {
  debug(`Parsing keywords file: ${filePath}`);
  try {
    if (!filePath) {
      debug('No keywords file path provided');
      return { categories: [] };
    }
    
    const content = await readFileContent(filePath);
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const categories = [];
    let currentCategory = null;
    
    for (const line of lines) {
      // Check if this is a category header (starts with #)
      if (line.startsWith('#')) {
        // Extract category name and color from header
        // Format: # Category Name (Color)
        const match = line.match(/^#\s+(.+?)\s*\((.+?)\)\s*$/);
        if (match) {
          const [, name, color] = match;
          currentCategory = {
            name: name.trim(),
            color: color.trim().toLowerCase(),
            keywords: []
          };
          categories.push(currentCategory);
          debug(`Found category: ${name} (${color})`);
        }
      } else if (currentCategory) {
        // Add keyword to current category
        currentCategory.keywords.push(line);
      }
    }
    
    // Count keywords in each category
    categories.forEach(category => {
      debug(`Category ${category.name} has ${category.keywords.length} keywords`);
    });
    
    return { categories };
  } catch (error) {
    debug(`Error parsing keywords file ${filePath}:`, error);
    console.error(`Error parsing keywords file ${filePath}:`, error);
    return { categories: [] };
  }
}

module.exports = {
  readFileContent,
  getFilesInDirectory,
  selectFilesToCompare,
  selectDirectory,
  selectFiles,
  parseKeywordsFile
};
