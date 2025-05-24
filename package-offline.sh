#!/bin/bash
# Script to package DeltaVision for air-gapped environments
# This script creates standalone installers that can be used in offline environments

echo "=== DeltaVision Offline Packaging Tool ==="
echo "This script will create standalone installers for air-gapped environments."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if electron-builder is installed
if ! npm list -g electron-builder &> /dev/null; then
    echo "Installing electron-builder globally..."
    npm install -g electron-builder
fi

# Ensure all dependencies are installed
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Create a directory for the offline package
PACKAGE_DIR="offline-package"
mkdir -p "$PACKAGE_DIR"

# Package the application for different platforms
echo "Packaging for Windows, macOS, and Linux..."
npx electron-builder --win --mac --linux --publish never

# Copy the installers to the offline package directory
echo "Copying installers to $PACKAGE_DIR directory..."
cp -r dist/*.exe "$PACKAGE_DIR" 2>/dev/null || :
cp -r dist/*.dmg "$PACKAGE_DIR" 2>/dev/null || :
cp -r dist/*.AppImage "$PACKAGE_DIR" 2>/dev/null || :
cp -r dist/*.deb "$PACKAGE_DIR" 2>/dev/null || :
cp -r dist/*.rpm "$PACKAGE_DIR" 2>/dev/null || :

# Create a README file for offline installation
cat > "$PACKAGE_DIR/README.txt" << EOL
DeltaVision Offline Installation
================================

This package contains standalone installers for DeltaVision that can be used in air-gapped environments.

Installation Instructions:
-------------------------

Windows:
1. Double-click the .exe installer file
2. Follow the installation prompts
3. Launch DeltaVision from the Start Menu

macOS:
1. Double-click the .dmg file
2. Drag DeltaVision to the Applications folder
3. Launch DeltaVision from the Applications folder

Linux:
- For Debian/Ubuntu: sudo dpkg -i deltavision_*.deb
- For Red Hat/Fedora: sudo rpm -i deltavision_*.rpm
- AppImage: Make the .AppImage file executable (chmod +x *.AppImage) and then run it

For more information, visit: https://github.com/Journey-West/DeltaVision
EOL

echo "Creating offline package archive..."
zip -r "DeltaVision-Offline-Package.zip" "$PACKAGE_DIR"

echo "=== Packaging Complete ==="
echo "Offline installers are available in the $PACKAGE_DIR directory"
echo "A complete package has been created at DeltaVision-Offline-Package.zip"
