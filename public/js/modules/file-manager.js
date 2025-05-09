// File manager module
export function initFileManager() {
    // State variables
    let oldFiles = [];
    let newFiles = [];
    let timeComparisons = [];
    let selectedFile = null;
    let selectedFileIndex = -1; // Track the currently selected file index
    
    // Fetch file data from API
    async function fetchFileData() {
        try {
            // Show loading state
            document.getElementById('unifiedFileList').innerHTML = '<div class="loading"><div class="spinner"></div>Loading files...</div>';
            
            // Fetch old-new comparison files
            const oldNewResponse = await fetch('/api/files');
            const matchedFiles = await oldNewResponse.json();
            
            // Render the files
            renderFileList(matchedFiles);
            
        } catch (error) {
            console.error('Error fetching file data:', error);
            document.getElementById('unifiedFileList').innerHTML = '<div class="error">Error loading files. Please try again.</div>';
        }
    }
    
    // Render a list of files from the API
    function renderFileList(matchedFiles) {
        const fileListElement = document.getElementById('unifiedFileList');
        if (!fileListElement) return;
        
        if (matchedFiles.length === 0) {
            fileListElement.innerHTML = '<div class="empty-state">No files found. Please configure folder paths.</div>';
            return;
        }
        
        // Sort files by timestamp (newest first)
        matchedFiles.sort((a, b) => b.timestamp - a.timestamp);
        
        let html = '';
        
        // Create HTML for each file entry
        matchedFiles.forEach(file => {
            const { fileType, oldFile, newFile, command, commandRan } = file;
            
            // Get the display name (prefer commandRan, fallback to command, then filename)
            const displayText = commandRan || command || (newFile ? newFile.filename : oldFile ? oldFile.filename : 'Unknown');
            
            // Create appropriate entry based on file type
            if (fileType === 'new-only') {
                html += `
                    <div class="file-entry new-only" data-new-path="${newFile.path}">
                        <strong>${displayText}</strong>
                    </div>
                `;
            } else if (fileType === 'old-only') {
                html += `
                    <div class="file-entry old-only" data-old-path="${oldFile.path}">
                        <strong>${displayText}</strong>
                    </div>
                `;
            } else {
                // Regular comparison
                html += `
                    <div class="file-entry comparison" data-old-path="${oldFile.path}" data-new-path="${newFile.path}">
                        <strong>${displayText}</strong>
                    </div>
                `;
            }
        });
        
        fileListElement.innerHTML = html;
        
        // Add click event listeners to file entries
        const fileEntries = document.querySelectorAll('.file-entry');
        fileEntries.forEach((entry, index) => {
            entry.addEventListener('click', function() {
                selectFile(index);
            });
        });

        // Initialize first file as selected if there are files and none is currently selected
        if (fileEntries.length > 0 && selectedFileIndex === -1) {
            selectFile(0);
        } else if (selectedFileIndex >= 0 && selectedFileIndex < fileEntries.length) {
            // Restore selection if possible
            selectFile(selectedFileIndex, false); // Just highlight without loading
        }
    }

    // Function to select a file by index
    function selectFile(index, loadFile = true) {
        const fileEntries = document.querySelectorAll('.file-entry');
        
        // Remove selection from all files
        fileEntries.forEach(entry => {
            entry.classList.remove('selected');
        });
        
        // If we have files
        if (fileEntries.length > 0) {
            // Make sure index is within bounds
            index = Math.max(0, Math.min(index, fileEntries.length - 1));
            
            // Get the entry and add selected class
            const selectedEntry = fileEntries[index];
            selectedEntry.classList.add('selected');
            selectedFileIndex = index;
            
            // Ensure the selected item is visible in the file list
            selectedEntry.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            
            // Load the file if requested
            if (loadFile) {
                const oldPath = selectedEntry.dataset.oldPath || null;
                const newPath = selectedEntry.dataset.newPath || null;
                loadFileComparison(oldPath, newPath);
            }
        }
    }

    // Load file comparison data and display it
    async function loadFileComparison(oldPath, newPath) {
        try {
            // Show loading state
            const comparisonSection = document.getElementById('comparisonSection');
            const diffViewer = document.getElementById('diffViewer');
            
            if (!comparisonSection || !diffViewer) {
                console.error('Comparison elements not found');
                return;
            }
            
            // Show loading state
            diffViewer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading comparison...</div>';
            comparisonSection.classList.remove('hidden');
            
            // Construct comparison URL based on what paths are provided
            let comparisonUrl = '/api/compare?';
            if (oldPath) {
                comparisonUrl += `oldPath=${encodeURIComponent(oldPath)}`;
            }
            if (newPath) {
                if (oldPath) comparisonUrl += '&';
                comparisonUrl += `newPath=${encodeURIComponent(newPath)}`;
            }
            
            // Fetch comparison data
            const response = await fetch(comparisonUrl);
            const comparisonData = await response.json();
            
            // Store paths and content in diffViewer for later use
            diffViewer.dataset.oldPath = oldPath || '';
            diffViewer.dataset.newPath = newPath || '';
            diffViewer.dataset.oldContent = comparisonData.oldContent || '';
            diffViewer.dataset.newContent = comparisonData.newContent || '';
            diffViewer.dataset.fileType = comparisonData.fileType || 'comparison';
            
            // Display comparison
            displayComparison(comparisonData, oldPath, newPath);
            
        } catch (error) {
            console.error('Error loading file comparison:', error);
            document.getElementById('diffViewer').innerHTML = '<div class="error">Error loading comparison. Please try again.</div>';
        }
    }
    
    // Setup keyboard navigation and shortcuts
    function setupKeyboardNavigation() {
        // Create a shortcut help modal
        createShortcutHelpModal();
        
        document.addEventListener('keydown', function(e) {
            // Don't process shortcuts when user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Get file entries for navigation
            const fileEntries = document.querySelectorAll('.file-entry');
            
            // Show keyboard shortcut help with '?'
            if (e.key === '?' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                toggleShortcutHelpModal();
                return;
            }
            
            // Navigation shortcuts
            switch (e.key) {
                // File list navigation
                case 'ArrowUp':
                    e.preventDefault();
                    if (fileEntries.length > 0) {
                        selectFile(selectedFileIndex - 1);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (fileEntries.length > 0) {
                        selectFile(selectedFileIndex + 1);
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    if (fileEntries.length > 0) {
                        selectFile(0);
                    }
                    break;
                case 'End':
                    e.preventDefault();
                    if (fileEntries.length > 0) {
                        selectFile(fileEntries.length - 1);
                    }
                    break;
                
                // View mode toggle
                case 'd':
                    e.preventDefault();
                    setViewMode('diff');
                    break;
                case 'n':
                    e.preventDefault();
                    setViewMode('new');
                    break;
                
                // Refresh files
                case 'r':
                    if (!e.ctrlKey) { // Only if Ctrl is not pressed (to avoid refresh page)
                        e.preventDefault();
                        refreshFiles();
                    }
                    break;
                
                // Toggle diff features
                case 'm':
                    e.preventDefault();
                    toggleMoveDetection();
                    break;
                case 'h':
                    e.preventDefault();
                    toggleDiffHighlighting();
                    break;
                case 'k':
                    e.preventDefault();
                    toggleKeywordHighlighting();
                    break;
                
                // Diff level switching
                case '1':
                    e.preventDefault();
                    setDiffLevel('line');
                    break;
                case '2':
                    e.preventDefault();
                    setDiffLevel('word');
                    break;
                case '3':
                    e.preventDefault();
                    setDiffLevel('char');
                    break;
                
                // Theme toggle
                case 't':
                    e.preventDefault();
                    if (window.themeManager && window.themeManager.toggleTheme) {
                        window.themeManager.toggleTheme();
                    }
                    break;
                
                // Toggle keyword panel
                case 'w':
                    e.preventDefault();
                    toggleKeywordPanel();
                    break;
                
                // Toggle sidebar
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                
                // Search in current file (simulate Ctrl+F)
                case 'f':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        startSearch();
                    }
                    break;
            }
        });
    }
    
    // Helper function to toggle move detection
    function toggleMoveDetection() {
        const checkbox = document.getElementById('moveDetection');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    }
    
    // Helper function to toggle diff highlighting
    function toggleDiffHighlighting() {
        const checkbox = document.getElementById('diffHighlighting');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    }
    
    // Helper function to toggle keyword highlighting
    function toggleKeywordHighlighting() {
        const checkbox = document.getElementById('keywordHighlighting');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    }
    
    // Helper function to set diff level
    function setDiffLevel(level) {
        const diffLevelSelect = document.getElementById('diffLevel');
        if (diffLevelSelect) {
            diffLevelSelect.value = level;
            diffLevelSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Toggle the sidebar visibility
    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.toggle-sidebar');
        if (sidebar && toggleBtn) {
            sidebar.classList.toggle('collapsed');
            toggleBtn.classList.toggle('collapsed');
        }
    }
    
    // Toggle the keyword panel
    function toggleKeywordPanel() {
        if (window.keywordSystem && window.keywordSystem.toggleKeywordPanel) {
            window.keywordSystem.toggleKeywordPanel();
        }
    }
    
    // Set view mode (diff or new)
    function setViewMode(mode) {
        const diffButton = document.getElementById('diffViewButton');
        const newFileButton = document.getElementById('newFileViewButton');
        
        if (diffButton && newFileButton) {
            if (mode === 'diff' && !diffButton.classList.contains('active')) {
                diffButton.click();
            } else if (mode === 'new' && !newFileButton.classList.contains('active')) {
                newFileButton.click();
            }
        }
    }
    
    // Start search in the current file
    function startSearch() {
        // Use browser's built-in search
        window.find = window.find || function() {};
        window.find('', false, false, true, false, false, false);
    }
    
    // Create the keyboard shortcut help modal
    function createShortcutHelpModal() {
        const modalHtml = `
        <div id="shortcutHelpModal" class="shortcut-modal">
            <div class="shortcut-modal-content">
                <div class="shortcut-modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <span class="shortcut-modal-close">&times;</span>
                </div>
                <div class="shortcut-modal-body">
                    <h3>Navigation</h3>
                    <div class="shortcut-group">
                        <div class="shortcut-item"><span class="key">↑</span> <span class="description">Previous file</span></div>
                        <div class="shortcut-item"><span class="key">↓</span> <span class="description">Next file</span></div>
                        <div class="shortcut-item"><span class="key">Home</span> <span class="description">First file</span></div>
                        <div class="shortcut-item"><span class="key">End</span> <span class="description">Last file</span></div>
                    </div>
                    
                    <h3>View Modes</h3>
                    <div class="shortcut-group">
                        <div class="shortcut-item"><span class="key">d</span> <span class="description">Diff view</span></div>
                        <div class="shortcut-item"><span class="key">n</span> <span class="description">New file view</span></div>
                    </div>
                    
                    <h3>Features</h3>
                    <div class="shortcut-group">
                        <div class="shortcut-item"><span class="key">m</span> <span class="description">Toggle move detection</span></div>
                        <div class="shortcut-item"><span class="key">h</span> <span class="description">Toggle diff highlighting</span></div>
                        <div class="shortcut-item"><span class="key">k</span> <span class="description">Toggle keyword highlighting</span></div>
                        <div class="shortcut-item"><span class="key">w</span> <span class="description">Toggle keyword panel</span></div>
                    </div>
                    
                    <h3>Diff Level</h3>
                    <div class="shortcut-group">
                        <div class="shortcut-item"><span class="key">1</span> <span class="description">Line diff</span></div>
                        <div class="shortcut-item"><span class="key">2</span> <span class="description">Word diff</span></div>
                        <div class="shortcut-item"><span class="key">3</span> <span class="description">Character diff</span></div>
                    </div>
                    
                    <h3>Interface</h3>
                    <div class="shortcut-group">
                        <div class="shortcut-item"><span class="key">t</span> <span class="description">Toggle theme</span></div>
                        <div class="shortcut-item"><span class="key">b</span> <span class="description">Toggle sidebar</span></div>
                        <div class="shortcut-item"><span class="key">r</span> <span class="description">Refresh files</span></div>
                        <div class="shortcut-item"><span class="key">f</span> <span class="description">Search in file</span></div>
                        <div class="shortcut-item"><span class="key">?</span> <span class="description">Show this help</span></div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Add the modal HTML to the document
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // Add event listener to close button
        const closeButton = document.querySelector('.shortcut-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', toggleShortcutHelpModal);
        }
        
        // Close modal when clicking outside of it
        const modal = document.getElementById('shortcutHelpModal');
        if (modal) {
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    toggleShortcutHelpModal();
                }
            });
        }
    }
    
    // Toggle the keyboard shortcut help modal
    function toggleShortcutHelpModal() {
        const modal = document.getElementById('shortcutHelpModal');
        if (modal) {
            const currentDisplay = window.getComputedStyle(modal).display;
            modal.style.display = currentDisplay === 'none' ? 'flex' : 'none';
        }
    }
    
    // Display comparison data
    function displayComparison(comparisonData, oldPath, newPath) {
        const diffViewer = document.getElementById('diffViewer');
        if (!diffViewer) return;
        
        // Statistics functionality has been removed
        
        // Update file metadata in the UI
        updateFileMetadata(oldPath, newPath, comparisonData.fileType);
        
        // Set up view toggle if not already set up
        setupViewToggle(diffViewer);
        
        // Get the view mode buttons
        const diffViewButton = document.getElementById('diffViewButton');
        const newViewButton = document.getElementById('newViewButton');
        
        // If new-only mode, hide diff view button and force new file view
        if (comparisonData.fileType === 'new-only') {
            if (diffViewButton) diffViewButton.style.display = 'none';
            if (newViewButton) {
                newViewButton.classList.add('active');
                // No need to check if it's already active, always show new file view in new-only mode
                renderNewFileView(diffViewer, comparisonData.newContent);
            }
        } else {
            // Normal comparison mode with both files
            if (diffViewButton) diffViewButton.style.display = 'block';
            
            // Render the appropriate view based on which button is active
            if (newViewButton && newViewButton.classList.contains('active')) {
                renderNewFileView(diffViewer, comparisonData.newContent);
            } else {
                renderDiff(diffViewer, comparisonData);
                
                // Set diff view as active by default for comparisons
                if (diffViewButton) {
                    diffViewButton.classList.add('active');
                }
                if (newViewButton) {
                    newViewButton.classList.remove('active');
                }
            }
        }
    }
    
    // Helper to update file type and size information
    function updateFileTypeAndSize(oldPath, newPath) {
    console.log('[updateFileTypeAndSize] Called with:', { oldPath, newPath });
        const typeElement = document.getElementById('fileType');
        const sizeElement = document.getElementById('fileSize');
        const modifiedElement = document.getElementById('modifiedTime');
        
        if (!typeElement || !sizeElement || !modifiedElement) return;
        
        // Reset the content of elements to indicate loading
        typeElement.textContent = 'Type: Loading...';
        sizeElement.textContent = 'Size: Loading...';
        modifiedElement.textContent = 'Modified: Loading...';
        
        // Check if we have a path to get metadata from
        const pathToCheck = newPath || oldPath;
        
        if (pathToCheck) {
            // Fetch and update metadata
            fetchFileMetadata(pathToCheck);
        } else {
            // Clear metadata if no path is available
            typeElement.textContent = 'Type: -';
            sizeElement.textContent = 'Size: -';
            modifiedElement.textContent = 'Modified: -';
        }
    }
    
    // Fetch file metadata from the server
    async function fetchFileMetadata(filePath) {
    console.log('[fetchFileMetadata] Requesting metadata for path:', filePath);
        if (!filePath) {
            console.warn('No file path provided to fetchFileMetadata');
            updateMetadataUI(null, filePath);
            return;
        }
        
        try {
            console.log('Fetching metadata for:', filePath);
            
            // Fetch metadata from API
            const response = await fetch(`/api/file-metadata?path=${encodeURIComponent(filePath)}`);
            console.log('[fetchFileMetadata] Sent request to /api/file-metadata?path=' + encodeURIComponent(filePath));
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Error fetching metadata (${response.status}):`, errorData);
                updateMetadataUI(null, filePath);
                return;
            }
            
            const metadata = await response.json();
            console.log('[fetchFileMetadata] Received metadata:', metadata);
            console.log('Received metadata:', metadata);
            
            // Update UI with the received metadata
            updateMetadataUI(metadata, filePath);
        } catch (error) {
            console.error('Exception retrieving file metadata:', error);
            updateMetadataUI(null, filePath);
        }
    }

    // Helper function to update the metadata UI elements
    function updateMetadataUI(metadata, filePath) {
        // Get UI elements
        const typeElement = document.getElementById('fileType');
        const sizeElement = document.getElementById('fileSize');
        const modifiedElement = document.getElementById('modifiedTime');
        
        if (!typeElement || !sizeElement || !modifiedElement) {
            console.error('Metadata elements not found in DOM');
            return;
        }
        
        if (metadata) {
            // We have metadata from the server
            
            // Use extension from server if available, otherwise extract from path
            const extension = metadata.extension || filePath.split('.').pop().toUpperCase() || 'TXT';
            typeElement.textContent = `Type: ${extension}`;
            
            // Format file size
            if (metadata.size !== undefined) {
                sizeElement.textContent = `Size: ${formatFileSize(metadata.size)}`;
            } else {
                sizeElement.textContent = 'Size: Unknown';
            }
            
            // Format date
            if (metadata.modified) {
                const modifiedDate = new Date(metadata.modified);
                modifiedElement.textContent = `Modified: ${formatDate(modifiedDate)}`;
            } else {
                modifiedElement.textContent = 'Modified: Unknown';
            }
        } else {
            // Fallback values when metadata is not available
            if (filePath) {
                // Extract extension from filename
                const extension = filePath.split('.').pop().toUpperCase() || 'TXT';
                typeElement.textContent = `Type: ${extension}`;
            } else {
                typeElement.textContent = 'Type: -';
            }
            
            sizeElement.textContent = 'Size: -';
            modifiedElement.textContent = 'Modified: -';
        }
    }
    
    // Format file size in a human-readable format
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Format date in a human-readable format
    function formatDate(date) {
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Update file metadata in the comparison header
    function updateFileMetadata(oldPath, newPath, fileType = 'comparison') {
        console.log('[updateFileMetadata] Called with:', { oldPath, newPath, fileType });
        // Get UI elements
        const oldPathElement = document.getElementById('oldFilePath');
        const newPathElement = document.getElementById('newFilePath');
        const oldLabel = document.getElementById('oldLabel');
        const newLabel = document.getElementById('newLabel');
        
        // Check for missing elements and log warnings
        if (!oldPathElement || !newPathElement) {
            console.warn('[updateFileMetadata] Missing path elements:', { oldPathElement, newPathElement });
        }
        
        if (!oldLabel || !newLabel) {
            console.warn('[updateFileMetadata] Missing label elements:', { oldLabel, newLabel });
        }
        
        // Continue with available elements to maximize functionality
        
        // File type specific handling
        if (fileType === 'new-only') {
            // Only new file is available (no old file)
            if (oldLabel) oldLabel.style.display = 'none';
            if (oldPathElement) {
                oldPathElement.textContent = 'No file selected';
                oldPathElement.classList.add('empty');
            }
            
            if (newPath && newLabel) newLabel.style.display = 'block';
            if (newPathElement) {
                newPathElement.textContent = newPath ? newPath.split('/').pop() : 'No file selected';
                newPathElement.classList.remove('empty');
            }
            
            // Update view toggle to only show new file view
            const diffViewButton = document.getElementById('diffViewButton');
            const newViewButton = document.getElementById('newViewButton');
            
            if (diffViewButton) {
                diffViewButton.style.display = 'none';
            }
            if (newViewButton) {
                newViewButton.classList.add('active');
                // Force new file view since diff doesn't make sense
                const diffViewer = document.getElementById('diffViewer');
                if (diffViewer && diffViewer.dataset.newContent) {
                    renderNewFileView(diffViewer, diffViewer.dataset.newContent);
                }
            }
        } else if (fileType === 'old-only') {
            // Only old file is available (no new file)
            if (oldPath && oldLabel) oldLabel.style.display = 'block';
            if (oldPathElement) {
                oldPathElement.textContent = oldPath ? oldPath.split('/').pop() : 'No file selected';
                oldPathElement.classList.remove('empty');
            }
            
            if (newLabel) newLabel.style.display = 'none';
            if (newPathElement) {
                newPathElement.textContent = 'No file selected';
                newPathElement.classList.add('empty');
            }
        } else {
            // Normal comparison (both files available)
            if (oldLabel) oldLabel.style.display = 'block';
            if (oldPathElement) {
                oldPathElement.textContent = oldPath ? oldPath.split('/').pop() : 'No file selected';
                oldPathElement.classList.toggle('empty', !oldPath);
            }
            
            if (newLabel) newLabel.style.display = 'block';
            if (newPathElement) {
                newPathElement.textContent = newPath ? newPath.split('/').pop() : 'No file selected';
                newPathElement.classList.toggle('empty', !newPath);
            }
            
            // Show both view toggle options
            const diffViewButton = document.getElementById('diffViewButton');
            const newViewButton = document.getElementById('newViewButton');
            
            if (diffViewButton) {
                diffViewButton.style.display = 'block';
            }
            if (newViewButton) {
                newViewButton.style.display = 'block';
            }
        }
        
        // Update file type and size information if available
        updateFileTypeAndSize(oldPath, newPath);
    }

    // Render only the new file content
    function renderNewFileView(container, content) {
        if (!container || !content) return;
        
        // Get current file path from container dataset
        const newPath = container.dataset.newPath;
        
        // Hide the old file path section completely
        const oldPathRow = document.querySelector('.file-path-row:first-child');
        if (oldPathRow) {
            oldPathRow.style.display = 'none';
        }
        
        // Update the New file path to show the actual file path
        const newPathElement = document.getElementById('newPath');
        if (newPathElement && newPath) {
            // Extract just the filename from the path
            const filename = newPath.split('/').pop();
            newPathElement.textContent = filename;
            newPathElement.classList.remove('empty');
            newPathElement.title = newPath; // Full path as tooltip
        }
        
        // Ensure file metadata is updated even in new file view
        if (newPath) {
            // Ensure file metadata is up to date
            updateFileTypeAndSize(null, newPath);
        }
        
        const lines = content.split('\n');
        let html = '<div class="new-file-view">';
        
        // Check if keyword highlighting is enabled
        const keywordToggle = document.getElementById('keywordHighlighting');
        const keywordHighlightingEnabled = keywordToggle && keywordToggle.checked;
        
        // Render each line without adding internal line numbers (the UI already shows them in the gutter)
        lines.forEach((line, index) => {
            let processedLine;
            
            // Apply keyword highlighting if enabled
            if (keywordHighlightingEnabled && window.keywordHighlight) {
                processedLine = window.keywordHighlight.highlightLine(line);
            } else {
                processedLine = escapeHtml(line);
            }
            
            // Add line div without including the line number in the content
            html += `<div class="line">${processedLine}</div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // Helper function to determine the CSS class for a line in the diff view
    function getLineClass(currentLine, otherLine, lineIndex, diffLevel, movedLines, otherMovedLines) {
        let lineClass = '';
        
        // Check if this is an empty line
        if (!currentLine && otherLine) {
            // This line doesn't exist in this version but exists in the other
            lineClass = 'removed';
        } else if (currentLine && !otherLine) {
            // This line exists in this version but not in the other
            lineClass = 'added';
        } else if (currentLine && otherLine && currentLine !== otherLine) {
            // This line is different in both versions
            lineClass = 'modified';
        }
        
        // Check if this line has been moved
        if (movedLines && movedLines.has(lineIndex)) {
            lineClass = 'moved';
        }
        
        return lineClass;
    }
    
    // Render diff content
    function renderDiff(container, comparisonData) {
        if (!container || !comparisonData) return;
        
        const oldContent = comparisonData.oldContent || container.dataset.oldContent || '';
        const newContent = comparisonData.newContent || container.dataset.newContent || '';
        
        // Check settings
        const diffHighlightingEnabled = document.getElementById('diffHighlighting').checked;
        const moveDetectionEnabled = document.getElementById('moveDetection').checked;
        const keywordHighlightingEnabled = document.getElementById('keywordHighlighting').checked;
        const diffLevel = document.getElementById('diffLevel').value;
        
        // Split content into lines
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        // Always detect moved lines for statistics, even if toggle is off
        const { movedOldLines, movedNewLines } = detectMovedLines(oldLines, newLines);
        
        // Only use moves for display if the toggle is enabled
        const displayMoves = moveDetectionEnabled;
        
        // Check if there are any moved lines
        const hasMoves = displayMoves && (movedOldLines.size > 0 || movedNewLines.size > 0);
        
        // Create diff table
        let html = `<table class="diff-table${hasMoves ? ' has-moved-lines' : ''}">
            <colgroup>
                <col class="line-num-col" />
                <col class="content-col" />
                <col class="line-num-col" />
                <col class="content-col" />
            </colgroup>
            <thead>
                <tr>
                    <th class="line-number-header">#</th>
                    <th class="content-header">Old</th>
                    <th class="line-number-header">#</th>
                    <th class="content-header">New</th>
                </tr>
            </thead>
            <tbody>`;
        
        // Determine number of lines to show
        const maxLines = Math.max(oldLines.length, newLines.length);
        
        // Stats to be updated during rendering
        let addedCount = 0;
        let removedCount = 0;
        let movedCount = 0;
        let modifiedCount = 0;
        let charChangesCount = 0;
        
        // Then render remaining lines
        for (let i = 0; i < maxLines; i++) {
            const hasOldLine = i < oldLines.length;
            const hasNewLine = i < newLines.length;
            
            const oldLine = hasOldLine ? oldLines[i] : '';
            const newLine = hasNewLine ? newLines[i] : '';
            
            let highlightedOldLine = '';
            let highlightedNewLine = '';
            
            // Apply highlighting based on diffLevel
            if (diffHighlightingEnabled) {
                if (diffLevel === 'line') {
                    // Line level diff (original behavior)
                    highlightedOldLine = keywordHighlightingEnabled && window.keywordHighlight && oldLine ? 
                        window.keywordHighlight.highlightLine(oldLine) : escapeHtml(oldLine);
                    highlightedNewLine = keywordHighlightingEnabled && window.keywordHighlight && newLine ? 
                        window.keywordHighlight.highlightLine(newLine) : escapeHtml(newLine);
                } else if (diffLevel === 'word' || diffLevel === 'char') {
                    // For word/char diff, apply keyword highlighting first if enabled
                    const processedOldLine = keywordHighlightingEnabled && window.keywordHighlight && oldLine ?
                        oldLine : oldLine;
                    const processedNewLine = keywordHighlightingEnabled && window.keywordHighlight && newLine ?
                        newLine : newLine;
                    
                    // Then apply word/char diff 
                    if (hasOldLine && hasNewLine && oldLine !== newLine) {
                        const [markedOldLine, markedNewLine] = diffLevel === 'word' ? 
                            computeWordDiff(processedOldLine, processedNewLine) : 
                            computeCharDiff(processedOldLine, processedNewLine);
                        
                        // Use the marked lines directly
                        highlightedOldLine = markedOldLine;
                        highlightedNewLine = markedNewLine;
                    } else {
                        // No diff needed for identical lines
                        highlightedOldLine = keywordHighlightingEnabled && window.keywordHighlight && oldLine ? 
                            window.keywordHighlight.highlightLine(oldLine) : escapeHtml(oldLine);
                        highlightedNewLine = keywordHighlightingEnabled && window.keywordHighlight && newLine ? 
                            window.keywordHighlight.highlightLine(newLine) : escapeHtml(newLine);
                    }
                }
            } else {
                // No diff highlighting, just apply keyword highlighting if enabled
                highlightedOldLine = keywordHighlightingEnabled && window.keywordHighlight && oldLine ? 
                    window.keywordHighlight.highlightLine(oldLine) : escapeHtml(oldLine);
                highlightedNewLine = keywordHighlightingEnabled && window.keywordHighlight && newLine ? 
                    window.keywordHighlight.highlightLine(newLine) : escapeHtml(newLine);
            }
            
            // Determine CSS classes based on content
            let oldCellClass = "";
            let newCellClass = "";
            
            if (diffHighlightingEnabled && diffLevel === 'line') {
                // First case: Both lines exist
                if (hasOldLine && hasNewLine) {
                    if (oldLine !== newLine) {
                        oldCellClass = "removed";
                        newCellClass = "added";
                        // Count for statistics if not processed as a move
                        if (!(movedOldLines.has(i) || movedNewLines.has(i))) {
                            removedCount++;
                            addedCount++;
                        }
                    }
                } 
                // Second case: Line only exists in old file
                else if (hasOldLine) {
                    oldCellClass = "removed";
                    // Count for statistics if not processed as a move
                    if (!movedOldLines.has(i)) {
                        removedCount++;
                    }
                } 
                // Third case: Line only exists in new file
                else if (hasNewLine) {
                    newCellClass = "added";
                    // Count for statistics if not processed as a move
                    if (!movedNewLines.has(i)) {
                        addedCount++;
                    }
                }
                
                // Special case for new lines at the end of the file
                // Always mark lines beyond old file's length as additions
                if (hasNewLine && i >= oldLines.length) {
                    newCellClass = "added";
                    // Only count if not already counted as moved
                    if (!movedNewLines.has(i) && !newCellClass.includes("added")) {
                        addedCount++;
                    }
                }
            } else {
                // Even when diff highlighting is off, we still need to count for statistics
                if (hasOldLine && hasNewLine) {
                    if (oldLine !== newLine && !(movedOldLines.has(i) || movedNewLines.has(i))) {
                        removedCount++;
                        addedCount++;
                    }
                } else if (hasOldLine && !movedOldLines.has(i)) {
                    removedCount++;
                } else if (hasNewLine && !movedNewLines.has(i)) {
                    addedCount++;
                }
            }
            
            // Apply moved class if this line has been moved
            if (displayMoves) {
                if (hasOldLine && movedOldLines.has(i)) {
                    oldCellClass = "moved";
                }
                if (hasNewLine && movedNewLines.has(i)) {
                    newCellClass = "moved";
                }
            }
            
            const oldLineNum = hasOldLine ? (i + 1) : '';
            const newLineNum = hasNewLine ? (i + 1) : '';
            
            // Enhance line numbers for moved lines
            let oldLineDisplay = oldLineNum;
            let newLineDisplay = newLineNum;
            
            if (moveDetectionEnabled) {
                if (hasOldLine && movedOldLines.has(i)) {
                    const movedToLine = movedOldLines.get(i) + 1; // +1 for 1-based display
                    oldLineDisplay = `<span class="line-number-moved">${oldLineNum} <span class="moved-arrow">→</span> ${movedToLine}</span>`;
                }
                
                if (hasNewLine && movedNewLines.has(i)) {
                    const movedFromLine = movedNewLines.get(i) + 1; // +1 for 1-based display
                    newLineDisplay = `<span class="line-number-moved">${newLineNum} <span class="moved-arrow">←</span> ${movedFromLine}</span>`;
                }
            }
            
            html += `<tr class="${i % 2 === 0 ? 'even-row' : 'odd-row'}">
                <td class="line-number">${oldLineDisplay}</td>
                <td class="${oldCellClass} content-cell">${highlightedOldLine}</td>
                <td class="line-number">${newLineDisplay}</td>
                <td class="${newCellClass} content-cell">${highlightedNewLine}</td>
            </tr>`;
            
            // Handle CSS classes for the line
            const oldLineClass = getLineClass(oldLine, newLine, i, diffLevel, movedOldLines, movedNewLines);
            const newLineClass = getLineClass(newLine, oldLine, i, diffLevel, movedNewLines, movedOldLines);
            
            // Update counts
            if (oldLineClass.includes('removed')) removedCount++;
            if (newLineClass.includes('added')) addedCount++;
            if (oldLineClass.includes('moved') || newLineClass.includes('moved')) movedCount++;
            
            // Calculate modified lines (changed but not purely added/removed)
            if (oldLine && newLine && oldLine !== newLine && 
                !oldLineClass.includes('removed') && !newLineClass.includes('added') && 
                !oldLineClass.includes('moved') && !newLineClass.includes('moved')) {
                modifiedCount++;
            }
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Apply search term highlighting if there's an active search
        highlightSearchTermsInDiffView(container);
        
        // Update summary statistics in the header
        updateSummaryCounters(addedCount, removedCount, movedCount);
        
        // Also update detailed statistics panel if it exists
        updateDetailedStatistics({
            added: addedCount,
            removed: removedCount,
            moved: movedCount,
            modified: modifiedCount,
            totalChanges: addedCount + removedCount + movedCount + modifiedCount,
            oldLines: oldLines.length,
            newLines: newLines.length
        });
    }
    
    // Detect moved lines between old and new content
    function detectMovedLines(oldLines, newLines) {
        const movedOldLines = new Map();
        const movedNewLines = new Map();
        
        // Index unique lines in old content
        const oldLinesMap = new Map();
        oldLines.forEach((line, index) => {
            if (line.trim() !== '') {
                if (!oldLinesMap.has(line)) {
                    oldLinesMap.set(line, []);
                }
                oldLinesMap.get(line).push(index);
            }
        });
        
        // Index unique lines in new content
        const newLinesMap = new Map();
        newLines.forEach((line, index) => {
            if (line.trim() !== '') {
                if (!newLinesMap.has(line)) {
                    newLinesMap.set(line, []);
                }
                newLinesMap.get(line).push(index);
            }
        });
        
        // Find matching lines that appear in both versions at different positions
        for (const [line, oldIndices] of oldLinesMap.entries()) {
            if (newLinesMap.has(line)) {
                const newIndices = newLinesMap.get(line);
                
                // For simplicity, we just map the first occurrence in old to first in new
                // A more sophisticated algorithm could find optimal pairing
                if (oldIndices.length === 1 && newIndices.length === 1) {
                    const oldIndex = oldIndices[0];
                    const newIndex = newIndices[0];
                    
                    // Only mark as moved if positions are different
                    if (oldIndex !== newIndex) {
                        movedOldLines.set(oldIndex, newIndex);
                        movedNewLines.set(newIndex, oldIndex);
                    }
                }
            }
        }
        
        return { movedOldLines, movedNewLines };
    }
    
    // Compute word-level diff
    function computeWordDiff(oldLine, newLine) {
        // Check keyword highlighting directly
        const keywordToggle = document.getElementById('keywordHighlighting');
        const keywordHighlightingOn = keywordToggle && keywordToggle.checked;

        // Apply keyword highlighting if enabled
        if (keywordHighlightingOn && window.keywordHighlight) {
            const escapedOldLine = escapeHtml(oldLine);
            const escapedNewLine = escapeHtml(newLine);
            
            // Split lines into words
            const oldWords = escapedOldLine.split(/(\s+)/).filter(Boolean);
            const newWords = escapedNewLine.split(/(\s+)/).filter(Boolean);
            
            let oldResult = '';
            let newResult = '';
            
            // Simple longest common subsequence algorithm to find common words
            const table = Array(oldWords.length + 1).fill().map(() => Array(newWords.length + 1).fill(0));
            
            // Build LCS table
            for (let i = 1; i <= oldWords.length; i++) {
                for (let j = 1; j <= newWords.length; j++) {
                    if (oldWords[i - 1] === newWords[j - 1]) {
                        table[i][j] = table[i - 1][j - 1] + 1;
                    } else {
                        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                    }
                }
            }
            
            // Backtrace to find differences
            let i = oldWords.length;
            let j = newWords.length;
            
            const oldDiff = new Array(oldWords.length).fill(true);
            const newDiff = new Array(newWords.length).fill(true);
            
            while (i > 0 && j > 0) {
                if (oldWords[i - 1] === newWords[j - 1]) {
                    oldDiff[i - 1] = false; // Not different
                    newDiff[j - 1] = false; // Not different
                    i--;
                    j--;
                } else if (table[i - 1][j] >= table[i][j - 1]) {
                    i--;
                } else {
                    j--;
                }
            }
            
            // Build output with spans for different words
            for (let i = 0; i < oldWords.length; i++) {
                if (oldDiff[i]) {
                    oldResult += `<span class="word-removed">${oldWords[i]}</span>`;
                } else {
                    // Check for keyword and highlight if found
                    const wordToCheck = oldWords[i].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                    if (window.keywordHighlight.shouldHighlight(wordToCheck)) {
                        const highlighted = window.keywordHighlight.highlightWord(wordToCheck);
                        oldResult += highlighted;
                    } else {
                        oldResult += oldWords[i];
                    }
                }
            }
            
            for (let j = 0; j < newWords.length; j++) {
                if (newDiff[j]) {
                    newResult += `<span class="word-added">${newWords[j]}</span>`;
                } else {
                    // Check for keyword and highlight if found
                    const wordToCheck = newWords[j].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                    if (window.keywordHighlight.shouldHighlight(wordToCheck)) {
                        const highlighted = window.keywordHighlight.highlightWord(wordToCheck);
                        newResult += highlighted;
                    } else {
                        newResult += newWords[j];
                    }
                }
            }
            
            return [oldResult, newResult];
        } else {
            // If keyword highlighting is disabled, use the original word diff
            const oldWords = escapeHtml(oldLine).split(/(\s+)/).filter(Boolean);
            const newWords = escapeHtml(newLine).split(/(\s+)/).filter(Boolean);
            
            let oldResult = '';
            let newResult = '';
            
            // Simple longest common subsequence algorithm to find common words
            const table = Array(oldWords.length + 1).fill().map(() => Array(newWords.length + 1).fill(0));
            
            // Build LCS table
            for (let i = 1; i <= oldWords.length; i++) {
                for (let j = 1; j <= newWords.length; j++) {
                    if (oldWords[i - 1] === newWords[j - 1]) {
                        table[i][j] = table[i - 1][j - 1] + 1;
                    } else {
                        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                    }
                }
            }
            
            // Backtrace to find differences
            let i = oldWords.length;
            let j = newWords.length;
            
            const oldDiff = new Array(oldWords.length).fill(true);
            const newDiff = new Array(newWords.length).fill(true);
            
            while (i > 0 && j > 0) {
                if (oldWords[i - 1] === newWords[j - 1]) {
                    oldDiff[i - 1] = false; // Not different
                    newDiff[j - 1] = false; // Not different
                    i--;
                    j--;
                } else if (table[i - 1][j] >= table[i][j - 1]) {
                    i--;
                } else {
                    j--;
                }
            }
            
            // Build output with spans for different words
            for (let i = 0; i < oldWords.length; i++) {
                if (oldDiff[i]) {
                    oldResult += `<span class="word-removed">${oldWords[i]}</span>`;
                } else {
                    oldResult += oldWords[i];
                }
            }
            
            for (let j = 0; j < newWords.length; j++) {
                if (newDiff[j]) {
                    newResult += `<span class="word-added">${newWords[j]}</span>`;
                } else {
                    newResult += newWords[j];
                }
            }
            
            return [oldResult, newResult];
        }
    }
    
    // Compute character-level diff
    function computeCharDiff(oldLine, newLine) {
        // Check keyword highlighting directly
        const keywordToggle = document.getElementById('keywordHighlighting');
        const keywordHighlightingOn = keywordToggle && keywordToggle.checked;
        
        // Simple character-by-character comparison
        const oldChars = escapeHtml(oldLine).split('');
        const newChars = escapeHtml(newLine).split('');
        
        let oldResult = '';
        let newResult = '';
        
        // Simple longest common subsequence algorithm for characters
        const table = Array(oldChars.length + 1).fill().map(() => Array(newChars.length + 1).fill(0));
        
        // Build LCS table
        for (let i = 1; i <= oldChars.length; i++) {
            for (let j = 1; j <= newChars.length; j++) {
                if (oldChars[i - 1] === newChars[j - 1]) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        
        // Backtrace to find differences
        let i = oldChars.length;
        let j = newChars.length;
        
        const oldDiff = new Array(oldChars.length).fill(true);
        const newDiff = new Array(newChars.length).fill(true);
        
        while (i > 0 && j > 0) {
            if (oldChars[i - 1] === newChars[j - 1]) {
                oldDiff[i - 1] = false; // Not different
                newDiff[j - 1] = false; // Not different
                i--;
                j--;
            } else if (table[i - 1][j] >= table[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        
        // Build output with spans for different characters
        let inRemovedSpan = false;
        let inAddedSpan = false;
        
        for (let i = 0; i < oldChars.length; i++) {
            if (oldDiff[i] && !inRemovedSpan) {
                oldResult += '<span class="char-removed">';
                inRemovedSpan = true;
            } else if (!oldDiff[i] && inRemovedSpan) {
                oldResult += '</span>';
                inRemovedSpan = false;
            }
            if (keywordHighlightingOn && window.keywordHighlight && oldChars[i]) {
                const charToCheck = oldChars[i].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                if (window.keywordHighlight.shouldHighlight(charToCheck)) {
                    const highlighted = window.keywordHighlight.highlightChar(charToCheck);
                    oldResult += highlighted;
                } else {
                    oldResult += oldChars[i];
                }
            } else {
                oldResult += oldChars[i];
            }
        }
        
        if (inRemovedSpan) {
            oldResult += '</span>';
        }
        
        for (let j = 0; j < newChars.length; j++) {
            if (newDiff[j] && !inAddedSpan) {
                newResult += '<span class="char-added">';
                inAddedSpan = true;
            } else if (!newDiff[j] && inAddedSpan) {
                newResult += '</span>';
                inAddedSpan = false;
            }
            if (keywordHighlightingOn && window.keywordHighlight && newChars[j]) {
                const charToCheck = newChars[j].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                if (window.keywordHighlight.shouldHighlight(charToCheck)) {
                    const highlighted = window.keywordHighlight.highlightChar(charToCheck);
                    newResult += highlighted;
                } else {
                    newResult += newChars[j];
                }
            } else {
                newResult += newChars[j];
            }
        }
        
        if (inAddedSpan) {
            newResult += '</span>';
        }
        
        return [oldResult, newResult];
    }
    
    // Compute word-level diff that preserves existing HTML tags
    function computeHtmlPreservingWordDiff(processedOldLine, processedNewLine, originalOldLine, originalNewLine) {
        // Use original lines for diff detection
        const oldWords = originalOldLine.split(/(\s+)/).filter(Boolean);
        const newWords = originalNewLine.split(/(\s+)/).filter(Boolean);
        
        // Extract text nodes from processed HTML
        const oldTextNodes = extractTextNodesFromHtml(processedOldLine);
        const newTextNodes = extractTextNodesFromHtml(processedNewLine);
        
        // If extraction failed (rare case), fall back to standard diff
        if (!oldTextNodes.success || !newTextNodes.success) {
            return computeWordDiff(originalOldLine, originalNewLine);
        }
        
        // Perform diff algorithm on original words
        const table = Array(oldWords.length + 1).fill().map(() => Array(newWords.length + 1).fill(0));
        
        // Build LCS table
        for (let i = 1; i <= oldWords.length; i++) {
            for (let j = 1; j <= newWords.length; j++) {
                if (oldWords[i - 1] === newWords[j - 1]) {
                    table[i][j] = table[i - 1][j - 1] + 1;
                } else {
                    table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
                }
            }
        }
        
        // Backtrace to find differences
        let i = oldWords.length;
        let j = newWords.length;
        
        const oldDiff = new Array(oldWords.length).fill(true);
        const newDiff = new Array(newWords.length).fill(true);
        
        while (i > 0 && j > 0) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                oldDiff[i - 1] = false; // Not different
                newDiff[j - 1] = false; // Not different
                i--;
                j--;
            } else if (table[i - 1][j] >= table[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        
        // Apply diff highlights to text nodes while preserving HTML
        let oldResult = rebuildHtmlWithDiff(oldTextNodes.nodes, oldTextNodes.html, oldDiff, "word-removed");
        let newResult = rebuildHtmlWithDiff(newTextNodes.nodes, newTextNodes.html, newDiff, "word-added");
        
        return [oldResult, newResult];
    }
    
    // Compute character-level diff that preserves existing HTML tags
    function computeHtmlPreservingCharDiff(processedOldLine, processedNewLine, originalOldLine, originalNewLine) {
        // Simple fallback for now - actual character diff with HTML preservation would be more complex
        return computeWordDiff(originalOldLine, originalNewLine);
    }
    
    // Extract text nodes from HTML string
    function extractTextNodesFromHtml(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
            const container = doc.body.firstChild;
            
            // Get all text nodes, tracking their positions
            const textNodes = [];
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push({
                    node: node,
                    text: node.textContent
                });
            }
            
            return {
                success: true,
                nodes: textNodes,
                html: html,
                container: container
            };
        } catch (e) {
            console.error('Error extracting text nodes:', e);
            return { success: false };
        }
    }
    
    // Rebuild HTML with diff highlights
    function rebuildHtmlWithDiff(textNodes, originalHtml, diffMap, diffClass) {
        // Simple fallback - in a real implementation, this would rebuild the HTML
        // with diff highlights applied to the specific text nodes
        return originalHtml;
    }
    
    // Helper function to escape HTML special characters
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Set up view toggle functionality
    function setupViewToggle(diffViewer) {
        const diffViewButton = document.getElementById('diffViewButton');
        const newViewButton = document.getElementById('newViewButton');
        
        if (!diffViewButton || !newViewButton) return;
        
        // Check if we have a stored preference for view mode
        const savedViewMode = localStorage.getItem('viewMode');
        
        // Apply the saved view mode if we have one
        if (savedViewMode === 'new' && diffViewer.dataset.newPath) {
            newViewButton.classList.add('active');
            diffViewButton.classList.remove('active');
            renderNewFileView(diffViewer, diffViewer.dataset.newContent);
        } else {
            diffViewButton.classList.add('active');
            newViewButton.classList.remove('active');
        }
        
        // Set up event listeners
        diffViewButton.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Update button states
            this.classList.add('active');
            newViewButton.classList.remove('active');
            
            // Store view mode preference
            localStorage.setItem('viewMode', 'diff');
            
            // Show both file path rows in diff view
            const oldPathRow = document.querySelector('.file-path-row:first-child');
            if (oldPathRow) {
                oldPathRow.style.display = 'flex';
            }
            
            // Show diff view
            renderDiff(diffViewer, {
                oldContent: diffViewer.dataset.oldContent,
                newContent: diffViewer.dataset.newContent,
                fileType: diffViewer.dataset.fileType
            });
        });
        
        newViewButton.addEventListener('click', function() {
            if (this.classList.contains('active')) return;
            
            // Update button states
            this.classList.add('active');
            diffViewButton.classList.remove('active');
            
            // Store view mode preference
            localStorage.setItem('viewMode', 'new');
            
            // Show new file view with metadata
            renderNewFileView(diffViewer, diffViewer.dataset.newContent);
        });
    }
    
    // Toggle sidebar collapse state
    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.toggle-sidebar');
        
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            localStorage.setItem('sidebarCollapsed', 'false');
        } else {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
        }
    }
    
    // Set up sidebar toggle button
    const toggleBtn = document.querySelector('.toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // Load sidebar state from localStorage
    function loadSidebarState() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.toggle-sidebar');
        
        if (sidebar && toggleBtn) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                toggleBtn.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
                toggleBtn.classList.remove('collapsed');
            }
        }
    }
    
    // Set up toggle listeners
    function setupToggleListeners() {
        const diffHighlighting = document.getElementById('diffHighlighting');
        const moveDetection = document.getElementById('moveDetection');
        const keywordHighlighting = document.getElementById('keywordHighlighting');
        const diffLevel = document.getElementById('diffLevel');
        
        // Set initial state from localStorage or default to checked/line
        diffHighlighting.checked = localStorage.getItem('diffHighlighting') !== 'false';
        moveDetection.checked = localStorage.getItem('moveDetection') !== 'false';
        keywordHighlighting.checked = localStorage.getItem('keywordHighlighting') !== 'false';
        diffLevel.value = localStorage.getItem('diffLevel') || 'line';
        
        // Add change listeners
        [diffHighlighting, moveDetection, keywordHighlighting].forEach(toggle => {
            toggle.addEventListener('change', function() {
                localStorage.setItem(this.id, this.checked);
                
                // Re-render the current diff if we have a visible diff
                const diffViewer = document.getElementById('diffViewer');
                if (diffViewer && diffViewer.dataset.oldPath && diffViewer.dataset.newPath) {
                    // Check which view mode is currently active
                    const diffViewButton = document.getElementById('diffViewButton');
                    const newViewButton = document.getElementById('newViewButton');
                    
                    // If new file view is active, update new file view
                    if (newViewButton && newViewButton.classList.contains('active')) {
                        renderNewFileView(diffViewer, diffViewer.dataset.newContent);
                    } else {
                        // Otherwise update diff view
                        refreshDiffView(diffViewer);
                    }
                }
            });
        });
        
        // Add change event for diff level dropdown
        diffLevel.addEventListener('change', function() {
            localStorage.setItem('diffLevel', this.value);
            
            // Re-render the current diff if we have a visible diff
            const diffViewer = document.getElementById('diffViewer');
            if (diffViewer && diffViewer.dataset.oldPath && diffViewer.dataset.newPath) {
                // Check which view mode is currently active
                const diffViewButton = document.getElementById('diffViewButton');
                const newViewButton = document.getElementById('newViewButton');
                
                // Diff level only affects diff view, so only re-render if diff view is active
                if (!newViewButton || !newViewButton.classList.contains('active')) {
                    refreshDiffView(diffViewer);
                }
            }
        });
    }
    
    // Refresh the diff view using stored content
    function refreshDiffView(diffViewer) {
        const comparisonData = {
            oldContent: diffViewer.dataset.oldContent,
            newContent: diffViewer.dataset.newContent
        };
        renderDiff(diffViewer, comparisonData);
    }

    // Refreshes the file list and clears any active filters
    async function refreshFiles() {
        // Clear any active keyword filter directly in the UI
        // This avoids circular references with the keyword system
        const activeFilterIndicator = document.getElementById('activeFilterIndicator');
        if (activeFilterIndicator) {
            activeFilterIndicator.style.display = 'none';
        }
        
        // Also reset the active filter in the keyword system if it's initialized
        if (window.keywordHighlight) {
            // Call clearActiveFilter directly without the circular reference
            if (window.keywordHighlight.clearActiveFilter) {
                window.keywordHighlight.clearActiveFilter();
            }
        }
        
        // Show loading state in the unified list
        const unifiedList = document.getElementById('unifiedFileList');
        if (unifiedList) {
            unifiedList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading files...</div>';
        }
        
        // Fetch fresh data
        await fetchFileData();
    } // End of refreshFiles function
    
    // Set up refresh button
    const refreshBtn = document.getElementById('refreshButton');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshFiles);
    }
    
    // Helper function to update summary counters in the diff area header
    function updateSummaryCounters(added, removed, moved) {
        // Update the line count indicators in the file summary header
        const addedCounter = document.getElementById('addedLines');
        const removedCounter = document.getElementById('removedLines');
        const movedCounter = document.getElementById('movedLines');
        
        if (addedCounter) addedCounter.textContent = added;
        if (removedCounter) removedCounter.textContent = removed;
        if (movedCounter) movedCounter.textContent = moved;
    }
    
    // Helper function to update detailed statistics panel
    function updateDetailedStatistics(stats) {
        // Update the detailed stats in the change statistics panel
        const detailedElements = {
            added: document.getElementById('detailedAddedCount'),
            removed: document.getElementById('detailedRemovedCount'),
            moved: document.getElementById('detailedMovedCount'),
            modified: document.getElementById('detailedModifiedCount'),
            total: document.getElementById('totalChangesCount')
        };
        
        // Update counter values
        if (detailedElements.added) detailedElements.added.textContent = stats.added;
        if (detailedElements.removed) detailedElements.removed.textContent = stats.removed;
        if (detailedElements.moved) detailedElements.moved.textContent = stats.moved;
        if (detailedElements.modified) detailedElements.modified.textContent = stats.modified;
        if (detailedElements.total) detailedElements.total.textContent = stats.totalChanges;
        
        // Update percentage bar if it exists
        const percentageBar = document.getElementById('percentageBar');
        const percentageText = document.getElementById('percentageText');
        
        if (percentageBar && percentageText) {
            const totalLines = Math.max(stats.oldLines, stats.newLines);
            const percentChanged = totalLines > 0 ? Math.round((stats.totalChanges / totalLines) * 100) : 0;
            
            percentageBar.style.width = `${percentChanged}%`;
            percentageText.textContent = `${percentChanged}% of file changed`;
        }
        
        // Update stat bars
        updateStatBar('addedBar', stats.added, stats.totalChanges);
        updateStatBar('removedBar', stats.removed, stats.totalChanges);
        updateStatBar('movedBar', stats.moved, stats.totalChanges);
        updateStatBar('modifiedBar', stats.modified, stats.totalChanges);
    }
    
    // Helper to update the visualization bars
    function updateStatBar(barId, value, total) {
        const bar = document.getElementById(barId);
        if (bar) {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            bar.style.width = `${percentage}%`;
        }
    }

    // Function to highlight search terms in the diff view after rendering
    function highlightSearchTermsInDiffView(container) {
        // Check if there's an active search query to highlight
        if (!window.fileSearch || 
            typeof window.fileSearch.getCurrentQuery !== 'function' || 
            typeof window.fileSearch.isSearchActive !== 'function') {
            return; // Search module not available
        }
        
        const searchQuery = window.fileSearch.getCurrentQuery();
        if (!searchQuery || !window.fileSearch.isSearchActive()) {
            return; // No active search
        }
        
        try {
            console.log(`[highlightSearchTermsInDiffView] Highlighting search term: "${searchQuery}"`);
            
            // Get all text content from the diff view (the content cells)
            const contentCells = container.querySelectorAll('td.content-cell');
            if (!contentCells || contentCells.length === 0) {
                return; // No content cells found
            }
            
            // Create a text node walker to find text nodes containing our search term
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Skip nodes that are empty or only whitespace
                        if (!node.textContent.trim()) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        // Accept nodes containing the search term (case insensitive)
                        if (node.textContent.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );
            
            // Create a document fragment to store the current node text
            const parser = new DOMParser();
            const replacements = [];
            
            // Walk through text nodes and collect those containing our search term
            let currentNode;
            while (currentNode = walker.nextNode()) {
                // Skip nodes that are inside a .search-term-highlight span
                let parent = currentNode.parentNode;
                let isInsideHighlight = false;
                
                while (parent && parent !== container) {
                    if (parent.classList && parent.classList.contains('search-term-highlight')) {
                        isInsideHighlight = true;
                        break;
                    }
                    parent = parent.parentNode;
                }
                
                if (isInsideHighlight) {
                    continue; // Skip nodes already inside a highlight
                }
                
                // Replace the text with highlighted version
                const text = currentNode.textContent;
                const escapedTerm = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedTerm})`, 'gi');
                const highlightedText = text.replace(regex, '<span class="search-term-highlight">$1</span>');
                
                if (text !== highlightedText) {
                    // Store the node and its replacement for later processing
                    replacements.push({
                        node: currentNode,
                        html: highlightedText
                    });
                }
            }
            
            // Now replace all the identified nodes
            replacements.forEach(replacement => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = replacement.html;
                
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                
                replacement.node.parentNode.replaceChild(fragment, replacement.node);
            });
            
            console.log(`[highlightSearchTermsInDiffView] Highlighted ${replacements.length} occurrences of "${searchQuery}"`);
            
        } catch (error) {
            console.error('Error highlighting search terms in diff view:', error);
        }
    }
    
    // Expose key functions to the window for use by other components
    window.loadFileComparison = loadFileComparison;
    
    // Initial setup
    loadSidebarState();
    setupToggleListeners();
    setupKeyboardNavigation(); // Add keyboard navigation setup
    fetchFileData(); // This is critical for loading the files on startup
    
    // Return public methods
    return {
        refreshFiles,
        toggleSidebar,
        loadFileComparison
    };
}
