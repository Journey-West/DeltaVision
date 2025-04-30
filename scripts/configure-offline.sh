#!/usr/bin/env bash

# configure-offline.sh
# Helper script to configure DeltaVision in offline mode
# This script should be included in the offline package and run after extraction

set -e  # Exit immediately if a command exits with a non-zero status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Check for container engine type
if [ -f "${PARENT_DIR}/container-engine.txt" ]; then
  PACKAGE_CONTAINER_ENGINE=$(cat "${PARENT_DIR}/container-engine.txt")
else
  PACKAGE_CONTAINER_ENGINE="docker"
fi

# Detect current container engine (may be different from packaging environment)
CONTAINER_ENGINE="docker"
COMPOSE_CMD="docker-compose"

if command -v podman &> /dev/null && podman --version | grep -q "podman"; then
  CONTAINER_ENGINE="podman"
  if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
  elif ${CONTAINER_ENGINE} compose --help &> /dev/null; then
    COMPOSE_CMD="podman compose"
  else
    echo "Warning: Podman detected but podman-compose not found."
    echo "Please install podman-compose or ensure podman compose is available."
    echo "Attempting to continue with docker-compose (may not work with Podman)..."
  fi
  echo "Detected Podman as container engine"
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

# Function to validate directory existence
validate_dir() {
  if [ ! -d "$1" ]; then
    echo "Warning: Directory $1 does not exist. Do you want to:"
    echo "  1. Create it"
    echo "  2. Specify a different path"
    echo "  3. Continue anyway (not recommended)"
    read -p "Select option (1-3): " choice
    
    case $choice in
      1)
        echo "Creating directory: $1"
        mkdir -p "$1"
        ;;
      2)
        return 1  # Indicate need for a different path
        ;;
      3)
        echo "Continuing with non-existent directory."
        ;;
      *)
        echo "Invalid choice. Please try again."
        validate_dir "$1"
        ;;
    esac
  fi
  
  return 0  # Directory exists or issue resolved
}

# Get Old Folder path
get_old_folder() {
  read -p "Enter the path to your OLD data folder: " OLD_DIR
  
  if validate_dir "$OLD_DIR"; then
    echo "Using OLD folder: $OLD_DIR"
  else
    get_old_folder
  fi
}

# Get New Folder path
get_new_folder() {
  read -p "Enter the path to your NEW data folder: " NEW_DIR
  
  if validate_dir "$NEW_DIR"; then
    echo "Using NEW folder: $NEW_DIR"
  else
    get_new_folder
  fi
}

# Get Keywords file path (optional)
get_keywords_file() {
  read -p "Enter the path to your keywords file (leave empty to use default): " KW_FILE
  
  if [ -z "$KW_FILE" ]; then
    KW_FILE="./keywords.txt"
    echo "Using default keywords file: $KW_FILE"
  elif [ ! -f "$KW_FILE" ]; then
    echo "Warning: Keywords file $KW_FILE does not exist."
    echo "  1. Use it anyway (file will be created if needed)"
    echo "  2. Specify a different path"
    echo "  3. Use default (./keywords.txt)"
    read -p "Select option (1-3): " choice
    
    case $choice in
      1)
        echo "Using non-existent keywords file: $KW_FILE"
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
        echo "Invalid choice. Please try again."
        get_keywords_file
        return
        ;;
    esac
  fi
}

# Get custom port (optional)
get_custom_port() {
  read -p "Enter a custom port to run DeltaVision on (leave empty for default 3000): " CUSTOM_PORT
  
  if [ -z "$CUSTOM_PORT" ]; then
    CUSTOM_PORT="3000"
    echo "Using default port: $CUSTOM_PORT"
  elif ! [[ "$CUSTOM_PORT" =~ ^[0-9]+$ ]]; then
    echo "Error: Port must be a number."
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
echo "Compose Command: $COMPOSE_CMD"
echo "----------------------------------------"
echo

# Confirm settings
read -p "Are these settings correct? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Configuration cancelled. Please run the script again."
  exit 1
fi

# Create a backup of original files
echo "Creating backup of original configuration files..."
cp "$PARENT_DIR/docker-compose.offline.yml" "$PARENT_DIR/docker-compose.offline.yml.bak"
cp "$PARENT_DIR/folder-config.json" "$PARENT_DIR/folder-config.json.bak"

# Set the correct image name based on container engine
IMAGE_NAME="deltavision:${VERSION}"
if [ "$CONTAINER_ENGINE" = "podman" ]; then
  PODMAN_IMAGE_NAME="localhost/deltavision:${VERSION}"
  # Check if the Podman image exists
  if ${CONTAINER_ENGINE} image inspect "${PODMAN_IMAGE_NAME}" &> /dev/null; then
    IMAGE_NAME="${PODMAN_IMAGE_NAME}"
  fi
fi

# Update docker-compose.offline.yml
echo "Updating docker-compose.offline.yml..."
# Replace IMAGENAME_PLACEHOLDER with the correct image reference
sed -i.tmp "s|image: IMAGENAME_PLACEHOLDER|image: ${IMAGE_NAME}|g" "$PARENT_DIR/docker-compose.offline.yml"
sed -i.tmp "s|- /path/to/your/old/folder:/app/data/old|- $OLD_DIR:/app/data/old|g" "$PARENT_DIR/docker-compose.offline.yml"
sed -i.tmp "s|- /path/to/your/new/folder:/app/data/new|- $NEW_DIR:/app/data/new|g" "$PARENT_DIR/docker-compose.offline.yml"

# Update port if custom
if [ "$CUSTOM_PORT" != "3000" ]; then
  sed -i.tmp "s|\"3000:3000\"|\"$CUSTOM_PORT:3000\"|g" "$PARENT_DIR/docker-compose.offline.yml"
fi

# Update folder-config.json
echo "Updating folder-config.json..."
cat > "$PARENT_DIR/folder-config.json" << EOF
{
  "oldFolderPath": "/app/data/old",
  "newFolderPath": "/app/data/new",
  "keywordFilePath": "/app/keywords.txt"
}
EOF

# Clean up temporary files
rm -f "$PARENT_DIR/docker-compose.offline.yml.tmp"

echo
echo "----------------------------------------"
echo "Configuration completed successfully!"
echo
echo "Next steps:"
echo "1. Load the container image:"
if [ "$CONTAINER_ENGINE" = "docker" ]; then
  echo "   docker load -i deltavision-image.tar"
  echo
  echo "2. Start DeltaVision:"
  echo "   docker-compose -f $PARENT_DIR/docker-compose.offline.yml up -d"
else
  echo "   podman load -i deltavision-image.tar"
  echo
  echo "2. Start DeltaVision:"
  if [ "$COMPOSE_CMD" = "podman compose" ]; then
    echo "   podman compose -f $PARENT_DIR/docker-compose.offline.yml up -d"
  else
    echo "   podman-compose -f $PARENT_DIR/docker-compose.offline.yml up -d"
  fi
  echo
  echo "   Alternatively, you can use the provided start script:"
  echo "   ./start-deltavision-offline.sh"
fi
echo
echo "3. Access DeltaVision in your browser:"
echo "   http://localhost:$CUSTOM_PORT"
echo "----------------------------------------"
