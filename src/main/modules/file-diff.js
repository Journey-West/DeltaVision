const { readFileContent } = require('./file-system-api');
const Diff = require('diff');
const fs = require('fs').promises;

/**
 * File diffing module
 * Handles comparison of file contents
 * Supports both line-level and word-level diffing
 */

/**
 * Compare two files and generate a diff
 * @param {string|null} oldFilePath - Path to the old file (can be null for new-only files)
 * @param {string|null} newFilePath - Path to the new file (can be null for old-only files)
 * @param {string} diffMode - Diffing mode ('line' or 'word')
 * @returns {Promise<Object>} - Diff result
 */
async function compareFiles(oldFilePath, newFilePath, diffMode = 'line') {
  try {
    let oldContent = '';
    let newContent = '';
    let oldFileStats = null;
    let newFileStats = null;
    
    // Handle different cases: both files exist, new-only, or old-only
    if (oldFilePath && newFilePath) {
      oldContent = await readFileContent(oldFilePath);
      newContent = await readFileContent(newFilePath);
      oldFileStats = await fs.stat(oldFilePath);
      newFileStats = await fs.stat(newFilePath);
    } else if (!oldFilePath && newFilePath) {
      // New-only file
      oldContent = '';
      newContent = await readFileContent(newFilePath);
      newFileStats = await fs.stat(newFilePath);
    } else if (oldFilePath && !newFilePath) {
      // Old-only file
      oldContent = await readFileContent(oldFilePath);
      newContent = '';
      oldFileStats = await fs.stat(oldFilePath);
    } else {
      throw new Error('Both oldFilePath and newFilePath cannot be null');
    }
    
    // Format file metadata
    const oldFileMeta = oldFileStats ? {
      size: formatFileSize(oldFileStats.size),
      modifiedDate: new Date(oldFileStats.mtime).toLocaleString(),
      fullPath: oldFilePath
    } : null;
    
    const newFileMeta = newFileStats ? {
      size: formatFileSize(newFileStats.size),
      modifiedDate: new Date(newFileStats.mtime).toLocaleString(),
      fullPath: newFilePath
    } : null;
    
    // Generate diff based on selected mode
    let diffResult;
    let wordDiffResult = null;
    
    if (diffMode === 'word') {
      // For word-level diff, we still need line-level diff for structure
      diffResult = Diff.diffLines(oldContent, newContent);
      // Also generate word-level diffs for each line
      wordDiffResult = generateWordDiffs(oldContent, newContent, diffResult);
    } else {
      // Standard line-level diff
      diffResult = Diff.diffLines(oldContent, newContent);
    }
    
    return {
      oldFilePath,
      newFilePath,
      oldFileMeta,
      newFileMeta,
      diffResult,
      wordDiffResult,
      diffMode,
      // Include raw content for keyword searching
      oldContent,
      newContent
    };
  } catch (error) {
    console.error(`Error comparing files ${oldFilePath || 'null'} and ${newFilePath || 'null'}:`, error);
    throw error;
  }
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compare multiple file pairs
 * @param {Array} filePairs - Array of file pairs to compare with optional diffMode
 * @returns {Promise<Array>} - Array of diff results
 */
async function compareFilePairs(filePairs) {
  const results = [];
  
  for (const pair of filePairs) {
    try {
      // Use the diffMode from the pair if provided, otherwise default to 'line'
      const diffMode = pair.diffMode || 'line';
      const diffResult = await compareFiles(pair.oldFile, pair.newFile, diffMode);
      results.push({
        ...pair,
        diff: diffResult.diffResult,
        oldFileMeta: diffResult.oldFileMeta,
        newFileMeta: diffResult.newFileMeta,
        oldContent: diffResult.oldContent,
        newContent: diffResult.newContent
      });
    } catch (error) {
      console.error(`Error comparing file pair ${pair.oldFile || 'new file'} and ${pair.newFile}:`, error);
      // Continue with other pairs
    }
  }
  
  return results;
}

/**
 * Generate word-level diffs for each line in the line-level diff
 * @param {string} oldContent - Content of the old file
 * @param {string} newContent - Content of the new file
 * @param {Array} lineDiff - Line-level diff result
 * @returns {Object} - Word-level diff information with aligned rows
 */
function generateWordDiffs(oldContent, newContent, lineDiff) {
  const rows = [];
  // Use a single line number counter for both sides to ensure consistency with Line Diff mode
  let lineNumber = 1;
  let rowId = 0;

  for (let i = 0; i < lineDiff.length; i++) {
    const part = lineDiff[i];
    const partLines = part.value.split('\n');
    // The split operation on a string ending with '\n' results in an extra empty string at the end.
    // If the part.value is just "\n" (an empty line), split gives ["", ""].
    // If part.value is "content\n", split gives ["content", ""].
    // We want to process each actual line, including intentionally empty ones.
    
    // Handle newlines exactly the same way as processNormalDiff in DiffViewer.svelte
    // This ensures consistent behavior between Line Diff and Word Diff modes
    if (partLines.length > 0 && partLines[partLines.length - 1] === '') {
      partLines.pop();
    }
    
    // Handle case where part.value is just "" (e.g. from an empty file diff)
    if (partLines.length === 0 && part.value === '') {
        // This case means the original part.value was empty, so no lines to process for it.
        // This shouldn't happen with diffLines unless an empty file is diffed, resulting in no changes.
        continue;
    }


    if (part.added) {
      // This 'added' block might be part of a modification.
      // The logic below handles modifications by looking ahead when a 'removed' block is encountered.
      // So, if we reach an 'added' block here, it means it's purely an addition, not preceded by a 'removed' match.
      partLines.forEach(lineContent => {
        rows.push({
          id: `row-${rowId++}`,
          lineNumber: lineNumber, // Use the shared line counter
          type: 'added',
          left: { number: lineNumber, content: '', type: 'empty' }, // Use the same line number for both sides
          right: { number: lineNumber, content: lineContent, type: 'added' }
        });
        lineNumber++; // Increment the shared line counter
      });
    } else if (part.removed) {
      // Check if the *next* part is 'added' to form a modification block
      if (i + 1 < lineDiff.length && lineDiff[i + 1].added) {
        const removedBlockLines = partLines;
        const addedBlockLinesRaw = lineDiff[i + 1].value.split('\n');
        if (addedBlockLinesRaw.length > 0 && addedBlockLinesRaw[addedBlockLinesRaw.length - 1] === '' && lineDiff[i + 1].value !== '') {
          addedBlockLinesRaw.pop();
        }

        const maxBlockLines = Math.max(removedBlockLines.length, addedBlockLinesRaw.length);

        for (let j = 0; j < maxBlockLines; j++) {
          const oldLineContent = removedBlockLines[j];
          const newLineContent = addedBlockLinesRaw[j];
          // Use the shared line counter instead of separate counters
          const currentLineNum = lineNumber + j;

          if (oldLineContent !== undefined && newLineContent !== undefined) {
            const wordDiff = Diff.diffWordsWithSpace(oldLineContent, newLineContent);
            rows.push({
              id: `row-${rowId++}`,
              lineNumber: currentLineNum,
              type: 'modified',
              left: { number: currentLineNum, content: oldLineContent, wordDiff: wordDiff, type: 'modified' },
              right: { number: currentLineNum, content: newLineContent, wordDiff: wordDiff, type: 'modified' }
            });
          } else if (oldLineContent !== undefined) {
            rows.push({
              id: `row-${rowId++}`,
              lineNumber: currentLineNum,
              type: 'removed',
              left: { number: currentLineNum, content: oldLineContent, type: 'removed' },
              right: { number: currentLineNum, content: '', type: 'empty' }
            });
          } else { // newLineContent must be defined
            rows.push({
              id: `row-${rowId++}`,
              lineNumber: currentLineNum,
              type: 'added',
              left: { number: currentLineNum, content: '', type: 'empty' },
              right: { number: currentLineNum, content: newLineContent, type: 'added' }
            });
          }
        }
        // Increment the shared line counter by the maximum number of lines
        lineNumber += maxBlockLines;
        i++; // Increment i to skip the 'added' part as it's now processed
      } else {
        // Purely removed lines
        partLines.forEach(lineContent => {
          rows.push({
            id: `row-${rowId++}`,
            lineNumber: lineNumber,
            type: 'removed',
            left: { number: lineNumber, content: lineContent, type: 'removed' },
            right: { number: lineNumber, content: '', type: 'empty' }
          });
          lineNumber++; // Increment the shared line counter
        });
      }
    } else { // Unchanged part (common lines)
      partLines.forEach(lineContent => {
        rows.push({
          id: `row-${rowId++}`,
          lineNumber: lineNumber,
          type: 'unchanged',
          left: { number: lineNumber, content: lineContent, type: 'unchanged' },
          right: { number: lineNumber, content: lineContent, type: 'unchanged' }
        });
        lineNumber++; // Increment the shared line counter
      });
    }
  }
  return rows;
}

module.exports = {
  compareFiles,
  compareFilePairs
};
