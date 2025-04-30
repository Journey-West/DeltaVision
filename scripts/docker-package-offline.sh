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

cat << "EOF"
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 

===== DeltaVision Docker Offline Packager =====
EOF

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

# Detect if we're using Podman or Docker
CONTAINER_ENGINE="docker"
if command -v podman &> /dev/null && podman --version | grep -q "podman"; then
  CONTAINER_ENGINE="podman"
  echo "Detected Podman as container engine"
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}"

# Build Docker image
echo "Building Docker image..."
${CONTAINER_ENGINE} build -t deltavision:${VERSION} -f "${SCRIPT_DIR}/../docker/Dockerfile" "${SCRIPT_DIR}/.."

# Save Docker image
echo "Saving Docker image (this may take a while)..."
${CONTAINER_ENGINE} save deltavision:${VERSION} -o "${TEMP_DIR}/${PACKAGE_NAME}/deltavision-image.tar"

# Create a directory structure for scripts in the package
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/scripts"

# Copy necessary files
echo "Copying configuration files..."
cp -r \
  "${SCRIPT_DIR}/../docker/docker-compose.yml" \
  "${SCRIPT_DIR}/../folder-config.json" \
  "${SCRIPT_DIR}/../keywords.txt" \
  "${SCRIPT_DIR}/../README.md" \
  "${TEMP_DIR}/${PACKAGE_NAME}/"

# Copy Docker README with a different name to avoid conflict
cp "${SCRIPT_DIR}/../docker/README.md" "${TEMP_DIR}/${PACKAGE_NAME}/DOCKER-README.md"

# Copy scripts to the scripts directory in the package
cp "${SCRIPT_DIR}/../scripts/configure-offline.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/"

# Make the configure script executable in the package
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/configure-offline.sh"

# Store the container engine type for later use
echo "${CONTAINER_ENGINE}" > "${TEMP_DIR}/${PACKAGE_NAME}/container-engine.txt"

# Create a modified docker-compose for offline use that works with both Docker and Podman
cat > "${TEMP_DIR}/${PACKAGE_NAME}/docker-compose.offline.yml" << EOF
version: '3'

services:
  deltavision:
    image: IMAGENAME_PLACEHOLDER
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

1. **Docker Engine** (19.03 or newer) or **Podman** (3.0 or newer)
2. **Docker Compose** (1.25.0 or newer) or **Podman Compose**
3. **unzip** utility to extract this package

## Docker/Podman Permissions

Ensure your user has appropriate permissions:

```bash
# For Docker - add your user to the docker group
sudo usermod -aG docker $USER
# Then log out and back in, or run this to apply changes to current session
newgrp docker

# For Podman - most installations don't require special permissions
# If using rootless Podman, make sure your user namespace is properly configured
```

## Installation Steps

1. **Extract the package**:
   ```bash
   unzip deltavision-docker-offline-x.x.x.zip
   cd deltavision-docker-offline-x.x.x
   ```

2. **Run the configuration script** (recommended):
   ```bash
   ./scripts/configure-offline.sh
   ```
   This interactive script will:
   - Detect Docker or Podman automatically
   - Prompt for your OLD and NEW folder paths
   - Prompt for a custom keywords file (optional)
   - Prompt for a custom port (optional)
   - Automatically update both docker-compose.offline.yml and folder-config.json
   - Guide you through the next steps

   **OR** manually configure (alternative):

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
   # For Docker:
   docker-compose -f docker-compose.offline.yml up -d
   
   # For Podman:
   podman-compose -f docker-compose.offline.yml up -d
   # or
   podman compose -f docker-compose.offline.yml up -d
   ```

6. **Access DeltaVision**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## System Requirements

- **Disk space**: ~100MB for the container image plus space for your data
- **Memory**: 1GB RAM recommended
- **Ports**: Port 3000 must be available (or change in docker-compose)

## Troubleshooting

- **Port conflicts**: If port 3000 is already in use, modify the port mapping in `docker-compose.offline.yml` (e.g., change to `8080:3000`).
- **Container engine access**: Make sure your user has rights to run Docker/Podman commands or use sudo.
- **File permissions**: Ensure your mounted volumes have the correct read/write permissions.
- **Podman image naming**: If using Podman and you see errors about image not found, check if the image was loaded with a `localhost/` prefix.

For additional information, please refer to the `DOCKER-README.md` file.
EOF

# Create startup script
cat > "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision-offline.sh" << EOF
#!/usr/bin/env bash

# Detect if we're using Podman or Docker
CONTAINER_ENGINE="docker"
COMPOSE_CMD="docker-compose"

if command -v podman &> /dev/null && podman --version | grep -q "podman"; then
  CONTAINER_ENGINE="podman"
  if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
  elif \${CONTAINER_ENGINE} compose --help &> /dev/null; then
    COMPOSE_CMD="podman compose"
  else
    echo "Warning: Podman detected but podman-compose not found."
    echo "Please install podman-compose or ensure podman compose is available."
    echo "Attempting to continue with docker-compose (may not work with Podman)..."
  fi
fi

echo "Using container engine: \${CONTAINER_ENGINE}"
echo "Using compose command: \${COMPOSE_CMD}"

# Ensure container engine is available
if ! command -v \${CONTAINER_ENGINE} &> /dev/null; then
  echo "Container engine (\${CONTAINER_ENGINE}) is not installed or not in PATH."
  echo "Please install Docker or Podman first."
  exit 1
fi

# Load the image if not already loaded
IMAGE_NAME="deltavision:${VERSION}"
PODMAN_IMAGE_NAME="localhost/deltavision:${VERSION}"

# Check if image exists, with Podman awareness
if ! \${CONTAINER_ENGINE} image inspect \${IMAGE_NAME} &> /dev/null; then
  if [ "\${CONTAINER_ENGINE}" = "podman" ] && \${CONTAINER_ENGINE} image inspect \${PODMAN_IMAGE_NAME} &> /dev/null; then
    echo "Image already loaded as \${PODMAN_IMAGE_NAME}"
    # Update the docker-compose file to use the Podman image name
    sed -i.bak "s|image: .*|image: \${PODMAN_IMAGE_NAME}|g" docker-compose.offline.yml
  else
    echo "Loading DeltaVision container image..."
    \${CONTAINER_ENGINE} load -i deltavision-image.tar
    
    # Check if Podman prefixed the image with localhost/
    if [ "\${CONTAINER_ENGINE}" = "podman" ] && ! \${CONTAINER_ENGINE} image inspect \${IMAGE_NAME} &> /dev/null && \${CONTAINER_ENGINE} image inspect \${PODMAN_IMAGE_NAME} &> /dev/null; then
      echo "Podman loaded the image as \${PODMAN_IMAGE_NAME}"
      # Update the docker-compose file to use the Podman image name
      sed -i.bak "s|image: .*|image: \${PODMAN_IMAGE_NAME}|g" docker-compose.offline.yml
    fi
  fi
fi

# Start the application using the appropriate compose command
echo "Starting DeltaVision..."
if [ "\${COMPOSE_CMD}" = "podman compose" ]; then
  \${CONTAINER_ENGINE} compose -f docker-compose.offline.yml up -d
else
  \${COMPOSE_CMD} -f docker-compose.offline.yml up -d
fi

# Extract port from docker-compose file
PORT=\$(grep -oP '"\K[0-9]+(?=:3000")' docker-compose.offline.yml || echo "3000")

echo "DeltaVision is now running on http://localhost:\${PORT}"
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
echo "4. Run the configuration script: ./scripts/configure-offline.sh"
echo "   This will guide you through setting up both files at once"
echo "5. Load the container image: ${CONTAINER_ENGINE} load -i deltavision-image.tar"
echo "6. Start with: ${CONTAINER_ENGINE}-compose -f docker-compose.offline.yml up -d"
echo "   (or use ./start-deltavision-offline.sh for automatic detection)"
echo "----------------------------------------"
