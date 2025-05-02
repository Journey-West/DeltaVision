"use strict";

// App.jsx - Main React component for DeltaVision
// This file contains the React components extracted from inline JSX in index.html

// Global state initialization (moved from inline script)
window.appState = {
  highlightingEnabled: localStorage.getItem('highlightingEnabled') === null ? true : localStorage.getItem('highlightingEnabled') === 'true',
  diffHighlightingEnabled: localStorage.getItem('diffHighlightingEnabled') === null ? true : localStorage.getItem('diffHighlightingEnabled') === 'true',
  moveDetectionEnabled: localStorage.getItem('moveDetectionEnabled') === null ? true : localStorage.getItem('moveDetectionEnabled') === 'true'
};

// Main FileList component
function FileList({
  files,
  onFileSelect,
  type
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "file-list-section"
  }, /*#__PURE__*/React.createElement("h3", null, type === 'time-comparisons' ? 'Time-based Comparisons' : 'File Comparisons'), /*#__PURE__*/React.createElement("div", {
    className: "file-list"
  }, files.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("p", null, "No files found")) : files.map((file, index) => /*#__PURE__*/React.createElement(FileEntry, {
    key: index,
    file: file,
    onClick: () => onFileSelect(file),
    type: type
  }))));
}

// FileEntry component
function FileEntry({
  file,
  onClick,
  type
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "file-entry",
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: `type-label ${type === 'time-comparisons' ? 'type-time-label' : 'type-old-new-label'}`
  }, type === 'time-comparisons' ? 'Time' : 'Old/New'), /*#__PURE__*/React.createElement("div", {
    className: "file-name"
  }, /*#__PURE__*/React.createElement("strong", null, file.filename)), /*#__PURE__*/React.createElement("div", {
    className: "file-path"
  }, file.path), type === 'time-comparisons' && /*#__PURE__*/React.createElement("div", {
    className: "time-diff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "time-icon"
  }, "\u23F1\uFE0F"), " ", file.timeDiff), /*#__PURE__*/React.createElement("div", {
    className: "file-tooltip"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Filename:"), " ", file.filename), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Path:"), " ", file.path), file.oldPath && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Old Path:"), " ", file.oldPath), file.newPath && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "New Path:"), " ", file.newPath), file.timeDiff && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Time Difference:"), " ", file.timeDiff), file.command && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Command:"), " ", file.command)));
}

// Export the components
window.FileList = FileList;
window.FileEntry = FileEntry;

// DiffViewer component
function DiffViewer({
  oldContent,
  newContent,
  fileExtension
}) {
  const containerRef = React.useRef(null);
  const [highlightedOldContent, setHighlightedOldContent] = React.useState('');
  const [highlightedNewContent, setHighlightedNewContent] = React.useState('');
  React.useEffect(() => {
    // Apply syntax highlighting and keyword highlighting here
    // This is a simplified version
    setHighlightedOldContent(oldContent);
    setHighlightedNewContent(newContent);

    // Apply any highlighting based on appState
    if (containerRef.current) {
      if (window.appState.highlightingEnabled) {
        // Apply keyword highlighting
      }
    }
  }, [oldContent, newContent, fileExtension]);
  return /*#__PURE__*/React.createElement("div", {
    className: "diff-container",
    ref: containerRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "diff-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "diff-title"
  }, "File Comparison"), /*#__PURE__*/React.createElement("div", {
    className: "diff-controls"
  }, /*#__PURE__*/React.createElement("label", {
    className: "switch"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: window.appState.highlightingEnabled,
    onChange: () => {
      window.appState.highlightingEnabled = !window.appState.highlightingEnabled;
      localStorage.setItem('highlightingEnabled', window.appState.highlightingEnabled);
      // Force re-render
      setHighlightedOldContent(oldContent);
      setHighlightedNewContent(newContent);
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "slider round"
  }), /*#__PURE__*/React.createElement("span", {
    className: "switch-label"
  }, "Keyword Highlight")))), /*#__PURE__*/React.createElement("div", {
    className: "diff-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "old-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "file-content"
  }, /*#__PURE__*/React.createElement("pre", null, /*#__PURE__*/React.createElement("code", {
    dangerouslySetInnerHTML: {
      __html: highlightedOldContent
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "new-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "file-content"
  }, /*#__PURE__*/React.createElement("pre", null, /*#__PURE__*/React.createElement("code", {
    dangerouslySetInnerHTML: {
      __html: highlightedNewContent
    }
  }))))));
}

// Export the DiffViewer component
window.DiffViewer = DiffViewer;

// Main App component to tie everything together
function App() {
  const [files, setFiles] = React.useState([]);
  const [timeComparisons, setTimeComparisons] = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [oldContent, setOldContent] = React.useState('');
  const [newContent, setNewContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [comparisonType, setComparisonType] = React.useState('file-comparisons');

  // Load files on component mount
  React.useEffect(() => {
    fetchFiles();
    fetchTimeComparisons();
  }, []);

  // Function to fetch files from the API
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);
      setLoading(false);
    }
  };

  // Function to fetch time-based comparisons
  const fetchTimeComparisons = async () => {
    try {
      const response = await fetch('/api/time-comparisons');
      const data = await response.json();
      setTimeComparisons(data);
    } catch (error) {
      console.error('Error fetching time comparisons:', error);
    }
  };

  // Function to handle file selection
  const handleFileSelect = async file => {
    setSelectedFile(file);
    setLoading(true);
    try {
      let response;
      if (comparisonType === 'file-comparisons') {
        response = await fetch(`/api/compare?oldPath=${encodeURIComponent(file.oldPath)}&newPath=${encodeURIComponent(file.newPath)}`);
      } else {
        response = await fetch(`/api/compare?oldPath=${encodeURIComponent(file.oldFile.path)}&newPath=${encodeURIComponent(file.newFile.path)}`);
      }
      const data = await response.json();
      setOldContent(data.oldContent);
      setNewContent(data.newContent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching file content:', error);
      setLoading(false);
    }
  };

  // Function to switch between comparison types
  const switchComparisonType = type => {
    setComparisonType(type);
    setSelectedFile(null);
    setOldContent('');
    setNewContent('');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "comparison-type-selector"
  }, /*#__PURE__*/React.createElement("button", {
    className: comparisonType === 'file-comparisons' ? 'active' : '',
    onClick: () => switchComparisonType('file-comparisons')
  }, "File Comparisons"), /*#__PURE__*/React.createElement("button", {
    className: comparisonType === 'time-comparisons' ? 'active' : '',
    onClick: () => switchComparisonType('time-comparisons')
  }, "Time Comparisons"))), loading && files.length === 0 && timeComparisons.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading files...") : /*#__PURE__*/React.createElement(React.Fragment, null, comparisonType === 'file-comparisons' ? /*#__PURE__*/React.createElement(FileList, {
    files: files,
    onFileSelect: handleFileSelect,
    type: "file-comparisons"
  }) : /*#__PURE__*/React.createElement(FileList, {
    files: timeComparisons,
    onFileSelect: handleFileSelect,
    type: "time-comparisons"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "comparison-section"
  }, selectedFile ? loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "Loading comparison...") : /*#__PURE__*/React.createElement(DiffViewer, {
    oldContent: oldContent,
    newContent: newContent,
    fileExtension: selectedFile.filename.split('.').pop()
  }) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state-comparison"
  }, /*#__PURE__*/React.createElement("p", null, "Select a file to view comparison"))));
}

// Export the App component and render it
window.App = App;
window.renderApp = function () {
  ReactDOM.render(/*#__PURE__*/React.createElement(App, null), document.getElementById('app'));
};