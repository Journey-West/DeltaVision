/**
 * File search module for the DeltaVision application
 * Handles searching file names and content in directories
 */

const fs = require('fs').promises;
const path = require('path');
const { createReadStream } = require('fs');
const { pipeline } = require('stream/promises');
const debug = require('debug')('deltavision:file-search');

/**
 * Search for files by name and/or content
 * @param {string} directoryPath - Path to directory to search
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @param {boolean} options.searchNames - Whether to search in file names
 * @param {boolean} options.searchContent - Whether to search in file content
 * @param {boolean} options.caseSensitive - Whether search should be case sensitive
 * @param {Array<string>} options.fileTypes - File extensions to include (optional)
 * @param {number} options.maxResults - Maximum number of results (optional)
 * @returns {Promise<Array>} - Array of search results
 */
async function searchFiles(directoryPath, searchTerm, options = {}) {
  debug('Starting search in %s for "%s"', directoryPath, searchTerm);
  
  const {
    searchNames = true,
    searchContent = true,
    caseSensitive = false,
    fileTypes = [],
    maxResults = 1000
  } = options;

  if (!searchTerm) {
    return { success: false, error: 'Search term is required' };
  }

  try {
    const results = [];
    const processedTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    // Track search stats
    const stats = {
      filesScanned: 0,
      matchesFound: 0,
      directoriesScanned: 0
    };

    // Search files recursively
    await searchDirectory(directoryPath, processedTerm, {
      searchNames,
      searchContent,
      caseSensitive,
      fileTypes,
      maxResults,
      results,
      stats
    });

    debug('Search completed: %d files scanned, %d matches found', 
      stats.filesScanned, stats.matchesFound);

    return { 
      success: true, 
      results,
      stats
    };
  } catch (error) {
    debug('Search error: %s', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recursively search a directory for files matching criteria
 * @param {string} dirPath - Directory path to search
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options and state
 * @returns {Promise<void>}
 */
async function searchDirectory(dirPath, searchTerm, options) {
  const {
    searchNames,
    searchContent,
    caseSensitive,
    fileTypes,
    maxResults,
    results,
    stats
  } = options;

  // Stop if we've reached max results
  if (results.length >= maxResults) {
    return;
  }

  try {
    stats.directoriesScanned++;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Process all entries in the directory
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        await searchDirectory(entryPath, searchTerm, options);
      } else if (entry.isFile()) {
        stats.filesScanned++;
        
        // Check if we should filter by file extension
        const fileExt = path.extname(entry.name).slice(1).toLowerCase();
        if (fileTypes.length > 0 && !fileTypes.includes(fileExt)) {
          continue;
        }
        
        // Check file name match
        let nameMatch = false;
        if (searchNames) {
          const fileName = caseSensitive ? entry.name : entry.name.toLowerCase();
          nameMatch = fileName.includes(searchTerm);
          
          if (nameMatch) {
            const fileStats = await fs.stat(entryPath);
            
            results.push({
              filePath: entryPath,
              fileName: entry.name,
              matches: {
                inName: true,
                inContent: []
              },
              metadata: {
                size: fileStats.size,
                modifiedTime: fileStats.mtime.toISOString()
              }
            });
            
            stats.matchesFound++;
            
            // Stop if we've reached max results
            if (results.length >= maxResults) {
              return;
            }
          }
        }
        
        // Check file content match if needed
        if (searchContent && !nameMatch) {
          try {
            const contentMatches = await searchFileContent(entryPath, searchTerm, caseSensitive);
            
            if (contentMatches.length > 0) {
              const fileStats = await fs.stat(entryPath);
              
              results.push({
                filePath: entryPath,
                fileName: entry.name,
                matches: {
                  inName: false,
                  inContent: contentMatches
                },
                metadata: {
                  size: fileStats.size,
                  modifiedTime: fileStats.mtime.toISOString()
                }
              });
              
              stats.matchesFound++;
              
              // Stop if we've reached max results
              if (results.length >= maxResults) {
                return;
              }
            }
          } catch (error) {
            debug('Error searching file content for %s: %s', entryPath, error.message);
            // Continue with next file
          }
        }
      }
    }
  } catch (error) {
    debug('Error reading directory %s: %s', dirPath, error.message);
    // Continue with parent directory
  }
}

/**
 * Search for term in file content
 * @param {string} filePath - Path to file
 * @param {string} searchTerm - Term to search for
 * @param {boolean} caseSensitive - Whether search is case sensitive
 * @returns {Promise<Array>} - Array of matches with line numbers and content
 */
async function searchFileContent(filePath, searchTerm, caseSensitive) {
  // Skip binary files and very large files
  const stats = await fs.stat(filePath);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (stats.size > MAX_FILE_SIZE) {
    debug('Skipping large file: %s (%d bytes)', filePath, stats.size);
    return [];
  }
  
  if (isBinaryPath(filePath)) {
    debug('Skipping binary file: %s', filePath);
    return [];
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = caseSensitive ? lines[i] : lines[i].toLowerCase();
      
      if (line.includes(searchTerm)) {
        const lineNumber = i + 1;
        const lineContent = lines[i].trim();
        const position = line.indexOf(searchTerm);
        
        matches.push({
          lineNumber,
          lineContent,
          position
        });
      }
    }
    
    return matches;
  } catch (error) {
    debug('Error reading file %s: %s', filePath, error.message);
    return [];
  }
}

/**
 * Simple check if a file is likely binary based on extension
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is likely binary
 */
function isBinaryPath(filePath) {
  const binaryExtensions = [
    'exe', 'dll', 'so', 'dylib', 'bin', 'obj',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico',
    'mp3', 'mp4', 'avi', 'mov', 'wmv', 'flv',
    'zip', 'tar', 'gz', 'rar', '7z',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
  ];
  
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return binaryExtensions.includes(ext);
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  searchFiles,
  formatFileSize
};
