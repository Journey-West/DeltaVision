#!/usr/bin/env bash

# configure-offline.sh
# Helper script to configure DeltaVision in offline mode
# This script should be included in the offline package and run after extraction

set -e  # Exit immediately if a command exits with a non-zero status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Enable debug output if DEBUG environment variable is set
if [ "${DEBUG}" = "true" ]; then
  set -x
fi

# Header section with color definitions and helper functions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions for better error messages
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

# Check if a command exists
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "Required command not found: $1"
    echo "  - This command is necessary for the script to function correctly."
    echo "  - Please install it using your system's package manager."
    return 1
  fi
  return 0
}

# Check directory existence with better error messaging
check_dir() {
  if [ ! -d "$1" ]; then
    error "Directory does not exist: $1"
    echo "  - This directory is required for DeltaVision to function correctly."
    return 1
  fi
  return 0
}

# Check if a file can be written
check_writable() {
  if [ ! -w "$1" ]; then
    error "File not writable: $1"
    echo "  - You need write permissions for this file."
    echo "  - Try running the script with sudo or check file permissions."
    return 1
  fi
  return 0
}

# Enable debug output if DEBUG environment variable is set
if [ "${DEBUG}" = "true" ]; then
  set -x
fi

# Check for container engine type
if [ -f "${PARENT_DIR}/container-engine.txt" ]; then
  PACKAGE_CONTAINER_ENGINE=$(cat "${PARENT_DIR}/container-engine.txt")
else
  PACKAGE_CONTAINER_ENGINE="docker"
fi

# Check for compose availability
if [ -f "${PARENT_DIR}/compose-available.txt" ]; then
  PACKAGE_COMPOSE_AVAILABLE=$(cat "${PARENT_DIR}/compose-available.txt")
else
  PACKAGE_COMPOSE_AVAILABLE="true"
fi

# Check for compose command
if [ -f "${PARENT_DIR}/compose-cmd.txt" ]; then
  PACKAGE_COMPOSE_CMD=$(cat "${PARENT_DIR}/compose-cmd.txt")
else
  PACKAGE_COMPOSE_CMD="docker-compose"
fi

# Detect current container engine (may be different from packaging environment)
info "Detecting container engine..."
CONTAINER_ENGINE="docker"
COMPOSE_AVAILABLE=false
COMPOSE_CMD=""

if command -v podman &> /dev/null; then
  CONTAINER_ENGINE="podman"
  info "Detected Podman as container engine"
  
  # Test podman-compose
  if command -v podman-compose &> /dev/null; then
    # Verify it actually works
    if podman-compose --version &> /dev/null; then
      COMPOSE_CMD="podman-compose"
      COMPOSE_AVAILABLE=true
      success "Using podman-compose"
    else
      warning "Found podman-compose but it failed to execute"
      echo "  - Check installation: which podman-compose"
      echo "  - Try reinstalling: pip install -U podman-compose"
    fi
  fi
  
  # Test podman compose subcommand
  if ! ${COMPOSE_AVAILABLE} && podman compose version &> /dev/null; then
    # Test if -f flag is supported
    if podman compose -f /dev/null --help &> /dev/null; then
      COMPOSE_CMD="podman compose"
      COMPOSE_AVAILABLE=true
      success "Using podman compose with -f flag"
    else
      # Test if compose works without -f flag
      cd "${PARENT_DIR}"
      if podman compose --help &> /dev/null; then
        COMPOSE_CMD="podman compose"
        COMPOSE_AVAILABLE=true
        success "Using podman compose (directory based)"
      fi
    fi
  fi
  
  if ! ${COMPOSE_AVAILABLE}; then
    warning "No Podman Compose functionality available"
    echo "  - Will use direct podman commands as fallback"
    echo "  - To enable compose functionality:"
    echo "    1. Install podman-compose: pip install podman-compose"
    echo "    2. Or use newer Podman with built-in compose functionality"
  fi
  
elif command -v docker &> /dev/null; then
  info "Detected Docker as container engine"
  # Test docker-compose
  if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_AVAILABLE=true
    success "Using docker-compose"
  else
    warning "Docker found but docker-compose is not available"
    echo "  - Install docker-compose to enable additional functionality:"
    echo "    - Ubuntu/Debian: sudo apt install docker-compose"
    echo "    - RHEL/CentOS: sudo dnf install docker-compose"
    echo "    - Or via pip: pip install docker-compose"
  fi
else
  error "No container engine found. You need either Docker or Podman."
  echo "  - For Red Hat/CentOS: sudo dnf install podman"
  echo "  - For Ubuntu/Debian: sudo apt install docker.io"
  echo "  - For other systems, see https://docs.docker.com/engine/install/"
  exit 1
fi

# Get version from docker-compose file
VERSION=$(grep "image:" "${PARENT_DIR}/docker-compose.offline.yml" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "1.0.0")

cat << "EOF"
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 

===== DeltaVision Offline Configuration Helper =====
EOF

echo "This script will help you configure DeltaVision for your environment."
echo "You'll need to provide paths to your data directories."
echo "----------------------------------------"

# Function to validate directory existence and permissions
validate_dir() {
  if [ ! -d "$1" ]; then
    warning "Directory $1 does not exist. Options:"
    echo "  1. Create it"
    echo "  2. Specify a different path"
    echo "  3. Continue anyway (not recommended)"
    read -p "Select option (1-3): " choice
    
    case $choice in
      1)
        info "Creating directory: $1"
        if mkdir -p "$1"; then
          success "Directory created successfully"
        else
          error "Failed to create directory $1"
          echo "  - Check if parent directory exists and is writable"
          echo "  - Check if you have sufficient permissions"
          echo "  - Try running with sudo if needed"
          return 1
        fi
        ;;
      2)
        return 1  # Indicate need for a different path
        ;;
      3)
        warning "Continuing with non-existent directory."
        echo "  - You may encounter problems when starting DeltaVision"
        ;;
      *)
        error "Invalid choice. Please try again."
        validate_dir "$1"
        ;;
    esac
  fi
  
  # Check if directory is writable
  if [ ! -w "$1" ]; then
    error "Directory $1 is not writable"
    echo "  - Options:"
    echo "    1. Change permissions: chmod u+w $1"
    echo "    2. Change ownership: chown $USER $1"
    echo "    3. Specify a different writable directory"
    echo "    4. Continue anyway (not recommended)"
    read -p "Select option (1-4): " choice
    
    case $choice in
      1)
        info "Attempting to make directory writable..."
        if chmod u+w "$1"; then
          success "Permissions updated successfully"
        else
          error "Failed to change permissions"
          return 1
        fi
        ;;
      2)
        info "Attempting to change ownership..."
        if sudo chown $USER "$1" 2>/dev/null; then
          success "Ownership changed successfully"
        else
          error "Failed to change ownership"
          return 1
        fi
        ;;
      3)
        return 1  # Indicate need for a different path
        ;;
      4)
        warning "Continuing with non-writable directory."
        echo "  - You will likely encounter permissions errors when running DeltaVision"
        ;;
      *)
        error "Invalid choice. Please try again."
        validate_dir "$1"
        ;;
    esac
  fi
  
  success "Directory validated: $1"
  return 0
}

# Get Old Folder path
get_old_folder() {
  echo "Specify the directory containing your OLD files for comparison."
  echo "Example: $HOME/delta_old"
  read -p "Enter the path to your OLD data folder: " OLD_DIR
  
  if validate_dir "$OLD_DIR"; then
    echo "Using OLD folder: $OLD_DIR"
  else
    get_old_folder
  fi
}

# Get New Folder path
get_new_folder() {
  echo "Specify the directory containing your NEW files for comparison."
  echo "Example: $HOME/delta_new"
  read -p "Enter the path to your NEW data folder: " NEW_DIR
  
  if validate_dir "$NEW_DIR"; then
    echo "Using NEW folder: $NEW_DIR"
  else
    get_new_folder
  fi
}

# Get Keywords file path (optional)
get_keywords_file() {
  echo "Specify the path to a file containing keywords to highlight (one per line)."
  echo "Example: $HOME/keywords.txt or leave empty to use the default"
  read -p "Enter the path to your keywords file (leave empty to use default): " KW_FILE
  
  if [ -z "$KW_FILE" ]; then
    KW_FILE="./keywords.txt"
    echo "Using default keywords file: $KW_FILE"
  elif [ ! -f "$KW_FILE" ]; then
    error "Keywords file $KW_FILE does not exist."
    echo "  - Options:"
    echo "    1. Create it"
    echo "    2. Specify a different path"
    echo "    3. Use default (./keywords.txt)"
    read -p "Select option (1-3): " choice
    
    case $choice in
      1)
        info "Creating keywords file: $KW_FILE"
        if touch "$KW_FILE"; then
          success "Keywords file created successfully"
        else
          error "Failed to create keywords file"
          return 1
        fi
        ;;
      2)
        get_keywords_file
        return
        ;;
      3)
        KW_FILE="./keywords.txt"
        echo "Using default keywords file: $KW_FILE"
        ;;
      *)
        error "Invalid choice. Please try again."
        get_keywords_file
        return
        ;;
    esac
  fi
}

# Get custom port (optional)
get_custom_port() {
  echo "Specify a port number to access DeltaVision's web interface."
  echo "Example: 3000 (default), 8080, 9000, etc."
  read -p "Enter a custom port to run DeltaVision on (leave empty for default 3000): " CUSTOM_PORT
  
  if [ -z "$CUSTOM_PORT" ]; then
    CUSTOM_PORT="3000"
    echo "Using default port: $CUSTOM_PORT"
  elif ! [[ "$CUSTOM_PORT" =~ ^[0-9]+$ ]]; then
    error "Port must be a number."
    get_custom_port
    return
  fi
}

# Get input from user
get_old_folder
get_new_folder
get_keywords_file
get_custom_port

# Normalize paths to absolute
OLD_DIR=$(realpath "$OLD_DIR")
NEW_DIR=$(realpath "$NEW_DIR")
if [[ "$KW_FILE" != "./keywords.txt" ]]; then
  KW_FILE=$(realpath "$KW_FILE")
fi

echo
echo "----------------------------------------"
echo "Configuration Summary:"
echo "OLD folder: $OLD_DIR"
echo "NEW folder: $NEW_DIR"
echo "Keywords file: $KW_FILE"
echo "Port: $CUSTOM_PORT"
echo "Container Engine: $CONTAINER_ENGINE"

if [ "$COMPOSE_AVAILABLE" = "true" ]; then
  echo "Compose Command: $COMPOSE_CMD"
  if [ "$COMPOSE_CMD" = "podman compose" ]; then
    if podman compose -f /dev/null --help &> /dev/null; then
      echo "Compose -f flag: Supported"
    else
      echo "Compose -f flag: Not supported (will use directory-based approach)"
    fi
  fi
else
  echo "Compose: Not available (will use direct container commands)"
fi

echo "----------------------------------------"
echo

# Confirm settings
read -p "Are these settings correct? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  error "Configuration cancelled. Please run the script again."
  exit 1
fi

# Create a backup of original files
info "Creating backup of original configuration files..."
if [ -f "${PARENT_DIR}/docker-compose.offline.yml" ]; then
  if ! cp "${PARENT_DIR}/docker-compose.offline.yml" "${PARENT_DIR}/docker-compose.offline.yml.bak"; then
    error "Failed to backup docker-compose.offline.yml"
    echo "  - Check if the directory is writable"
    echo "  - Check disk space"
  else
    success "Created backup: docker-compose.offline.yml.bak"
  fi
else
  warning "docker-compose.offline.yml not found, no backup created"
  echo "  - A new file will be created"
fi

if [ -f "${PARENT_DIR}/folder-config.json" ]; then
  if ! cp "${PARENT_DIR}/folder-config.json" "${PARENT_DIR}/folder-config.json.bak"; then
    error "Failed to backup folder-config.json"
    echo "  - Check if the directory is writable"
    echo "  - Check disk space"
  else
    success "Created backup: folder-config.json.bak"
  fi
else
  warning "folder-config.json not found, no backup created"
  echo "  - A new file will be created"
fi

# Set the correct image name based on container engine
IMAGE_NAME="deltavision:${VERSION}"
if [ "$CONTAINER_ENGINE" = "podman" ]; then
  PODMAN_IMAGE_NAME="localhost/deltavision:${VERSION}"
  # Check if the Podman image exists
  if ${CONTAINER_ENGINE} image inspect "${PODMAN_IMAGE_NAME}" &> /dev/null; then
    IMAGE_NAME="${PODMAN_IMAGE_NAME}"
  fi
fi

# Create a modified docker-compose.yml for offline use
info "Creating docker-compose.offline.yml with your paths..."

cat > "${SCRIPT_DIR}/../docker-compose.offline.yml" << EOF
version: '3'

services:
  deltavision:
    image: localhost/deltavision:1.0.0
    container_name: deltavision
    ports:
      - "${CUSTOM_PORT}:3000"
    volumes:
      # Mount configuration file
      - ${PARENT_DIR}/folder-config.json:/app/folder-config.json
      # Mount custom keywords file 
      - ${KW_FILE}:/app/keywords.txt
      # Mount your data directories
      - ${OLD_DIR}:/app/data/old
      - ${NEW_DIR}:/app/data/new
    environment:
      - NODE_ENV=production
EOF

# Create a symlink in the root directory for backward compatibility
ln -sf "${SCRIPT_DIR}/../docker-compose.offline.yml" "${SCRIPT_DIR}/../docker-compose.offline.yml"

success "Created docker-compose.offline.yml with your configuration"

# Update folder-config.json
info "Updating folder-config.json..."
cat > "${PARENT_DIR}/folder-config.json" << EOF
{
  "oldFolderPath": "/app/data/old",
  "newFolderPath": "/app/data/new",
  "keywordFilePath": "/app/keywords.txt"
}
EOF

# Clean up temporary files
rm -f "${PARENT_DIR}/docker-compose.offline.yml.tmp"

# Validate configuration before proceeding
info "Validating configuration..."
CONFIG_ISSUES=false

if [ -z "$OLD_DIR" ] || [ ! -d "$OLD_DIR" ]; then
  warning "Old directory path is invalid or empty: '$OLD_DIR'"
  echo "  - The specified directory does not exist or is inaccessible"
  echo "  - DeltaVision will not be able to access 'old' files for comparison"
  echo "  - Create this directory: mkdir -p $OLD_DIR"
  echo "  - Or modify folder-config.json with a valid path"
  CONFIG_ISSUES=true
fi

if [ -z "$NEW_DIR" ] || [ ! -d "$NEW_DIR" ]; then
  warning "New directory path is invalid or empty: '$NEW_DIR'"
  echo "  - The specified directory does not exist or is inaccessible"
  echo "  - DeltaVision will not be able to access 'new' files for comparison"
  echo "  - Create this directory: mkdir -p $NEW_DIR"
  echo "  - Or modify folder-config.json with a valid path"
  CONFIG_ISSUES=true
fi

if [ "$CONFIG_ISSUES" = true ]; then
  warning "Configuration issues detected. Application may not function correctly."
  echo "  - You may need to manually edit folder-config.json and docker-compose.offline.yml."
  echo "  - Then run ./start-deltavision-offline.sh again."
  echo "  - Or recreate the configuration by running this script again."
  
  # Ask user if they want to continue despite issues
  read -p "Continue with current configuration despite issues? (y/n): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    error "Configuration aborted. Please run the script again with valid paths."
    exit 1
  fi
  
  info "Continuing with current configuration as requested."
  echo "  - You may need to fix issues manually later."
fi

# Update the container engine and compose-related files to reflect current environment
echo "${CONTAINER_ENGINE}" > "${PARENT_DIR}/container-engine.txt"
echo "${COMPOSE_AVAILABLE}" > "${PARENT_DIR}/compose-available.txt"
echo "${COMPOSE_CMD}" > "${PARENT_DIR}/compose-cmd.txt"

# Update the start script to improve platform-specific behavior
info "Ensuring start script has proper permissions..."
chmod +x "$PARENT_DIR/start-deltavision-offline.sh"

echo
echo "----------------------------------------"
success "Configuration completed successfully!"
echo
echo "Next steps:"
echo "1. Load the container image:"
if [ "$CONTAINER_ENGINE" = "docker" ]; then
  echo "   docker load -i $PARENT_DIR/deltavision-image.tar"
  echo
  echo "2. Start DeltaVision:"
  echo "   cd $PARENT_DIR && ./start-deltavision-offline.sh"
else
  echo "   podman load -i $PARENT_DIR/deltavision-image.tar"
  echo
  echo "2. Start DeltaVision (recommended):"
  echo "   cd $PARENT_DIR && ./start-deltavision-offline.sh"
fi
echo
echo "3. Access DeltaVision in your browser:"
echo "   http://localhost:$CUSTOM_PORT"
echo
info "If you encounter any issues:"
echo "  - Run verify-offline-package.sh to diagnose problems"
echo "  - Check OFFLINE-README.md for troubleshooting guidance"
echo "  - Run start-deltavision-offline.sh with DEBUG=true for verbose output"
echo "----------------------------------------"
