/**
 * Same Command Detector - Identifies identical commands run at different times
 * 
 * This module helps DeltaVision detect when the same command has been run
 * multiple times, allowing for special visualization of the time differences
 * and output changes between runs.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Extract timestamp and command info from file content
 * @param {string} filePath - Path to the file
 * @returns {Promise<{timestamp: Date, command: string}>} - Timestamp and command info
 */
async function extractCommandInfo(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    if (lines.length === 0) return null;
    
    // Extract timestamp from first line (format: YYYY-MM-DD HH:MM:SS)
    const timestampMatch = lines[0].match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
    const timestamp = timestampMatch ? new Date(timestampMatch[1]) : null;
    
    // Extract command from quoted part in first line
    const commandMatch = lines[0].match(/"([^"]+)"/);
    const command = commandMatch ? commandMatch[1] : path.basename(filePath);
    
    return {
      timestamp,
      command,
      filePath
    };
  } catch (err) {
    console.error(`Error extracting command info from ${filePath}:`, err);
    return null;
  }
}

/**
 * Find identical commands run at different times
 * @param {string} folderPath - Path to folder containing command files
 * @returns {Promise<Array<{command: string, runs: Array<{path: string, timestamp: Date}>, timeDiff: string}>>} - Command groups
 */
async function findSameCommands(folderPath) {
  try {
    // Get all files in the folder
    const files = await fs.readdir(folderPath);
    
    // Extract command info from each file
    const filePromises = files.map(file => {
      const filePath = path.join(folderPath, file);
      return extractCommandInfo(filePath);
    });
    
    const commandInfos = (await Promise.all(filePromises)).filter(info => info !== null);
    
    // Group by command
    const commandGroups = {};
    commandInfos.forEach(info => {
      if (!commandGroups[info.command]) {
        commandGroups[info.command] = [];
      }
      commandGroups[info.command].push({
        path: info.filePath,
        timestamp: info.timestamp
      });
    });
    
    // Filter for commands with multiple runs and calculate time differences
    const result = [];
    Object.entries(commandGroups).forEach(([command, runs]) => {
      if (runs.length > 1) {
        // Sort by timestamp (newest first)
        runs.sort((a, b) => b.timestamp - a.timestamp);
        
        // Calculate time difference between newest and oldest run
        const newestRun = runs[0];
        const oldestRun = runs[runs.length - 1];
        const diffMs = newestRun.timestamp - oldestRun.timestamp;
        
        result.push({
          command,
          runs,
          timeDiff: formatTimeDifference(diffMs)
        });
      }
    });
    
    return result;
  } catch (err) {
    console.error(`Error finding same commands in ${folderPath}:`, err);
    return [];
  }
}

/**
 * Format time difference in a readable format
 * @param {number} diffMs - Time difference in milliseconds
 * @returns {string} - Formatted time difference
 */
function formatTimeDifference(diffMs) {
  const seconds = Math.floor(diffMs / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

module.exports = {
  findSameCommands
};
