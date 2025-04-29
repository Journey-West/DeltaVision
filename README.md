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
- **Real-time file watching** to detect new files automatically
- **Automatic polling** every 10 seconds for constant synchronization
- **Premium UI** with custom scrollbars, toggle switches, and modern design
- **Multiple themes** including dark, light, colorful, and seasonal options
- **Full offline support** with bundled dependencies for air-gapped environments
- **Dynamic keyword highlighting** for custom syntax emphasis
- **Simple configuration** with user-friendly setup wizard
- **Timestamp display** for quick file modification comparison
- **Performance optimized** for handling large files and directories

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or higher (required for standard & offline installations; CLI global install may work on Node.js 10.x but is unsupported)
- npm 6.x or higher

### Standard Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/yourusername/deltavision.git
cd deltavision

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

DeltaVision comes with a variety of premium themes to match your preference:

- **Nord** (Default) - A subtle arctic-inspired color scheme
- **Tokyo Night** - Elegant dark blue theme inspired by Tokyo's nightscape
- **Night Owl** - A deep blue theme optimized for nighttime coding
- **Ayu Light** - A clean, light theme for daytime use
- **Quiet Light** - A soft, low-contrast light theme
- **Monochrome** - A classic black and white theme
- **Colorblind Friendly** - Designed for better accessibility
- **Seasonal Themes** - Winter, Summer, and Autumn variants

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

## 📦 Offline Packaging

DeltaVision can be packaged for completely offline use in air-gapped environments.

### Creating an Offline Package

```bash
# From the DeltaVision directory
./package-offline.sh
```

This creates a self-contained archive (`deltavision-offline-x.x.x.tar.gz`) with:
- All application code and assets
- Complete node_modules directory
- Local copies of all vendor libraries
- Default configuration templates
- Installation script

### Installing from the Offline Package

```bash
# On the target system
tar -xzf deltavision-offline-x.x.x.tar.gz
cd deltavision-offline
./install.sh
```

The enhanced installer will guide you through the setup process with:
- System requirements verification
- Dependency installation
- Configuration setup
- Quick start instructions

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
- **Large Files**: Performance mode is automatically enabled for files over 1MB
- **Multiple Instances**: You can run multiple instances on different ports for comparing different folder sets

## 📄 Supported File Types

DeltaVision is designed to compare a wide variety of text-based files:

### Best for Comparison
- **Source Code**: All programming languages (`.js`, `.py`, `.java`, `.c`, `.cpp`, `.html`, `.css`, etc.)
- **Markup & Config**: Markdown, XML, JSON, YAML, INI, TOML, etc.
- **Plain Text**: `.txt`, `.log`, `.csv`, and other plain text formats
- **Documentation**: `.md`, `.rst`, `.tex`, etc.

### Viewable but Limited Comparison
- **Rich Text**: Basic comparison for `.rtf` files (formatting ignored)
- **Office Documents**: Simple text extraction from `.docx`, `.xlsx` (formatting and complex structures ignored)
- **PDF**: Text-only extraction (layout not preserved)

### Not Suitable
- **Binary Files**: Executables, compressed archives, etc.
- **Images**: PNG, JPG, GIF, etc. (MD5 checksums are shown instead)
- **Audio/Video**: MP3, MP4, etc.
- **Very Large Files**: Files >50MB may cause performance issues

### Size Limitations
- **Optimal**: Files under 1MB provide the best performance
- **Good**: Files 1-10MB have acceptable performance with automatic performance mode
- **Limited**: Files 10-50MB may cause slowdowns
- **Not Recommended**: Files >50MB

DeltaVision automatically detects file types and adapts the comparison view accordingly. Binary files show a checksum comparison instead of content differences.
