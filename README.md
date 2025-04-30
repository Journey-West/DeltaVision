# DeltaVision

<div align="center">
<pre>
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 
</pre>

  <h3>Premium File Comparison Tool</h3>
  <p>Compare files between folders with beautiful, theme-aware visualization</p>
</div>

---
![DeltaVision(Home)](https://github.com/user-attachments/assets/c95ed353-7ea0-4d20-84dc-3bcce68514f2)
---

## 🌟 Features

- **Side-by-side comparison** with intelligent difference highlighting
- **File watching** for the "New" folder to detect file changes
- **Multiple themes** including Tokyo Night, Nord, Night Owl, and Ayu Light
- **Dynamic keyword highlighting** for custom syntax emphasis
- **Simple configuration** with JSON-based setup
- **Timestamp display** for file modification comparison
- **Specialized for .txt files** with specific naming and content structure
- **Full offline support** with bundled dependencies for air-gapped environments
- **Performance optimized** for handling large files and directories

## 🚀 Quick Start

> **Note:** Docker is now the recommended approach for running DeltaVision. The instructions below for standard installation are provided as an alternative for non-Docker environments.

### Prerequisites

- Node.js 14.x or higher (required for standard & offline installations; CLI global install may work on Node.js 10.x but is unsupported)
- npm 6.x or higher

### Standard Installation (Non-Docker Alternative)

```bash
# Clone the repository (if not already done)
git clone https://github.com/Journey-West/DeltaVision.git
cd DeltaVision

# Install dependencies
npm install

# Configure & launch via helper script
chmod +x start-deltavision.sh
./start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
```

### CLI Installation

**Note:** The CLI global install (`deltavision`) bypasses the offline-installer's Node.js 14+ check and is officially tested on Node.js 14+. Running on earlier versions may lead to unexpected errors.

Install DeltaVision globally via npm:

```bash
npm install -g deltavision
```

Launch with your folders:

```bash
deltavision --old /path/to/old --new /path/to/new [--keywords /path/to/keywords.txt]
```

### Helper Script

A convenience script `start-deltavision.sh` is included for bash users:
```bash
chmod +x start-deltavision.sh
./start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
```

### First-time Configuration

When you first launch DeltaVision, you'll be guided through a simple setup process:

1. Select your **"Old" folder** containing previous output files
2. Select your **"New" folder** containing current output files 
3. Optionally configure a **keywords file** for custom highlighting

## 🎨 Themes & Customization

DeltaVision comes with multiple themes to match your preference:

- **Nord** (Default) - A subtle arctic-inspired color scheme
- **Tokyo Night** - Elegant dark blue theme inspired by Tokyo's nightscape
- **Night Owl** - A deep blue theme optimized for nighttime coding
- **Ayu Light** - A clean, light theme for daytime use
- **Winter** - A cool, light theme with blue accents

Change themes easily with the theme button in the top-right corner of the application.

## 🔄 Usage

1. Launch DeltaVision and access the web interface at http://localhost:3000
2. Select a file pair to compare from the sidebar listing
3. View differences highlighted in the side-by-side comparison view
4. Use the theme selector to customize the visual appearance
5. Toggle highlighting on/off using the toggle switch
6. Configure keywords for custom syntax highlighting

## 📋 File Selection Criteria

DeltaVision uses a specific algorithm to identify and match files for comparison in the side panel:

### File Naming Requirements

For files to be recognized by DeltaVision, they must follow this format:
- Filename pattern: `command__additional_info.txt`
- Must include double underscore (`__`) in the filename
- Must have `.txt` extension

### File Content Requirements

The first line of each file must contain command information in a specific format:
- Usually follows the pattern: `DATE TIME "actual command that was run"`
- The text inside quotes is extracted and used for matching
- Files without a properly formatted first line won't appear in the sidebar

### Matching Algorithm

DeltaVision matches files between the "Old" and "New" folders based on:
1. The command part (text before `__` in the filename)
2. The command text (content inside quotes from the first line)

Only files that have matching pairs in both folders will appear in the side panel. Files are sorted by timestamp with newest files first.

### Time-Based Comparisons

The application also offers a time-based comparison mode that displays:
- Multiple executions of the same command within the "New" folder
- The time difference between executions
- Useful for tracking how output changes over time

### Example of Valid Files

**Old folder:**
- `ls__2023-01-01.txt` (first line: `2023-01-01 12:00:00 "ls -la"`)

**New folder:**
- `ls__2023-01-02.txt` (first line: `2023-01-02 12:00:00 "ls -la"`)

These would match because both the command part (`ls`) and the quoted text (`ls -la`) match.

## 📦 Docker Deployment (Recommended)

DeltaVision can be easily deployed using Docker, which is now the recommended approach for running the application.

### Using Docker Compose (Recommended)

1. First, edit the `docker-compose.yml` file to specify your data directories:

```yaml
volumes:
  - /path/to/your/old/folder:/app/data/old
  - /path/to/your/new/folder:/app/data/new
  - ./keywords.txt:/app/keywords.txt
  - ./folder-config.json:/app/folder-config.json
```

2. Update your `folder-config.json` to point to these mounted locations:

```json
{
  "oldFolderPath": "/app/data/old",
  "newFolderPath": "/app/data/new",
  "keywordFilePath": "/app/keywords.txt"
}
```

3. Build and start the container:
```bash
docker-compose up -d

# Access DeltaVision at http://localhost:3000
```

To stop the container:
```bash
docker-compose down
```

### Offline Deployment with Docker

For air-gapped environments without internet access, a special packaging script is provided:

```bash
# Create an offline package
./docker-package-offline.sh [version]
```

This creates a self-contained archive (`deltavision-docker-offline-x.x.x.zip`) with:
- Pre-built Docker image
- All necessary configuration files
- Offline installation instructions
- Startup script for the offline environment

To deploy in an air-gapped environment:

1. Create the package on a system with internet access
2. Transfer the package to the target system
3. Follow the instructions in OFFLINE-INSTALL.md inside the package

For detailed offline deployment instructions, see the documentation included in the package.

### Using Docker Directly

```bash
# Build the Docker image
npm run docker:build

# Run the container with your data directories
docker run -p 3000:3000 \
  -v /path/to/your/old/folder:/app/data/old \
  -v /path/to/your/new/folder:/app/data/new \
  -v $(pwd)/keywords.txt:/app/keywords.txt \
  -v $(pwd)/folder-config.json:/app/folder-config.json \
  deltavision
```

For detailed Docker instructions, see the [`DOCKER-README.md`](DOCKER-README.md) file.

## ⚙️ Advanced Configuration

### folder-config.json

The application stores configuration in a `folder-config.json` file:

```json
{
  "oldFolderPath": "/path/to/old/folder",
  "newFolderPath": "/path/to/new/folder",
  "keywordFilePath": "/path/to/keywords.txt"
}
```

### Keywords File Format

Create a keywords file for custom syntax highlighting:

```
error:red
warning:orange
success:green
info:blue
debug:purple
```

Each line contains a keyword and color separated by a colon.

## 🔒 Security Note

DeltaVision is designed to run locally and does not:
- Connect to the internet
- Send or receive any data
- Modify your comparison files
- Require administrator privileges

## 💡 Tips & Tricks

- **Keyboard Shortcuts**: 
  - `Ctrl+E` to toggle the sidebar
  - `Ctrl+H` to toggle highlights
  - `Ctrl+D` to toggle diffs
  - `Ctrl+M` to toggle char diff mode
  - `Ctrl+R` to toggle move detection
  - `↑` & `↓` arrow keys to navigate file pairs
- **Theme Switching**: Try different themes for better readability depending on your environment
- **Keyword Highlighting**: Add your most commonly searched terms to the keywords file
- **File Size Note**: Large files may cause performance issues
- **Multiple Instances**: You can run multiple instances on different ports for comparing different folder sets

## 📄 Supported File Types

DeltaVision is specifically designed to work with plaintext files with a specific structure:

### Required File Format
- **Extension**: Only `.txt` files are supported
- **Naming Pattern**: Files must follow the format `command__additional_info.txt` (with double underscore)
- **Content Structure**: First line must contain a command pattern with quotes (e.g., `DATE TIME "command ran"`)

### Comparison Capabilities
- **Text Content**: Line-by-line differences between matched text files
- **Command Output**: Especially useful for comparing command outputs over time
- **Configuration Files**: When saved as .txt files with the correct naming pattern

### Not Supported
- **Other Text Formats**: Non-txt files (`.py`, `.js`, `.html`, etc.) are not recognized in the sidebar
- **Rich Formats**: Word documents, PDFs, spreadsheets, etc.
- **Binary Files**: Images, executables, archives, etc.
- **Large Files**: Performance degrades with very large files

The application is optimized for comparing plain text files that contain command outputs, logs, or other structured text data that follow the specific naming and content format requirements.
