const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Load config
const configFilePath = path.join(process.cwd(), 'folder-config.json');
const configData = fs.readFileSync(configFilePath, 'utf8');
const config = JSON.parse(configData);

const oldFolderPath = config.oldFolderPath;
const newFolderPath = config.newFolderPath;

// Get keyword from command line argument
const keyword = process.argv[2];
if (!keyword) {
  console.error('Please provide a keyword as a command line argument');
  process.exit(1);
}

console.log(`Debugging keyword filter for: "${keyword}"`);
console.log(`Old folder: ${oldFolderPath || '(empty)'}`);
console.log(`New folder: ${newFolderPath || '(empty)'}`);

// Function to extract command part before double underscore
function extractCommand(filename) {
  const parts = filename.split('__');
  return parts[0];
}

// Function to get all files from a directory with their metadata
async function getFilesWithMetadata(dirPath) {
  try {
    // Check if directory exists
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.warn(`Directory ${dirPath} does not exist or is not set`);
      return [];
    }

    console.log(`Reading files from ${dirPath}`);
    const files = await readdirAsync(dirPath);
    console.log(`Found ${files.length} total files/directories in ${dirPath}`);
    
    // Filter out directories
    const fileStats = await Promise.all(
      files.map(async file => {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await statAsync(filePath);
          return { file, filePath, isDirectory: stats.isDirectory(), stats };
        } catch (error) {
          console.error(`Error getting stats for ${filePath}:`, error);
          return null;
        }
      })
    );
    
    // Filter out nulls and directories
    const filteredFileStats = fileStats
      .filter(item => item !== null && !item.isDirectory);
    
    // Map files to their metadata
    const fileData = await Promise.all(
      filteredFileStats.map(async ({ file, filePath, stats }) => {
        try {
          // Default values
          let command = file;
          
          // Try to extract command info
          if (file.includes('__')) {
            command = extractCommand(file);
          }
          
          return {
            filename: file,
            path: filePath,
            command,
            mtime: stats.mtime.getTime()
          };
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
          return null;
        }
      })
    );
    
    // Remove null entries
    return fileData.filter(item => item !== null);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Main filtering function
async function filterByKeyword() {
  try {
    // Get all files
    const oldFiles = oldFolderPath ? await getFilesWithMetadata(oldFolderPath) : [];
    const newFiles = newFolderPath ? await getFilesWithMetadata(newFolderPath) : [];
    
    console.log(`\nSearching ${oldFiles.length} old files and ${newFiles.length} new files`);
    
    // Escape special regex characters in keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    
    console.log(`Using regex pattern: ${regex}`);
    
    // Load content and filter files containing the keyword
    const filteredOldFiles = await Promise.all(
      oldFiles.map(async (file) => {
        try {
          // Load file content
          const content = await readFileAsync(file.path, 'utf8');
          // Check if content matches keyword
          const matches = content.match(regex);
          if (matches) {
            console.log(`[OLD] Found ${matches.length} matches in: ${file.path}`);
            return { ...file };
          }
          return null;
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error);
          return null;
        }
      })
    ).then(results => results.filter(Boolean));
    
    const filteredNewFiles = await Promise.all(
      newFiles.map(async (file) => {
        try {
          // Load file content
          const content = await readFileAsync(file.path, 'utf8');
          // Check if content matches keyword
          const matches = content.match(regex);
          if (matches) {
            console.log(`[NEW] Found ${matches.length} matches in: ${file.path}`);
            return { ...file };
          }
          return null;
        } catch (error) {
          console.error(`Error reading file ${file.path}:`, error);
          return null;
        }
      })
    ).then(results => results.filter(Boolean));
    
    console.log(`\nFound ${filteredOldFiles.length} old files and ${filteredNewFiles.length} new files containing keyword`);
    
    // Display matched file information
    console.log("\nOld file matches:");
    filteredOldFiles.forEach(file => {
      console.log(`  - ${file.filename}`);
    });
    
    console.log("\nNew file matches:");
    filteredNewFiles.forEach(file => {
      console.log(`  - ${file.filename}`);
    });
    
    // Build old-new comparisons
    const oldNewFiles = [];
    
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
          oldPath: oldFile.path,
          newPath: newFile.path
        });
      } else {
        // Old only
        oldNewFiles.push({
          command: oldFile.command,
          oldPath: oldFile.path,
          newPath: null
        });
      }
    });
    
    // New files that don't have a match in old
    const unmatchedNewFiles = filteredNewFiles.filter(newFile => 
      !filteredOldFiles.some(oldFile => oldFile.command === newFile.command)
    );
    
    unmatchedNewFiles.forEach(newFile => {
      oldNewFiles.push({
        command: newFile.command,
        oldPath: null,
        newPath: newFile.path
      });
    });
    
    console.log(`\nBuilt ${oldNewFiles.length} old-new comparisons`);
    
    // Display the oldNewFiles structure that would be sent to client
    console.log("\noldNewFiles structure (would be sent to client):");
    oldNewFiles.forEach((item, index) => {
      console.log(`[${index}] command: ${item.command}`);
      console.log(`    oldPath: ${item.oldPath || 'null'}`);
      console.log(`    newPath: ${item.newPath || 'null'}`);
    });
    
    return {
      filteredOldFiles,
      filteredNewFiles,
      oldNewFiles
    };
  } catch (error) {
    console.error('Error in filterByKeyword:', error);
  }
}

// Run the filter function
filterByKeyword().then(() => {
  console.log("\nDebug complete");
});
