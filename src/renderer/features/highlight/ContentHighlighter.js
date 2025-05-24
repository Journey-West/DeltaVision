/**
 * ContentHighlighter.js
 * Utility functions for highlighting search terms in text content
 */

/**
 * Highlight occurrences of a search term in text content
 * @param {string} content - The text content to highlight
 * @param {string} searchTerm - The term to highlight
 * @param {Object} options - Highlighting options
 * @param {boolean} options.caseSensitive - Whether to match case sensitively
 * @param {boolean} options.useThemeColors - Whether to use theme-aware colors
 * @returns {string} - HTML string with highlighted search terms
 */
export function highlightText(content, searchTerm, options = {}) {
  if (!searchTerm || !content) return content;
  
  const { caseSensitive = false, useThemeColors = true } = options;
  
  // Create a safe HTML representation
  const escapedContent = escapeHtml(content);
  
  // Create a RegExp for the search term with proper escaping
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedSearchTerm = escapeRegExp(searchTerm);
  const regex = new RegExp(escapedSearchTerm, flags);
  
  // Replace with highlighted version
  return escapedContent.replace(regex, (match) => {
    return `<mark class="match-highlight">${match}</mark>`;
  });
}

/**
 * Highlight occurrences of a search term in a line-by-line array
 * @param {Array<string>} lines - Array of text lines
 * @param {string} searchTerm - The term to highlight
 * @param {Object} options - Highlighting options
 * @param {boolean} options.caseSensitive - Whether to match case sensitively
 * @returns {Array<{line: string, hasMatch: boolean, matchCount: number, matchPositions: Array}>} - Array of lines with highlight HTML and match data
 */
export function highlightLines(lines, searchTerm, options = {}) {
  if (!searchTerm || !lines || !lines.length) {
    return lines.map(line => ({ 
      line, 
      hasMatch: false, 
      matchCount: 0,
      matchPositions: []
    }));
  }
  
  const { caseSensitive = false } = options;
  
  // Create a RegExp for the search term with proper escaping
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedSearchTerm = escapeRegExp(searchTerm);
  const regex = new RegExp(escapedSearchTerm, flags);
  
  let totalMatchIndex = 0;
  
  return lines.map((line, lineIndex) => {
    const escapedLine = escapeHtml(line);
    const lineMatches = []; 
    // Calculate match positions based on the escapedLine to ensure indices are correct after HTML escaping.
    const processedSearchTargetString = caseSensitive ? escapedLine : escapedLine.toLowerCase();
    const processedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    let matchPositions = [];
    let currentIndex = 0; 
    let matchStartIndexInSearchTarget;

    // Find all matches in this line and collect their positions relative to escapedLine
    while ((matchStartIndexInSearchTarget = processedSearchTargetString.indexOf(processedSearchTerm, currentIndex)) !== -1) {
      matchPositions.push({
        start: matchStartIndexInSearchTarget, 
        end: matchStartIndexInSearchTarget + searchTerm.length, 
        globalIndex: totalMatchIndex++
      });
      currentIndex = matchStartIndexInSearchTarget + searchTerm.length; 
    }
    
    const hasMatch = matchPositions.length > 0;
    const matchCount = matchPositions.length;
    
    if (hasMatch) {
      // Sort matches by position to ensure correct order
      matchPositions.sort((a, b) => a.start - b.start);
      
      // Apply highlighting with data attributes for each match
      let highlightedLine = escapedLine;
      let offset = 0;
      
      matchPositions.forEach((pos, idx) => {
        const matchId = `match-${lineIndex}-${idx}`;
        const matchText = highlightedLine.substring(pos.start + offset, pos.end + offset);
        const replacement = `<mark class="match-highlight" data-match-id="${matchId}" data-global-index="${pos.globalIndex}">${matchText}</mark>`;
        
        highlightedLine = 
          highlightedLine.substring(0, pos.start + offset) + 
          replacement + 
          highlightedLine.substring(pos.end + offset);
        
        // Adjust offset for next replacement
        offset += replacement.length - matchText.length;
      });
      
      return { 
        line: highlightedLine, 
        hasMatch, 
        matchCount,
        matchPositions
      };
    }
    
    return { 
      line: escapedLine, 
      hasMatch, 
      matchCount,
      matchPositions
    };
  });
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Escape special characters in a string for use in a RegExp
 * @param {string} string - String to escape
 * @returns {string} - Escaped string safe for RegExp
 */
function escapeRegExp(string) {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count occurrences of a search term in text
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to search for
 * @param {Object} options - Search options
 * @param {boolean} options.caseSensitive - Whether to match case sensitively
 * @returns {number} - Number of occurrences
 */
export function countMatches(text, searchTerm, options = {}) {
  if (!text || !searchTerm) return 0;
  
  const { caseSensitive = false } = options;
  
  const processedText = caseSensitive ? text : text.toLowerCase();
  const processedTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  let count = 0;
  let position = processedText.indexOf(processedTerm);
  
  while (position !== -1) {
    count++;
    position = processedText.indexOf(processedTerm, position + 1);
  }
  
  return count;
}
