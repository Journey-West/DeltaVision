# DeltaVision

DeltaVision is a tool for visualizing differences between files in two separate directories. It provides a clean, intuitive web interface for comparing file contents and tracking changes over time.

## Features

- Simple, browser-based interface for comparing files
- Side-by-side diff visualization with syntax highlighting
- Support for various file types
- Keyboard navigation for efficient review
- Customizable keyword highlighting
- "New Only" toggle for viewing just new file content
- Visual indicators for files with no differences
- Independent highlight and diff toggles
- Enhanced keyboard shortcuts

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/DeltaVision.git
cd DeltaVision

# Install dependencies
npm install

# Start the application
./scripts/start-deltavision.sh /path/to/old/folder /path/to/new/folder
```

## Deployment Options

| Option | Best For | Requirements | Setup Difficulty |
|--------|----------|--------------|------------------|
| **Standalone** | Developers, quick usage | Node.js | Simple |

Choose the standalone option when you need a quick and simple way to compare files without complex setup.

## Installation

### Option 1: Standalone

#### Prerequisites
- Node.js 14.x or newer

#### Installation Steps
```bash
# Clone the repository
git clone https://github.com/yourusername/DeltaVision.git
cd DeltaVision

# Install dependencies
npm install
```

## Usage

### Standalone

```bash
# Start with two directories to compare
./scripts/start-deltavision.sh /path/to/old/folder /path/to/new/folder [/path/to/keywords.txt]

# Access the web interface
# Open http://localhost:3000 in your browser
```

### Keyboard Shortcuts

DeltaVision provides several keyboard shortcuts for efficient navigation:

| Shortcut | Action |
|----------|--------|
| Ctrl+H   | Toggle keyword highlighting |
| Ctrl+D   | Toggle diff highlighting |
| Ctrl+M   | Toggle character/word diff mode |
| Ctrl+R   | Toggle move detection |
| Ctrl+N   | Toggle "New Only" view |
| Ctrl+E   | Toggle sidebar |
| Up/Down  | Navigate file pairs |

## Creating a Keywords File

Keywords allow you to highlight important terms in file diffs. Create a file with one keyword per line:

```
important
critical
todo
bug
```

Specify the path to this file as the third parameter when launching DeltaVision.

## Configuration

DeltaVision stores its configuration in a `folder-config.json` file, which is created automatically when you start the application:

```json
{
  "oldFolderPath": "/path/to/old/folder",
  "newFolderPath": "/path/to/new/folder",
  "keywordFilePath": "/path/to/keywords.txt"
}
```

## Important Files and Directories

| File/Directory | Purpose | When to Use |
|----------------|---------|-------------|
| `scripts/start-deltavision.sh` | Start DeltaVision | Main entry point |
| `bin/deltavision.js` | CLI interface | For programmatic control |
| `package.json` | Project configuration | Managing dependencies |
| `public/` | Web application files | For UI customization |
| `src/` | Source code | For code extensions |

## Project Structure

```
deltavision/
├── bin/               # CLI executable
├── public/            # Static web files
│   ├── css/           # Stylesheets
│   ├── js/            # Client-side JavaScript
│   └── index.html     # Main HTML page
├── scripts/           # Helper scripts
│   └── start-deltavision.sh # Main startup script
├── src/               # Source code
│   └── server/        # Node.js server code
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
