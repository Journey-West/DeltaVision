#!/usr/bin/env bash

# docker-package-offline.sh
# Creates a self-contained Docker package of DeltaVision for air-gapped environments
# Usage: ./docker-package-offline.sh [version]

set -e  # Exit immediately if a command exits with a non-zero status

# Color definitions for better error messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error and info message functions
error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
}

warning() {
  echo -e "${YELLOW}WARNING: $1${NC}" >&2
}

info() {
  echo -e "${BLUE}INFO: $1${NC}"
}

success() {
  echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to check if a command exists
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "Required command not found: $1"
    echo "  - This command is necessary for packaging DeltaVision."
    return 1
  fi
  return 0
}

# Function to verify a file exists in the package
verify_file() {
  if [ -f "${TEMP_DIR}/${PACKAGE_NAME}/$1" ]; then
    success "Verified: $1"
    return 0
  else
    error "Missing required file in package: $1"
    echo "  - This file is essential for DeltaVision to operate"
    echo "  - Check why it wasn't included in the package"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Default version if not specified
VERSION=${1:-"1.0.0"}
PACKAGE_NAME="deltavision-docker-offline-${VERSION}"
TEMP_DIR=$(mktemp -d)
if [ ! -d "$TEMP_DIR" ]; then
  error "Failed to create temporary directory"
  echo "  - Check if /tmp is writable"
  echo "  - Check available disk space: df -h /tmp"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info "Setting up environment..."
info "  - Package version: ${VERSION}"
info "  - Working directory: ${TEMP_DIR}"
info "  - Script directory: ${SCRIPT_DIR}"

# Check if zip is installed
if ! check_command zip; then
  error "The 'zip' command is not installed. Please install it first."
  echo "  - On Ubuntu/Debian: sudo apt-get install zip"
  echo "  - On CentOS/RHEL: sudo dnf install zip"
  exit 1
fi

# Detect if we're using Podman or Docker
info "Detecting container engine..."
CONTAINER_ENGINE="docker"
COMPOSE_AVAILABLE=true
COMPOSE_CMD="docker-compose"

# Detect container engine and compose capabilities
if check_command podman && podman --version | grep -q "podman"; then
  CONTAINER_ENGINE="podman"
  success "Detected Podman as container engine"
  
  # Fix the Podman compose detection logic
  test_podman_compose() {
    if command -v podman-compose &> /dev/null; then
      COMPOSE_CMD="podman-compose"
      COMPOSE_AVAILABLE=true
      echo "Using podman-compose"
      return 0
    fi
    if podman compose version &> /dev/null; then
      COMPOSE_CMD="podman compose"
      COMPOSE_AVAILABLE=true
      echo "Using podman compose"
      return 0
    fi
    return 1
  }

  if ! test_podman_compose; then
    COMPOSE_AVAILABLE=false
    warning "No Podman Compose functionality detected"
    echo "  - Will include instructions for using direct Podman commands"
    echo "  - The offline package will still work without compose"
  fi
elif ! check_command docker; then
  error "Neither Docker nor Podman found. Please install one of them."
  echo "  - For Ubuntu/Debian: sudo apt install docker.io"
  echo "  - For RHEL/CentOS: sudo dnf install podman"
  exit 1
else
  success "Detected Docker as container engine"
  # Check for docker-compose
  if ! check_command docker-compose; then
    warning "docker-compose not found, but packaging will continue"
    echo "  - The offline package has fallback measures for environments without compose"
    echo "  - For better experience, install docker-compose:"
    echo "  - For Ubuntu/Debian: sudo apt install docker-compose"
  else
    success "Detected docker-compose"
  fi
fi

# Verify daemon accessibility
info "Checking ${CONTAINER_ENGINE} daemon connectivity..."
if ! ${CONTAINER_ENGINE} info &> /dev/null; then
  error "Cannot connect to ${CONTAINER_ENGINE} daemon. Please start the daemon and try again."
  exit 1
fi

# Create directory structure
info "Creating directory structure..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}"
if [ $? -ne 0 ]; then
  error "Failed to create package directory structure"
  echo "  - Check disk space and permissions"
  exit 1
fi

# Build Docker image
info "Building Docker image (this may take a while)..."
if ! ${CONTAINER_ENGINE} build -t deltavision:${VERSION} -f "${SCRIPT_DIR}/../docker/Dockerfile" "${SCRIPT_DIR}/.."; then
  error "Failed to build Docker image"
  echo "  - Check if Dockerfile exists at ${SCRIPT_DIR}/../docker/Dockerfile"
  echo "  - Ensure Docker or Podman daemon is running"
  echo "  - Check for errors in the build output above"
  exit 1
fi
success "Docker image built successfully!"

# Save Docker image
info "Saving Docker image (this may take a while)..."
if ! ${CONTAINER_ENGINE} save deltavision:${VERSION} -o "${TEMP_DIR}/${PACKAGE_NAME}/deltavision-image.tar"; then
  error "Failed to save Docker image to tar file"
  echo "  - Check disk space: df -h"
  echo "  - Ensure you have write permissions to ${TEMP_DIR}"
  exit 1
fi
success "Docker image saved successfully!"
info "  - Image size: $(du -h "${TEMP_DIR}/${PACKAGE_NAME}/deltavision-image.tar" | cut -f1)"

# Create a directory structure for scripts in the package
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/scripts"
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/docs"

# Copy necessary files
info "Copying configuration files..."
cp_files=(
  "${SCRIPT_DIR}/../docker/docker-compose.yml"
  "${SCRIPT_DIR}/../docker/docker-compose.offline.yml"
  "${SCRIPT_DIR}/../folder-config.json"
  "${SCRIPT_DIR}/../keywords.txt"
  "${SCRIPT_DIR}/../README.md"
  "${SCRIPT_DIR}/../docs/OFFLINE-README.md"
)

for file in "${cp_files[@]}"; do
  if [ ! -f "$file" ]; then
    warning "Required file not found: $file"
    echo "  - This file is expected to exist in the repository"
    echo "  - Package may not function correctly without it"
    # Create a placeholder file with a warning
    filename=$(basename "$file")
    echo "WARNING: This file was missing during package creation. Please see documentation for proper structure." > "${TEMP_DIR}/${PACKAGE_NAME}/${filename}"
  else
    cp "$file" "${TEMP_DIR}/${PACKAGE_NAME}/"
    success "Copied: $(basename "$file")"
  fi
done

# Copy Docker README with a different name to avoid conflict
if [ -f "${SCRIPT_DIR}/../docker/README.md" ]; then
  cp "${SCRIPT_DIR}/../docker/README.md" "${TEMP_DIR}/${PACKAGE_NAME}/DOCKER-README.md"
  success "Copied: DOCKER-README.md"
else
  warning "Docker README.md not found"
  echo "  - File was expected at: ${SCRIPT_DIR}/../docker/README.md"
  echo "  - Creating a placeholder file"
  echo "WARNING: This file was missing during package creation. Please see main README.md for Docker instructions." > "${TEMP_DIR}/${PACKAGE_NAME}/DOCKER-README.md"
fi

# Copy documentation files to docs directory
doc_files=(
  "${SCRIPT_DIR}/../docs/INSTALLATION.md"
  "${SCRIPT_DIR}/../docs/OFFLINE-CHECKLIST.md"
)

for file in "${doc_files[@]}"; do
  if [ ! -f "$file" ]; then
    warning "Documentation file not found: $file"
    echo "  - Creating a placeholder file"
    mkdir -p "$(dirname "${TEMP_DIR}/${PACKAGE_NAME}/${file#${SCRIPT_DIR}/../}")"
    echo "WARNING: This documentation file was missing during package creation." > "${TEMP_DIR}/${PACKAGE_NAME}/${file#${SCRIPT_DIR}/../}"
  else
    mkdir -p "$(dirname "${TEMP_DIR}/${PACKAGE_NAME}/${file#${SCRIPT_DIR}/../}")"
    cp "$file" "${TEMP_DIR}/${PACKAGE_NAME}/${file#${SCRIPT_DIR}/../}"
    success "Copied documentation: $(basename "$file")"
  fi
done

# Copy scripts to the scripts directory in the package
if [ ! -f "${SCRIPT_DIR}/configure-offline.sh" ]; then
  error "Required script not found: configure-offline.sh"
  echo "  - This script is essential for offline configuration"
  echo "  - Cannot proceed without this file"
  exit 1
fi

cp "${SCRIPT_DIR}/configure-offline.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/"
success "Copied configuration script"

# Copy additional helper scripts
cp "${SCRIPT_DIR}/preflight-check.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/" && success "Copied: preflight-check.sh"
cp "${SCRIPT_DIR}/diagnostic-logger.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/" && success "Copied: diagnostic-logger.sh"
cp "${SCRIPT_DIR}/verify-offline-package.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/" && success "Copied: verification script"
cp "${SCRIPT_DIR}/verify-offline-dependencies.sh" "${TEMP_DIR}/${PACKAGE_NAME}/scripts/" && success "Copied: verify-offline-dependencies.sh"

# Make the configure script executable in the package
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/configure-offline.sh"
if [ -f "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-offline-package.sh" ]; then
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-offline-package.sh"
fi

# Store the container engine type and compose availability for later use
echo "${CONTAINER_ENGINE}" > "${TEMP_DIR}/${PACKAGE_NAME}/container-engine.txt"
echo "${COMPOSE_AVAILABLE}" > "${TEMP_DIR}/${PACKAGE_NAME}/compose-available.txt"
echo "${COMPOSE_CMD}" > "${TEMP_DIR}/${PACKAGE_NAME}/compose-cmd.txt"

# Create a modified docker-compose for offline use that works with both Docker and Podman
info "Creating docker-compose.offline.yml with placeholder values..."
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
2. **Docker Compose** or **Podman Compose** (optional, package will work without it)
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
   - Detect Compose functionality availability
   - Prompt for your OLD and NEW folder paths
   - Prompt for a custom keywords file (optional)
   - Prompt for a custom port (optional)
   - Automatically update configuration files
   - Guide you through the next steps

   **OR** manually configure (alternative):

3. **Install dependencies offline**:
   ```bash
   ./scripts/install-offline-deps.sh
   ```

4. **Configure your data directories**:
   Edit the `docker-compose.offline.yml` file to point to your actual data directories:
   ```yaml
   volumes:
     # Mount your data directories - edit these paths for your environment
     - /path/to/your/old/folder:/app/data/old
     - /path/to/your/new/folder:/app/data/new
   ```

5. **Update the folder configuration**:
   Edit `folder-config.json` to match your mounted directories:
   ```json
   {
     "oldFolderPath": "/app/data/old",
     "newFolderPath": "/app/data/new",
     "keywordFilePath": "/app/keywords.txt"
   }
   ```

6. **Start the application**:
   ```bash
   # The recommended approach (works with all configurations):
   ./start-deltavision-offline.sh
   
   # Alternatively, for Docker with Docker Compose:
   docker-compose -f docker-compose.offline.yml up -d
   
   # For Podman with podman-compose:
   podman-compose -f docker-compose.offline.yml up -d
   
   # For Podman with compose subcommand:
   podman compose -f docker-compose.offline.yml up -d
   
   # For Podman without compose functionality:
   # The start script will handle this automatically using direct podman commands
   ```

7. **Access DeltaVision**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## System Requirements

- **Disk space**: ~100MB for the container image plus space for your data
- **Memory**: 1GB RAM recommended
- **Ports**: Port 3000 must be available (or change in docker-compose)

## Troubleshooting

- **Port conflicts**: If port 3000 is already in use, modify the port mapping in configuration.
- **Container engine access**: Make sure your user has rights to run Docker/Podman commands or use sudo.
- **File permissions**: Ensure your mounted volumes have the correct read/write permissions.
- **Podman image naming**: If using Podman and you see errors about image not found, check if the image was loaded with a `localhost/` prefix.
- **Podman compose errors**: If you see errors with podman compose commands, try using the start-deltavision-offline.sh script which has robust fallback options.
- **Permission denied errors**: You may need to run the commands with sudo if your user doesn't have sufficient privileges.

For additional information, please refer to the `DOCKER-README.md` file.
EOF

# Create start script with rigorous fallback handling
cat > "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision-offline.sh" << 'EOF'
#!/usr/bin/env bash

# Set strict error handling
set -e

# Enable debug output if DEBUG environment variable is set
if [ "${DEBUG}" = "true" ]; then
  set -x
fi

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Detect if we're using Podman or Docker
CONTAINER_ENGINE="docker"
COMPOSE_AVAILABLE=false
COMPOSE_CMD=""

if command -v podman &> /dev/null; then
  CONTAINER_ENGINE="podman"
  echo "Detected Podman as container engine"
  
  # Test podman-compose
  if command -v podman-compose &> /dev/null; then
    # Verify it actually works
    if podman-compose --version &> /dev/null; then
      COMPOSE_CMD="podman-compose"
      COMPOSE_AVAILABLE=true
      echo "Using podman-compose"
    fi
  fi
  
  # Test podman compose subcommand
  if ! ${COMPOSE_AVAILABLE} && podman compose version &> /dev/null; then
    # Test if -f flag is supported
    if podman compose -f /dev/null --help &> /dev/null; then
      COMPOSE_CMD="podman compose"
      COMPOSE_AVAILABLE=true
      echo "Using podman compose with -f flag"
    else
      echo "Podman compose doesn't support -f flag, using directory-based approach"
      # Copy the compose file to docker-compose.yml for directory-based approach
      cp "${SCRIPT_DIR}/docker-compose.offline.yml" "${SCRIPT_DIR}/docker-compose.yml"
      cd "${SCRIPT_DIR}"
      podman compose up -d
      return $?
    fi
  fi
  
  if ! ${COMPOSE_AVAILABLE}; then
    echo "No Podman Compose functionality available, will use direct podman commands"
  fi
elif command -v docker &> /dev/null; then
  # Test docker-compose
  if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_AVAILABLE=true
    echo "Using docker-compose"
  fi
fi

# Load the image if not already loaded
IMAGE_NAME="deltavision:1.0.0"
LOCALHOST_PREFIX="localhost/"
PODMAN_IMAGE_NAME="${LOCALHOST_PREFIX}${IMAGE_NAME}"

# Check if image exists
if [ "${CONTAINER_ENGINE}" = "podman" ]; then
  if podman image inspect "${PODMAN_IMAGE_NAME}" &> /dev/null; then
    echo "Image already available as ${PODMAN_IMAGE_NAME}"
    IMAGE_NAME="${PODMAN_IMAGE_NAME}"
  elif podman image inspect "${IMAGE_NAME}" &> /dev/null; then
    echo "Image already available as ${IMAGE_NAME}"
  else
    echo "Loading DeltaVision container image..."
    podman load -i "${SCRIPT_DIR}/deltavision-image.tar"
    
    # Determine which name the image was loaded as
    if podman image inspect "${PODMAN_IMAGE_NAME}" &> /dev/null; then
      echo "Image loaded as ${PODMAN_IMAGE_NAME}"
      IMAGE_NAME="${PODMAN_IMAGE_NAME}"
    elif podman image inspect "${IMAGE_NAME}" &> /dev/null; then
      echo "Image loaded as ${IMAGE_NAME}"
    else
      echo "ERROR: Failed to load the image. Cannot continue."
      exit 1
    fi
  fi
else
  # Docker version
  if ! docker image inspect "${IMAGE_NAME}" &> /dev/null; then
    echo "Loading DeltaVision container image..."
    docker load -i "${SCRIPT_DIR}/deltavision-image.tar"
    
    if ! docker image inspect "${IMAGE_NAME}" &> /dev/null; then
      echo "ERROR: Failed to load the image. Cannot continue."
      exit 1
    fi
  else
    echo "Image already available as ${IMAGE_NAME}"
  fi
fi

# Update docker-compose file with correct image name
sed -i.bak "s|image: .*|image: ${IMAGE_NAME}|g" "${SCRIPT_DIR}/docker-compose.offline.yml"

# Extract information from docker-compose.offline.yml
info "Parsing compose file for runtime configuration..."
if command -v yq &> /dev/null; then
  PORT=$(yq e '.services.deltavision.ports[0]' "${SCRIPT_DIR}/docker-compose.offline.yml" | sed -E 's/([0-9]+):3000/\1/')
  OLD_MOUNT=$(yq e '.services.deltavision.volumes[]' "${SCRIPT_DIR}/docker-compose.offline.yml" | grep '/app/data/old' | cut -d':' -f1)
  NEW_MOUNT=$(yq e '.services.deltavision.volumes[]' "${SCRIPT_DIR}/docker-compose.offline.yml" | grep '/app/data/new' | cut -d':' -f1)
else
  warning "'yq' not found; falling back to basic parsing"
  PORT=$(grep -m1 '^[[:space:]]*- *"[0-9]\+:3000"' "${SCRIPT_DIR}/docker-compose.offline.yml" | sed -E 's/.*"([0-9]+):3000".*/\1/' || echo "3000")
  OLD_MOUNT=$(grep -A2 'volumes:' "${SCRIPT_DIR}/docker-compose.offline.yml" | grep '/app/data/old' | sed -E 's/.*-[[:space:]]*([^:]+):.*/\1/' || echo "/tmp:/app/data/old")
  NEW_MOUNT=$(grep -A2 'volumes:' "${SCRIPT_DIR}/docker-compose.offline.yml" | grep '/app/data/new' | sed -E 's/.*-[[:space:]]*([^:]+):.*/\1/' || echo "/tmp:/app/data/new")
fi

# Extract just the paths without the container paths
OLD_FOLDER=$(echo "${OLD_MOUNT}" | cut -d':' -f1)
NEW_FOLDER=$(echo "${NEW_MOUNT}" | cut -d':' -f1)

# Make sure volumes exist
if [ -n "${OLD_FOLDER}" ]; then
  mkdir -p "${OLD_FOLDER}"
fi
if [ -n "${NEW_FOLDER}" ]; then
  mkdir -p "${NEW_FOLDER}"
fi

# Start the application
echo "Starting DeltaVision..."

# Check if container is already running
if ${CONTAINER_ENGINE} ps | grep -q "deltavision"; then
  echo "DeltaVision container is already running. Stopping it first..."
  ${CONTAINER_ENGINE} stop deltavision || true
  ${CONTAINER_ENGINE} rm deltavision || true
fi

# Function to start with direct container command
start_with_direct_command() {
  echo "Starting with direct ${CONTAINER_ENGINE} command..."
  
  # Absolute path to required files
  FOLDER_CONFIG="${SCRIPT_DIR}/folder-config.json"
  KEYWORDS_FILE="${SCRIPT_DIR}/keywords.txt"
  
  # Verify files exist
  if [ ! -f "${FOLDER_CONFIG}" ]; then
    echo "ERROR: Could not find folder-config.json"
    return 1
  fi
  
  if [ ! -f "${KEYWORDS_FILE}" ]; then
    echo "ERROR: Could not find keywords.txt"
    return 1
  fi
  
  # Construct and run the command
  CMD="${CONTAINER_ENGINE} run -d --name deltavision -p ${PORT}:3000 \
    -v ${FOLDER_CONFIG}:/app/folder-config.json \
    -v ${KEYWORDS_FILE}:/app/keywords.txt \
    -v ${OLD_MOUNT} \
    -v ${NEW_MOUNT} \
    -e NODE_ENV=production \
    ${IMAGE_NAME}"
  
  echo "Running command: ${CMD}"
  
  # Execute the command and capture the exit code
  eval "${CMD}"
  RESULT=$?
  
  if [ ${RESULT} -eq 0 ]; then
    echo "Container started successfully with direct command!"
    return 0
  else
    echo "Failed to start container with direct command (exit code: ${RESULT})"
    return 1
  fi
}

# Function to start with compose
start_with_compose() {
  if [ "${COMPOSE_AVAILABLE}" != "true" ]; then
    echo "Compose functionality not available."
    return 1
  fi
  
  echo "Attempting to start with compose command: ${COMPOSE_CMD}"
  
  # Get the absolute path to the compose file
  COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.offline.yml"
  
  # Test if the compose command supports -f flag
  if [ "${COMPOSE_CMD}" = "podman compose" ]; then
    if podman compose -f "${COMPOSE_FILE}" --help &> /dev/null; then
      echo "Using podman compose with -f flag"
      podman compose -f "${COMPOSE_FILE}" up -d
      return $?
    else
      echo "Podman compose doesn't support -f flag, using directory-based approach"
      # Copy the compose file to docker-compose.yml for directory-based approach
      cp "${COMPOSE_FILE}" "${SCRIPT_DIR}/docker-compose.yml"
      cd "${SCRIPT_DIR}"
      podman compose up -d
      return $?
    fi
  elif [ "${COMPOSE_CMD}" = "podman-compose" ]; then
    podman-compose -f "${COMPOSE_FILE}" up -d
    return $?
  elif [ "${COMPOSE_CMD}" = "docker-compose" ]; then
    docker-compose -f "${COMPOSE_FILE}" up -d
    return $?
  else
    echo "Unknown compose command: ${COMPOSE_CMD}"
    return 1
  fi
}

# Try starting with appropriate method based on environment
if [ "${COMPOSE_AVAILABLE}" = "true" ]; then
  echo "Compose is available, trying compose method first..."
  if start_with_compose; then
    echo "Successfully started DeltaVision using compose."
  else
    echo "Compose command failed, falling back to direct container command..."
    if start_with_direct_command; then
      echo "Successfully started DeltaVision using direct container command."
    else
      echo "ERROR: All attempts to start DeltaVision failed."
      exit 1
    fi
  fi
else
  echo "No compose functionality available, using direct container command..."
  if start_with_direct_command; then
    echo "Successfully started DeltaVision using direct container command."
  else
    echo "ERROR: Failed to start DeltaVision container."
    echo "You may need to run this script with sudo if you have permission issues."
    exit 1
  fi
fi

echo "DeltaVision is now running on http://localhost:${PORT}"
EOF

# Make the script executable
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision-offline.sh"
success "Made start script executable"

# Create offline npm package cache
info "Creating offline npm package cache..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages"

# Move to project root to run npm commands
cd "${SCRIPT_DIR}/.."

# Create a clean package-lock.json with exact versions
if [ -f "package-lock.json" ]; then
  success "Found existing package-lock.json"
else
  warning "No package-lock.json found, generating one..."
  npm install --package-lock-only
  if [ $? -ne 0 ]; then
    error "Failed to generate package-lock.json"
    echo "  - This may cause issues with offline dependency installation"
    echo "  - Consider running 'npm install' in the project root before packaging"
  else
    success "Generated package-lock.json"
  fi
fi

# Use a more robust approach to download packages
info "Downloading npm packages for offline use (this may take a while)..."

# First try to do a proper npm install to ensure all dependencies are in node_modules
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  warning "Dependencies not found in node_modules. Installing them first..."
  npm install
  
  if [ $? -ne 0 ]; then
    warning "Failed to install dependencies. Will try to create package anyway."
    echo "  - This may lead to an incomplete offline package"
  else
    success "Dependencies installed successfully"
  fi
fi

# Use npm pack with a different approach
info "Packing npm dependencies..."

# Get direct dependencies from package.json
DEPS=$(node -e "console.log(Object.keys(require('./package.json').dependencies || {}).join(' '))")

if [ -z "$DEPS" ]; then
  warning "No dependencies found in package.json"
  echo "  - This will result in an incomplete offline package"
else
  success "Found dependencies: $DEPS"
  
  # Create an empty directory for npm cache to prevent using existing cache
  mkdir -p "${TEMP_DIR}/npm-cache"
  
  # Process each dependency individually
  for dep in $DEPS; do
    info "Packing dependency: $dep"
    
    # Try to get specific version from package.json
    DEP_VERSION=$(node -e "const pkg = require('./package.json'); const version = (pkg.dependencies || {})['$dep']; console.log(version);")
    
    # Pack the dependency with version if available
    if [[ "$DEP_VERSION" == ^* ]]; then
      # If version starts with ^, remove it for exact version
      DEP_VERSION="${DEP_VERSION:1}"
    fi
    
    if [ -n "$DEP_VERSION" ]; then
      npm pack "$dep@$DEP_VERSION" --cache="${TEMP_DIR}/npm-cache" || npm pack "$dep" --cache="${TEMP_DIR}/npm-cache"
    else
      npm pack "$dep" --cache="${TEMP_DIR}/npm-cache"
    fi
  done
  
  # Move packages to npm-packages directory
  mv *.tgz "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages/" 2>/dev/null || true
  
  # Count how many packages were downloaded
  PACKAGE_COUNT=$(find "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages" -name "*.tgz" | wc -l)
  
  if [ "$PACKAGE_COUNT" -eq 0 ]; then
    warning "No packages were downloaded. Creating placeholder packages directory."
    echo "# This directory should contain npm packages for offline installation" > "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages/README.txt"
    echo "# Please run 'npm install' on a connected system and copy the node_modules directory if needed" >> "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages/README.txt"
  else
    success "Downloaded $PACKAGE_COUNT npm packages for offline use"
  fi
fi

# As a backup, also include a copy of node_modules if it exists
if [ -d "node_modules" ]; then
  info "Copying node_modules directory as backup (this may take a while)..."
  mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/node_modules_backup"
  cp -r node_modules/* "${TEMP_DIR}/${PACKAGE_NAME}/node_modules_backup/" 2>/dev/null || true
  success "Node modules backup created"
fi

# Verify offline dependency packages exist
if [ -d "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages" ] && [ "$(find "${TEMP_DIR}/${PACKAGE_NAME}/npm-packages" -name "*.tgz" | wc -l)" -gt 0 ]; then
  success "Offline npm cache verified"
elif [ -d "${TEMP_DIR}/${PACKAGE_NAME}/node_modules_backup" ] && [ "$(ls -A "${TEMP_DIR}/${PACKAGE_NAME}/node_modules_backup" 2>/dev/null)" ]; then
  success "Node modules backup verified"
else
  error "Missing offline dependency packages"
  echo "  - Neither npm-packages (.tgz) nor node_modules_backup directory found"
  echo "  - Please run 'npm install' on a connected system and re-run this packaging script"
  exit 1
fi

# Create a script to install from the offline cache
cat > "${TEMP_DIR}/${PACKAGE_NAME}/scripts/install-offline-deps.sh" << 'EOF'
#!/usr/bin/env bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Message functions
error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
}

warning() {
  echo -e "${YELLOW}WARNING: $1${NC}" >&2
}

info() {
  echo -e "${BLUE}INFO: $1${NC}"
}

success() {
  echo -e "${GREEN}SUCCESS: $1${NC}"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
NPM_CACHE_DIR="${PACKAGE_DIR}/npm-packages"
NODE_MODULES_BACKUP="${PACKAGE_DIR}/node_modules_backup"

# Check if the npm cache directory exists
if [ ! -d "$NPM_CACHE_DIR" ]; then
  error "npm package cache directory not found: $NPM_CACHE_DIR"
  echo "  - The offline package may be incomplete"
  echo "  - Try recreating the offline package"
  exit 1
fi

info "Installing dependencies from offline cache..."
if [ ! -f "${PACKAGE_DIR}/package.json" ]; then
  error "package.json not found in ${PACKAGE_DIR}"
  echo "  - Cannot install dependencies without package.json"
  echo "  - Make sure you're in the correct directory"
  exit 1
fi

# Create a local .npm directory to use as a cache
mkdir -p "${PACKAGE_DIR}/.npm"

# Count packages in npm cache
PACKAGE_COUNT=$(find "${NPM_CACHE_DIR}" -name "*.tgz" | wc -l)

if [ $PACKAGE_COUNT -eq 0 ]; then
  warning "No npm packages found in cache. Looking for backup..."
  if [ -d "$NODE_MODULES_BACKUP" ] && [ "$(ls -A "$NODE_MODULES_BACKUP")" ]; then
    info "Found node_modules backup. Using it instead..."
    mkdir -p "${PACKAGE_DIR}/node_modules"
    cp -r "${NODE_MODULES_BACKUP}/"* "${PACKAGE_DIR}/node_modules/" 
    if [ $? -eq 0 ]; then
      success "Successfully copied node_modules from backup"
    else
      error "Failed to copy node_modules from backup"
      echo "  - Try installing dependencies manually"
      exit 1
    fi
  else
    error "No npm packages found in cache and no backup available"
    echo "  - You will need to install dependencies manually or copy node_modules from another system"
    exit 1
  fi
else
  # Add each package to the local npm cache
  for package in "${NPM_CACHE_DIR}"/*.tgz; do
    if [ -f "$package" ]; then
      package_name=$(basename "$package")
      info "Adding to local cache: ${package_name}"
      npm cache add "$package" --cache="${PACKAGE_DIR}/.npm" || warning "Failed to add ${package_name} to cache"
    fi
  done

  # Install dependencies using the local cache
  info "Installing packages from local cache (this may take a while)..."
  npm ci --no-audit --offline --cache="${PACKAGE_DIR}/.npm" || npm install --no-audit --offline --cache="${PACKAGE_DIR}/.npm"

  if [ $? -eq 0 ]; then
    success "Successfully installed dependencies from offline cache"
  else
    warning "Failed to install all dependencies from offline cache"
    echo "  - Checking for node_modules backup..."
    
    if [ -d "$NODE_MODULES_BACKUP" ] && [ "$(ls -A "$NODE_MODULES_BACKUP")" ]; then
      info "Found node_modules backup. Using it instead..."
      mkdir -p "${PACKAGE_DIR}/node_modules"
      cp -r "${NODE_MODULES_BACKUP}/"* "${PACKAGE_DIR}/node_modules/" 
      if [ $? -eq 0 ]; then
        success "Successfully copied node_modules from backup"
      else
        error "Failed to copy node_modules from backup"
        echo "  - Try installing dependencies manually"
        exit 1
      fi
    else
      error "Failed to install dependencies from cache and no backup available"
      echo "  - Try running with: npm install --no-audit --offline --cache=${PACKAGE_DIR}/.npm"
      echo "  - Or install dependencies manually"
      exit 1
    fi
  fi
fi
EOF

# Make the install script executable
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/install-offline-deps.sh"
success "Created offline dependency installation script"

# Verify the package contains all required files before creating the ZIP
info "Verifying package integrity..."
verify_file "start-deltavision-offline.sh"
verify_file "docker-compose.offline.yml"
verify_file "folder-config.json"
verify_file "keywords.txt"
verify_file "deltavision-image.tar"
verify_file "scripts/configure-offline.sh"
verify_file "scripts/install-offline-deps.sh"
verify_file "scripts/preflight-check.sh"
verify_file "scripts/diagnostic-logger.sh"
verify_file "scripts/verify-offline-dependencies.sh"

# Create the ZIP archive
info "Creating ZIP archive file..."
zip -r "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" "${PACKAGE_NAME}"
if [ $? -ne 0 ]; then
  error "Failed to create ZIP archive"
  echo "  - Check disk space and permissions"
  exit 1
fi

success "Created offline package: ${SCRIPT_DIR}/${PACKAGE_NAME}.zip"
echo "  - Size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
echo ""
success "DeltaVision offline package created successfully!"
echo "  - Package is ready for deployment in air-gapped environments"
echo "  - Transfer the package to the target system and extract it"
echo "  - Run ./scripts/configure-offline.sh to set up the environment"
echo "  - Run ./scripts/verify-offline-dependencies.sh to verify all dependencies"
echo "  - Run ./start-deltavision-offline.sh to start DeltaVision"
echo ""

# Cleanup
info "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

success "----------------------------------------"
success "Package successfully created: ${SCRIPT_DIR}/${PACKAGE_NAME}.zip"
info "Package size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
echo
echo "To install on an air-gapped system:"
echo "1. Transfer the ${PACKAGE_NAME}.zip file to the target system"
echo "2. Extract: unzip ${PACKAGE_NAME}.zip"
echo "3. CD into the directory: cd ${PACKAGE_NAME}"
echo "4. Run the configuration script: ./scripts/configure-offline.sh"
echo "   This will guide you through setting up both files at once"
echo "5. Load the container image: ${CONTAINER_ENGINE} load -i deltavision-image.tar"
echo "6. Start with the start-deltavision-offline.sh script:"
echo "   ./start-deltavision-offline.sh"
echo
info "For verbose error messages and diagnostics:"
echo "1. Run with debug mode: DEBUG=true ./start-deltavision-offline.sh"
echo "2. Run the verification script: ./scripts/verify-offline-package.sh"
echo "3. See OFFLINE-README.md for detailed troubleshooting steps"
echo "----------------------------------------"
