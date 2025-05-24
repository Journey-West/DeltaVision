# DeltaVision

A desktop utility for file diffing, searching, and highlighting built with Electron and Svelte.

![DeltaVision Logo](https://github.com/Journey-West/DeltaVision/raw/gh-pages/docs/assets/images/logo.png)

## Features

- **File Comparison**: Compare two files side-by-side with highlighted differences
- **Directory Comparison**: Compare entire directories and identify changed, added, or removed files
- **File Search**: Search for files by name within a selected directory (recursive)
- **Content Search**: Search for text content within files in a selected directory (recursive)
- **Keyword Highlighting**: Highlight important keywords in file content
- **Network Sharing**: Share the application over a local network for collaborative work
- **Notes System**: Take and save notes while working
- **Offline Operation**: Works completely offline with no external dependencies
- **Customizable Themes**: Choose from multiple visual themes or create your own

## Installation

### Pre-built Binaries

Download the latest release for your platform from the [Releases page](https://github.com/Journey-West/DeltaVision/releases).

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the renderer process:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Package the application for your platform:
   ```bash
   npm run package
   ```

### Offline Functionality

DeltaVision is designed to work completely offline without requiring internet connectivity:

- All dependencies are bundled with the application
- No external API calls or data transfers
- Full functionality available without network access

### Offline Installation

For air-gapped environments, you can use our offline packaging script:

```bash
./package-offline.sh
```

This script will:
1. Build the application
2. Package it for Windows, macOS, and Linux
3. Create a zip archive with all installers and installation instructions
4. The resulting package can be transferred to air-gapped systems

## Usage

### File Comparison

1. Launch DeltaVision
2. Select two files to compare
3. View the differences highlighted in the comparison view

### Directory Comparison

1. Select two directories to compare
2. Browse the list of different files
3. Click on any file pair to view detailed differences

### Search Functionality

1. Select a directory to search within
2. Enter a search term
3. Choose between filename search or content search
4. View and navigate through search results

### Keyword Highlighting

1. Create a keywords file (one keyword per line)
2. Load the keywords file in DeltaVision
3. View files with keywords automatically highlighted

## Security Features

DeltaVision is built with security in mind:

- Runs completely offline
- Uses Electron's contextIsolation for secure IPC
- Sandboxed renderer process
- No remote content loading
- No telemetry or data collection

## Development

### Project Structure

- `src/main/`: Electron main process code
  - `main.js`: Application entry point
  - `preload.js`: Secure bridge between main and renderer
  - `modules/`: Functionality modules
- `src/renderer/`: Svelte UI code
  - `components/`: Reusable UI components
  - `features/`: Feature-specific components
  - `stores/`: State management
  - `themes/`: Visual themes

### Technologies Used

- Electron: Cross-platform desktop framework
- Svelte: UI framework
- Express: For optional network sharing
- diff: For file comparison algorithms

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Website

Visit our [project website](https://journey-west.github.io/DeltaVision/) for more information, screenshots, and documentation.
