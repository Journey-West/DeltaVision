/**
 * File reader module for the DeltaVision application
 * Handles reading file content for search and display
 */

const fs = require('fs').promises;
const path = require('path');
const debug = require('debug')('deltavision:file-reader');

/**
 * Read the content of a file
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<string>} - File content as string
 */
async function readFileContent(filePath) {
  debug('Reading file content: %s', filePath);
  
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  try {
    // Check if file exists and is readable
    await fs.access(filePath, fs.constants.R_OK);
    
    // Get file stats to check size
    const stats = await fs.stat(filePath);
    
    // Skip very large files
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (stats.size > MAX_FILE_SIZE) {
      debug('File too large to read entirely: %s (%d bytes)', filePath, stats.size);
      throw new Error(`File too large to read entirely (${stats.size} bytes). Maximum size is ${MAX_FILE_SIZE} bytes.`);
    }
    
    // Skip binary files
    if (isBinaryPath(filePath)) {
      debug('Binary file detected, not reading: %s', filePath);
      throw new Error('Binary files are not supported');
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    debug('Successfully read file: %s (%d bytes)', filePath, content.length);
    
    return content;
  } catch (error) {
    debug('Error reading file: %s - %s', filePath, error.message);
    throw error;
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

module.exports = {
  readFileContent
};
