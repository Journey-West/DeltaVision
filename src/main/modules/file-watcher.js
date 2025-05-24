const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

/**
 * File watcher module
 * Watches directories for changes and triggers callbacks
 */

// Store active watchers
const activeWatchers = new Map();

/**
 * Watch a directory for changes
 * @param {string} dirPath - Directory path to watch
 * @param {string} watcherId - Unique ID for this watcher
 * @param {function} onChange - Callback function when changes are detected
 * @returns {boolean} - Success status
 */
function watchDirectory(dirPath, watcherId, onChange) {
  try {
    // Validate directory
    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error(`Invalid directory path: ${dirPath}`);
      return false;
    }

    // Stop existing watcher if it exists
    if (activeWatchers.has(watcherId)) {
      stopWatching(watcherId);
    }

    // Initialize watcher
    const watcher = chokidar.watch(dirPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    // Set up event handlers
    watcher.on('add', (filePath) => {
      console.log(`File added: ${filePath}`);
      if (onChange) onChange('add', filePath);
    });

    watcher.on('unlink', (filePath) => {
      console.log(`File removed: ${filePath}`);
      if (onChange) onChange('remove', filePath);
    });

    watcher.on('change', (filePath) => {
      console.log(`File changed: ${filePath}`);
      if (onChange) onChange('change', filePath);
    });

    watcher.on('error', (error) => {
      console.error(`Watcher error: ${error}`);
    });

    // Store the watcher
    activeWatchers.set(watcherId, watcher);
    console.log(`Started watching directory: ${dirPath} with ID: ${watcherId}`);
    return true;
  } catch (error) {
    console.error(`Error setting up directory watcher: ${error.message}`);
    return false;
  }
}

/**
 * Stop watching a directory
 * @param {string} watcherId - ID of the watcher to stop
 * @returns {boolean} - Success status
 */
function stopWatching(watcherId) {
  try {
    if (activeWatchers.has(watcherId)) {
      const watcher = activeWatchers.get(watcherId);
      watcher.close();
      activeWatchers.delete(watcherId);
      console.log(`Stopped watching directory with ID: ${watcherId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error stopping watcher: ${error.message}`);
    return false;
  }
}

/**
 * Stop all active watchers
 */
function stopAllWatchers() {
  try {
    for (const [watcherId, watcher] of activeWatchers.entries()) {
      watcher.close();
      console.log(`Stopped watching directory with ID: ${watcherId}`);
    }
    activeWatchers.clear();
    return true;
  } catch (error) {
    console.error(`Error stopping all watchers: ${error.message}`);
    return false;
  }
}

module.exports = {
  watchDirectory,
  stopWatching,
  stopAllWatchers
};
