#!/usr/bin/env bash

# start-deltavision.sh
# Usage: ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]
# Simple helper to configure and launch DeltaVision.

# Color definitions for better user experience
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define message functions
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

cat << "EOF"
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 

===== DeltaVision Startup Helper =====
EOF

# Function to check if a command exists
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "Required command not found: $1"
    echo "  - This command is necessary for DeltaVision to operate"
    if [ "$1" = "node" ]; then
      echo "  - Please install Node.js: https://nodejs.org/"
      echo "  - For Ubuntu/Debian: sudo apt install nodejs npm"
      echo "  - For RHEL/CentOS: sudo dnf install nodejs npm"
    elif [ "$1" = "npm" ]; then
      echo "  - Please install npm: https://www.npmjs.com/get-npm"
      echo "  - For Ubuntu/Debian: sudo apt install npm"
      echo "  - For RHEL/CentOS: sudo dnf install npm"
    fi
    return 1
  fi
  return 0
}

# Function to check if node_modules exists and install dependencies if missing
check_dependencies() {
  info "Checking Node.js dependencies..."
  
  # Check if node and npm are installed
  if ! check_command "node"; then
    exit 1
  fi
  
  if ! check_command "npm"; then
    exit 1
  fi
  
  # Check Node.js version
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
  
  if [ "$NODE_MAJOR" -lt 14 ]; then
    warning "Node.js version $NODE_VERSION may be too old"
    echo "  - DeltaVision works best with Node.js 14.x or newer"
    echo "  - Consider upgrading Node.js: https://nodejs.org/"
  else
    info "Node.js version: $NODE_VERSION"
  fi
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
    warning "Dependencies not found. Installing required packages..."
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
      error "Missing package.json file"
      echo "  - Cannot install dependencies without package.json"
      echo "  - Make sure you're running this script from the DeltaVision root directory"
      exit 1
    fi
    
    # Try to install dependencies
    npm install
    if [ $? -ne 0 ]; then
      error "Failed to install dependencies"
      echo "  - Check npm error messages above"
      echo "  - Ensure you have internet connectivity (not in an air-gapped environment)"
      echo "  - Try running 'npm install' manually"
      exit 1
    fi
    success "Dependencies installed successfully"
  else
    success "Dependencies already installed"
  fi
}

# Verify correct number of arguments
if [[ $# -lt 2 ]]; then
  error "Insufficient arguments provided"
  echo "Usage: $0 <old_folder> <new_folder> [keywords_file]"
  echo "  <old_folder>    Path to the folder containing old/original files"
  echo "  <new_folder>    Path to the folder containing new/modified files"
  echo "  [keywords_file] Optional path to custom keywords file (default: keywords.txt)"
  exit 1
fi

# Get absolute paths to all directories and files
info "Configuring folder paths..."
OLD_DIR=$(realpath "$1")
if [ ! -d "$OLD_DIR" ]; then
  error "Old folder does not exist: $OLD_DIR"
  echo "  - Please provide a valid directory for old/original files"
  exit 1
fi

NEW_DIR=$(realpath "$2")
if [ ! -d "$NEW_DIR" ]; then
  error "New folder does not exist: $NEW_DIR"
  echo "  - Please provide a valid directory for new/modified files"
  exit 1
fi

# Set up keywords file
KW_FILE=${3:-"keywords.txt"}
KW_FILE=$(realpath "$KW_FILE")
if [ ! -f "$KW_FILE" ]; then
  warning "Keywords file not found: $KW_FILE"
  echo "  - Using default keywords file: $(pwd)/keywords.txt"
  KW_FILE="$(pwd)/keywords.txt"
  
  # Check if default keywords file exists
  if [ ! -f "$KW_FILE" ]; then
    warning "Default keywords file not found, creating empty file"
    echo "# Add keywords for highlighting, one per line" > "$KW_FILE"
    echo "# Lines starting with # are comments" >> "$KW_FILE"
    echo "# Example:" >> "$KW_FILE"
    echo "important" >> "$KW_FILE"
    echo "critical" >> "$KW_FILE"
  fi
fi

# Create configuration file
CONFIG_FILE="$(pwd)/folder-config.json"
info "Creating configuration file: $CONFIG_FILE"

cat > "$CONFIG_FILE" <<EOF
{
  "oldFolderPath": "$OLD_DIR",
  "newFolderPath": "$NEW_DIR",
  "keywordFilePath": "$KW_FILE"
}
EOF

if [ ! -f "$CONFIG_FILE" ]; then
  error "Failed to create configuration file"
  echo "  - Check write permissions in current directory"
  exit 1
fi

success "Configuration written to $CONFIG_FILE"
echo "  - Old folder: $OLD_DIR"
echo "  - New folder: $NEW_DIR"
echo "  - Keywords: $KW_FILE"

# Check and install dependencies if needed
check_dependencies

# Verify the configuration was actually created and is in the expected location
if [ ! -f "$CONFIG_FILE" ]; then
  error "Configuration file not found at $CONFIG_FILE"
  echo "  - This is required for DeltaVision to recognize your folder paths"
  exit 1
fi

# Set NODE_ENV to ensure the application prioritizes the local folder-config.json
export NODE_ENV=production

# Start the application
info "Starting DeltaVision..."
echo "  - Access via browser at: http://localhost:3000"
echo "  - Press Ctrl+C to stop the server"
echo "----------------------------------------"
# Use the CLI version that properly processes arguments
node "$(pwd)/bin/deltavision.js" --old="$OLD_DIR" --new="$NEW_DIR" --keywords="$KW_FILE"

# Note: the deltavision CLI will block until the user presses Ctrl+C
echo
success "DeltaVision has been stopped"
