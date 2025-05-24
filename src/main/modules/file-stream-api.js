const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const debug = require('debug')('deltavision:file-stream');

/**
 * File Stream API module
 * Handles retrieving files from the New directory for streaming view
 */

/**
 * Get all files from the New directory with content and metadata
 * @param {string} directoryPath - Path to the New directory
 * @returns {Promise<Array>} - Array of file objects with content and metadata
 */
async function getNewDirectoryFiles(directoryPath) {
  debug(`Getting all files from directory: ${directoryPath}`);
  try {
    // Validate input
    if (!directoryPath) {
      throw new Error('Directory path is required');
    }

    // Check if directory exists
    const dirStats = await fs.stat(directoryPath).catch(() => null);
    if (!dirStats || !dirStats.isDirectory()) {
      throw new Error(`Invalid directory path: ${directoryPath}`);
    }

    // Get all files in the directory (non-recursive)
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const files = entries
      .filter(entry => entry.isFile())
      .map(entry => path.join(directoryPath, entry.name));
    
    debug(`Found ${files.length} files in ${directoryPath}`);

    // Process each file to get content and metadata
    const fileObjects = await Promise.all(files.map(async (filePath) => {
      try {
        // Get file stats
        const stats = await fs.stat(filePath);
        
        // Read file content
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract document title from first line
        const firstLine = content.split('\n')[0].trim();
        let title = path.basename(filePath);
        
        // Try to extract title from quoted text
        const quoteMatch = firstLine.match(/"([^"]*)"/);
        if (quoteMatch) {
          title = quoteMatch[1];
        } else {
          // Try to extract markdown-style title (# Title)
          const markdownMatch = firstLine.match(/^#\s+(.+)$/);
          if (markdownMatch) {
            title = markdownMatch[1];
          } else if (firstLine.length > 0) {
            // If no specific format is found but the line has content, use it as the title
            title = firstLine;
          }
        }

        return {
          path: filePath,
          filename: path.basename(filePath),
          title,
          content,
          size: stats.size,
          modifiedTime: stats.mtime,
          createdTime: stats.birthtime
        };
      } catch (error) {
        debug(`Error processing file ${filePath}:`, error);
        // Return a minimal object for files that couldn't be processed
        return {
          path: filePath,
          filename: path.basename(filePath),
          title: path.basename(filePath),
          content: `Error reading file: ${error.message}`,
          size: 0,
          modifiedTime: new Date(),
          createdTime: new Date(),
          error: error.message
        };
      }
    }));

    // Sort files by modification time. 
    // Logically, (a, b) => a.modifiedTime - b.modifiedTime sorts oldest first.
    // However, this results in the desired visual output of newest files at the top,
    // suggesting a downstream reversal of the list order before rendering.
    fileObjects.sort((a, b) => a.modifiedTime - b.modifiedTime);
    
    debug(`Processed ${fileObjects.length} files for stream view`);
    return fileObjects;
  } catch (error) {
    debug(`Error getting files from directory ${directoryPath}:`, error);
    console.error(`Error getting files from directory ${directoryPath}:`, error);
    throw error;
  }
}

module.exports = {
  getNewDirectoryFiles
};
