#!/usr/bin/env bash

# package-offline.sh
# Creates a self-contained offline package of DeltaVision for air-gapped environments
# Usage: ./package-offline.sh [version]

set -e  # Exit immediately if a command exits with a non-zero status

# Default version if not specified
VERSION=${1:-"1.0.0"}
PACKAGE_NAME="deltavision-offline-${VERSION}"
TEMP_DIR=$(mktemp -d)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===== DeltaVision Offline Packager ====="
echo "Packaging version: ${VERSION}"
echo "Working directory: ${TEMP_DIR}"
echo "----------------------------------------"

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}"
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/node_modules"

# Copy application files
echo "Copying application files..."
cp -r \
  "${SCRIPT_DIR}/bin" \
  "${SCRIPT_DIR}/public" \
  "${SCRIPT_DIR}/sample-data" \
  "${SCRIPT_DIR}/src" \
  "${SCRIPT_DIR}/.gitignore" \
  "${SCRIPT_DIR}/folder-config.json" \
  "${SCRIPT_DIR}/keywords.txt" \
  "${SCRIPT_DIR}/package.json" \
  "${SCRIPT_DIR}/package-lock.json" \
  "${SCRIPT_DIR}/README.md" \
  "${SCRIPT_DIR}/start-deltavision.sh" \
  "${TEMP_DIR}/${PACKAGE_NAME}/"

# Copy node_modules (this is the heaviest part)
echo "Copying node_modules (this may take a while)..."
cp -r "${SCRIPT_DIR}/node_modules" "${TEMP_DIR}/${PACKAGE_NAME}/"

# Set correct permissions
echo "Setting file permissions..."
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision.sh"
chmod -R 755 "${TEMP_DIR}/${PACKAGE_NAME}/bin"

# Create installation script
echo "Creating installation script..."
cat > "${TEMP_DIR}/${PACKAGE_NAME}/install.sh" << 'EOF'
#!/usr/bin/env bash

# DeltaVision Offline Installer
# This script helps set up DeltaVision in an air-gapped environment
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "===== DeltaVision Offline Installer ====="

# Check system requirements
echo "Checking system requirements..."
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required but not installed"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required but not installed"; exit 1; }

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d '.' -f 1)
if [[ $NODE_MAJOR -lt 14 ]]; then
  echo "Error: Node.js 14.x or higher is required (found v$NODE_VERSION)"
  exit 1
fi

NPM_VERSION=$(npm -v | cut -d '.' -f 1)
if [[ $NPM_VERSION -lt 6 ]]; then
  echo "Error: npm 6.x or higher is required (found $NPM_VERSION)"
  exit 1
fi

echo "✓ Node.js v$NODE_VERSION detected"
echo "✓ npm $NPM_VERSION detected"

# Set up configuration
echo
echo "Setting up configuration..."
echo "Please provide the following paths (press Enter to use defaults):"

DEFAULT_OLD_FOLDER="${SCRIPT_DIR}/sample-data/old"
DEFAULT_NEW_FOLDER="${SCRIPT_DIR}/sample-data/new"
DEFAULT_KEYWORDS_FILE="${SCRIPT_DIR}/keywords.txt"

read -p "Old folder path [${DEFAULT_OLD_FOLDER}]: " OLD_FOLDER
read -p "New folder path [${DEFAULT_NEW_FOLDER}]: " NEW_FOLDER
read -p "Keywords file path [${DEFAULT_KEYWORDS_FILE}]: " KEYWORDS_FILE

OLD_FOLDER=${OLD_FOLDER:-"$DEFAULT_OLD_FOLDER"}
NEW_FOLDER=${NEW_FOLDER:-"$DEFAULT_NEW_FOLDER"}
KEYWORDS_FILE=${KEYWORDS_FILE:-"$DEFAULT_KEYWORDS_FILE"}

# Create configuration file
cat > "${SCRIPT_DIR}/folder-config.json" << _CONFIG_EOF
{
  "oldFolderPath": "$(realpath "$OLD_FOLDER")",
  "newFolderPath": "$(realpath "$NEW_FOLDER")",
  "keywordFilePath": "$(realpath "$KEYWORDS_FILE")"
}
_CONFIG_EOF

echo "✓ Configuration saved to folder-config.json"

# Make scripts executable
chmod +x "${SCRIPT_DIR}/start-deltavision.sh"
chmod -R 755 "${SCRIPT_DIR}/bin"

echo
echo "Installation complete! DeltaVision is ready to use."
echo
echo "To start DeltaVision:"
echo "  cd \"$(realpath "${SCRIPT_DIR}")\""
echo "  npm start"
echo
echo "Or use the convenience script:"
echo "  ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]"
echo
echo "Thank you for using DeltaVision!"
EOF

# Make the installation script executable
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/install.sh"

# Create README for the offline package
echo "Creating offline package README..."
cat > "${TEMP_DIR}/${PACKAGE_NAME}/OFFLINE-README.md" << 'EOF'
# DeltaVision Offline Package

This is a self-contained offline package of DeltaVision, designed for use in air-gapped environments where internet access is not available.

## Installation

1. Extract this archive to your desired location:
   ```
   tar -xzf deltavision-offline-x.x.x.tar.gz
   cd deltavision-offline
   ```

2. Run the installation script:
   ```
   ./install.sh
   ```

   The installer will:
   - Verify your system meets the requirements
   - Guide you through configuration setup
   - Prepare the application for first use

3. Start DeltaVision:
   ```
   npm start
   ```

   Or use the convenience script:
   ```
   ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]
   ```

## Requirements

- Node.js 14.x or higher
- npm 6.x or higher

## Support

This offline package contains all necessary dependencies and libraries to run DeltaVision without internet access.

For additional support or to obtain updated versions, please contact your system administrator or visit the DeltaVision GitHub repository when connected to the internet.

Thank you for using DeltaVision!
EOF

# Create the tarball archive
echo "Creating archive file..."
cd "${TEMP_DIR}"
tar -czf "${SCRIPT_DIR}/${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Cleanup
echo "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

echo "----------------------------------------"
echo "Package successfully created: ${SCRIPT_DIR}/${PACKAGE_NAME}.tar.gz"
echo "Package size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.tar.gz" | cut -f1)"
echo "To install on an air-gapped system:"
echo "1. Transfer the ${PACKAGE_NAME}.tar.gz file to the target system"
echo "2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "3. CD into the directory: cd ${PACKAGE_NAME}"
echo "4. Run: ./install.sh"
echo "----------------------------------------"
