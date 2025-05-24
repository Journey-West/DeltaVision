/**
 * Utility to determine appropriate icon for file types
 * Used by both browser and desktop views
 */

/**
 * Get appropriate icon name for a file based on its extension or type
 * @param {string} filename - The name of the file
 * @returns {string} - Icon identifier to use for the file
 */
export function getFileIcon(filename) {
  if (!filename) return 'file'; // Default icon
  
  // Get file extension (lowercase)
  const ext = filename.split('.').pop().toLowerCase();
  
  // Common file type mappings
  switch (ext) {
    case 'pdf':
      return 'file-pdf';
    case 'doc':
    case 'docx':
    case 'odt':
      return 'file-word';
    case 'xls':
    case 'xlsx':
    case 'ods':
      return 'file-excel';
    case 'ppt':
    case 'pptx':
    case 'odp':
      return 'file-powerpoint';
    case 'txt':
    case 'md':
    case 'rtf':
      return 'file-text';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'file-image';
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return 'file-audio';
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return 'file-video';
    case 'zip':
    case 'rar':
    case 'tar':
    case '7z':
    case 'gz':
      return 'file-archive';
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return 'file-code-js';
    case 'html':
    case 'htm':
    case 'xml':
      return 'file-code-html';
    case 'css':
    case 'scss':
    case 'less':
      return 'file-code-css';
    case 'py':
      return 'file-code-python';
    case 'java':
      return 'file-code-java';
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return 'file-code-c';
    default:
      return 'file'; // Default file icon
  }
}
