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

For detailed installation instructions, see [INSTALLATION.md](docs/INSTALLATION.md).

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
chmod +x scripts/start-deltavision.sh
./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
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
chmod +x scripts/start-deltavision.sh
./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
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

## 🛠️ Scripts Reference

DeltaVision includes several utility scripts to help with different deployment scenarios:

| Script | Purpose | When to Use | Prerequisites |
|--------|---------|-------------|---------------|
| `scripts/start-deltavision.sh` | Runs DeltaVision directly without Docker | For non-Docker deployments | Node.js 14+, npm 6+ |
| `scripts/docker-package-offline.sh` | Creates an offline deployment package | When preparing for air-gapped environments | Docker, internet access, zip command |
| `scripts/configure-offline.sh` | Configures the offline package on target system | After extracting the offline package | Docker (no internet required) |

### Deployment Workflow Guide:

1. **Standard Docker Deployment** (recommended for most users):
   ```bash
   # No scripts needed - use Docker directly
   cd docker
   docker-compose up -d
   ```

2. **Offline/Air-Gapped Deployment**:
   - Step 1 (On internet-connected system):
     ```bash
     ./scripts/docker-package-offline.sh
     # Transfer the ZIP file to air-gapped system
     ```
   - Step 2 (On air-gapped system):
     ```bash
     unzip deltavision-docker-offline-*.zip
     cd deltavision-docker-offline-*
     ./scripts/configure-offline.sh
     # Follow the prompts
     ```

3. **Non-Docker Deployment**:
   ```bash
   ./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
   ```

For detailed installation instructions, see [INSTALLATION.md](docs/INSTALLATION.md).

### Offline Deployment

For air-gapped/offline environments, check the following resources:

- [Offline Deployment Guide](docs/OFFLINE-README.md) - Comprehensive guide for air-gapped deployment
- [Offline Deployment Checklist](docs/OFFLINE-CHECKLIST.md) - Pre-flight checklist for offline deployments
- [Installation Guide](docs/INSTALLATION.md) - General installation instructions including offline mode

To start DeltaVision in an offline environment:

```bash
# Configure the offline environment
./scripts/configure-offline.sh

# Verify the offline environment
./scripts/verify-offline-dependencies.sh

# Start DeltaVision
./scripts/start-deltavision-offline.sh
```

## Available Scripts

DeltaVision includes several scripts to help with installation, configuration, and operation. Below is a description of each script and when to use it.

### Standard Deployment Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/start-deltavision.sh` | Starts DeltaVision in standard (non-Docker) mode | When running on a system with Node.js installed and you prefer not to use containers |

### Offline/Air-Gapped Deployment Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/docker-package-offline.sh` | Creates a self-contained package for offline deployment | Before transferring to an air-gapped environment, run on a connected system to create the package |
| `scripts/configure-offline.sh` | Configures the offline deployment with correct paths | After extracting the offline package, run this first to set up paths and configuration |
| `scripts/start-deltavision-offline.sh` | Starts DeltaVision in offline mode using Docker/Podman | After configuration, use this to start the application in an air-gapped environment |
| `scripts/verify-offline-dependencies.sh` | Verifies all dependencies are available for offline mode | After extracting the package to ensure all requirements are met before attempting to start |
| `scripts/preflight-check.sh` | Performs pre-flight checks before starting in offline mode | Before starting, to verify the environment is properly configured |
| `scripts/diagnostic-logger.sh` | Provides diagnostic logging capabilities | Not used directly; sourced by other scripts to enable logging |
| `scripts/install-offline-deps.sh` | Installs npm dependencies from offline cache | When standard npm package installation fails due to lack of internet connectivity |
| `scripts/test-offline-setup.sh` | Verifies correct file organization and structure | After reorganizing files or extracting the package to a new location |

### Container and Container Orchestration

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `docker/docker-compose.yml` | Standard Docker Compose configuration | For online environments when using Docker |
| `docker/docker-compose.offline.yml` | Docker Compose configuration for offline mode | When deploying in air-gapped environments with Docker/Podman Compose |

## Script Workflow in Offline Environments

1. **Package Creation (on internet-connected system)**:
   ```bash
   ./scripts/docker-package-offline.sh
   ```
   This creates a ZIP archive containing everything needed for offline deployment.

2. **After transferring to air-gapped system and extracting**:
   ```bash
   # Verify the package integrity
   ./scripts/test-offline-setup.sh
   
   # Check if all dependencies are present
   ./scripts/verify-offline-dependencies.sh
   
   # Configure paths for your environment
   ./scripts/configure-offline.sh
   
   # Run preflight checks before starting
   ./scripts/preflight-check.sh
   
   # Start DeltaVision
   ./scripts/start-deltavision-offline.sh
   ```

For detailed troubleshooting and setup instructions, refer to the [Offline Deployment Guide](docs/OFFLINE-README.md).

## Using Docker Compose (Recommended)

1. First, edit the `docker/docker-compose.yml` file to specify your data directories:

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
./scripts/docker-package-offline.sh [version]
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

For detailed Docker instructions, see the [`README.md`](docker/README.md) file.

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
