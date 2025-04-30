#!/usr/bin/env bash

# docker-package-offline.sh
# Creates a self-contained Docker package of DeltaVision for air-gapped environments
# Usage: ./docker-package-offline.sh [version]

set -e  # Exit immediately if a command exits with a non-zero status

# Default version if not specified
VERSION=${1:-"1.0.0"}
PACKAGE_NAME="deltavision-docker-offline-${VERSION}"
TEMP_DIR=$(mktemp -d)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "===== DeltaVision Docker Offline Packager ====="
echo "Packaging version: ${VERSION}"
echo "Working directory: ${TEMP_DIR}"
echo "----------------------------------------"

# Check if zip is installed
if ! command -v zip &> /dev/null; then
  echo "Error: 'zip' command is not installed. Please install it first."
  echo "On Ubuntu/Debian: sudo apt-get install zip"
  echo "On CentOS/RHEL: sudo yum install zip"
  exit 1
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}"

# Build Docker image
echo "Building Docker image..."
docker build -t deltavision:${VERSION} "${SCRIPT_DIR}"

# Save Docker image
echo "Saving Docker image (this may take a while)..."
docker save deltavision:${VERSION} -o "${TEMP_DIR}/${PACKAGE_NAME}/deltavision-image.tar"

# Copy necessary files
echo "Copying configuration files..."
cp -r \
  "${SCRIPT_DIR}/docker-compose.yml" \
  "${SCRIPT_DIR}/folder-config.json" \
  "${SCRIPT_DIR}/keywords.txt" \
  "${SCRIPT_DIR}/README.md" \
  "${SCRIPT_DIR}/DOCKER-README.md" \
  "${TEMP_DIR}/${PACKAGE_NAME}/"

# Create a modified docker-compose for offline use
cat > "${TEMP_DIR}/${PACKAGE_NAME}/docker-compose.offline.yml" << EOF
version: '3'

services:
  deltavision:
    image: deltavision:${VERSION}
    container_name: deltavision
    ports:
      - "3000:3000"
    volumes:
      # Mount configuration file
      - ./folder-config.json:/app/folder-config.json
      # Mount custom keywords file
      - ./keywords.txt:/app/keywords.txt
      # Mount your data directories - edit these paths for your environment
      - /path/to/your/old/folder:/app/data/old
      - /path/to/your/new/folder:/app/data/new
    environment:
      - NODE_ENV=production
EOF

# Create offline installation instructions
cat > "${TEMP_DIR}/${PACKAGE_NAME}/OFFLINE-INSTALL.md" << 'EOF'
# DeltaVision Offline Installation

This package contains everything needed to run DeltaVision in an air-gapped environment without internet access.

## Prerequisites

Before installing DeltaVision, ensure your system has:

1. **Docker Engine** (19.03 or newer)
2. **Docker Compose** (1.25.0 or newer)
3. **unzip** utility to extract this package

## Docker Permissions

Ensure your user is part of the docker group to run Docker commands without sudo:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Then log out and back in, or run this to apply changes to current session
newgrp docker
```

## Installation Steps

1. **Extract the package**:
   ```bash
   unzip deltavision-docker-offline-x.x.x.zip
   cd deltavision-docker-offline-x.x.x
   ```

2. **Load the Docker image**:
   ```bash
   docker load -i deltavision-image.tar
   ```

3. **Configure your data directories**:
   Edit the `docker-compose.offline.yml` file to point to your actual data directories:
   ```yaml
   volumes:
     # Mount your data directories - edit these paths for your environment
     - /path/to/your/old/folder:/app/data/old
     - /path/to/your/new/folder:/app/data/new
   ```

4. **Update the folder configuration**:
   Edit `folder-config.json` to match your mounted directories:
   ```json
   {
     "oldFolderPath": "/app/data/old",
     "newFolderPath": "/app/data/new",
     "keywordFilePath": "/app/keywords.txt"
   }
   ```

5. **Start the application**:
   ```bash
   docker-compose -f docker-compose.offline.yml up -d
   ```

6. **Access DeltaVision**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## System Requirements

- **Disk space**: ~100MB for the Docker image plus space for your data
- **Memory**: 1GB RAM recommended
- **Ports**: Port 3000 must be available (or change in docker-compose)

## Troubleshooting

- **Port conflicts**: If port 3000 is already in use, modify the port mapping in `docker-compose.offline.yml` (e.g., change to `8080:3000`).
- **Docker access**: Make sure your user has rights to run Docker commands or use sudo.
- **File permissions**: Ensure your mounted volumes have the correct read/write permissions.

For additional information, please refer to the `DOCKER-README.md` file.
EOF

# Create startup script
cat > "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision-offline.sh" << EOF
#!/usr/bin/env bash

# Ensure Docker is available
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed or not in PATH. Please install Docker first."
  exit 1
fi

# Load the image if not already loaded
if ! docker image inspect deltavision:${VERSION} &> /dev/null; then
  echo "Loading DeltaVision Docker image..."
  docker load -i deltavision-image.tar
fi

# Start the application
echo "Starting DeltaVision..."
docker-compose -f docker-compose.offline.yml up -d

echo "DeltaVision is now running on http://localhost:3000"
EOF

# Make the script executable
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision-offline.sh"

# Create the ZIP archive
echo "Creating ZIP archive file..."
cd "${TEMP_DIR}"
zip -r "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" "${PACKAGE_NAME}"

# Cleanup
echo "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

echo "----------------------------------------"
echo "Package successfully created: ${SCRIPT_DIR}/${PACKAGE_NAME}.zip"
echo "Package size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
echo "To install on an air-gapped system:"
echo "1. Transfer the ${PACKAGE_NAME}.zip file to the target system"
echo "2. Extract: unzip ${PACKAGE_NAME}.zip"
echo "3. CD into the directory: cd ${PACKAGE_NAME}"
echo "4. Edit docker-compose.offline.yml to set your data directories:"
echo "   - Update the volume paths for your old and new folders"
echo "5. Edit folder-config.json to match the container paths:"
echo "   - Set oldFolderPath to '/app/data/old'"
echo "   - Set newFolderPath to '/app/data/new'"
echo "6. Load the Docker image: docker load -i deltavision-image.tar"
echo "7. Start with: docker-compose -f docker-compose.offline.yml up -d"
echo "----------------------------------------"
