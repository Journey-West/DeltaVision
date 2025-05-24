const debug = require('debug')('deltavision:notes-manager');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

// Store notes in memory for quick access
let notes = '';
let notesFilePath = '';

/**
 * Initialize the notes manager
 * Creates the notes file if it doesn't exist
 */
async function initializeNotes() {
  try {
    // Set up the notes file path in the app's user data directory
    const userDataPath = app.getPath('userData');
    notesFilePath = path.join(userDataPath, 'shared_notes.txt');
    debug(`Notes file path: ${notesFilePath}`);
    
    // Check if the notes file exists
    try {
      await fs.access(notesFilePath);
      // File exists, load its contents
      notes = await fs.readFile(notesFilePath, 'utf8');
      debug('Notes file loaded');
    } catch (error) {
      // File doesn't exist, create it
      debug('Notes file does not exist, creating it');
      await fs.writeFile(notesFilePath, '', 'utf8');
      notes = '';
    }
    
    return true;
  } catch (error) {
    debug('Error initializing notes:', error);
    return false;
  }
}

/**
 * Get the current notes
 * @returns {string} The current notes
 */
function getNotes() {
  return notes;
}

/**
 * Update the notes
 * @param {string} newNotes - The new notes content
 * @returns {Promise<boolean>} Success status
 */
async function updateNotes(newNotes) {
  try {
    // Update in-memory notes
    notes = newNotes;
    
    // Write to file
    await fs.writeFile(notesFilePath, newNotes, 'utf8');
    debug('Notes updated successfully');
    
    return true;
  } catch (error) {
    debug('Error updating notes:', error);
    return false;
  }
}

module.exports = {
  initializeNotes,
  getNotes,
  updateNotes
};
