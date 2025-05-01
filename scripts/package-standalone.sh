#!/usr/bin/env bash
#
# package-standalone.sh
#
# Creates a standalone DeltaVision package with a statically-compiled Node.js binary
# for deployment in highly-restricted environments where Docker/Podman and Node.js
# cannot be installed.
#
# Usage: ./package-standalone.sh [version]
#

set -e

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

# Check if a command exists
check_command() {
  command -v "$1" &> /dev/null
  return $?
}

# Verify a file exists in the package
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
PACKAGE_NAME="deltavision-standalone-${VERSION}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create temporary directory for building the package
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

info "Setting up environment..."
echo "  - Package version: ${VERSION}"
echo "  - Working directory: ${TEMP_DIR}"
echo "  - Script directory: ${SCRIPT_DIR}"

# Create directory structure
info "Creating directory structure..."
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/app"
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/scripts"
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/docs"
mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/node"

# Platform detection
PLATFORM="linux-x64"
if [[ "$(uname)" == "Darwin" ]]; then
  if [[ "$(uname -m)" == "arm64" || "$(uname -m)" == "aarch64" ]]; then
    PLATFORM="darwin-arm64"
  else
    PLATFORM="darwin-x64"
  fi
elif [[ "$(uname)" == "Linux" ]]; then
  if [[ "$(uname -m)" == "aarch64" || "$(uname -m)" == "arm64" ]]; then
    PLATFORM="linux-arm64"
  else
    PLATFORM="linux-x64"
  fi
elif [[ "$(uname)" == *"MINGW"* || "$(uname)" == *"MSYS"* || "$(uname)" == *"CYGWIN"* ]]; then
  PLATFORM="win-x64"
fi

# Check for a precompiled Node.js binary
if [ -f "${SCRIPT_DIR}/../precompiled/node/${PLATFORM}/node" ]; then
  info "Using precompiled Node.js binary for ${PLATFORM}"
  mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/node"
  cp "${SCRIPT_DIR}/../precompiled/node/${PLATFORM}/node" "${TEMP_DIR}/${PACKAGE_NAME}/node/node"
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/node/node"
  success "Node.js binary prepared for offline use"
else
  # Download statically-compiled Node.js binary
  info "No precompiled binary found for ${PLATFORM}, downloading Node.js..."
  NODE_VERSION="18.17.1"
  NODE_DIST_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${PLATFORM}.tar.gz"

  if ! check_command curl && ! check_command wget; then
    error "Neither curl nor wget is available. Cannot download Node.js."
    echo "  - Please install curl or wget, or run scripts/prepare-precompiled-binaries.sh first"
    echo "  - Alternatively, manually download Node.js from ${NODE_DIST_URL}"
    echo "  - Place in: ${TEMP_DIR}/${PACKAGE_NAME}/node/"
    exit 1
  fi

  # Create temporary directory for Node.js download
  mkdir -p "${TEMP_DIR}/node-download"

  # Download using curl or wget
  if check_command curl; then
    info "Using curl to download Node.js binary..."
    if ! curl -L "${NODE_DIST_URL}" -o "${TEMP_DIR}/node-download/node.tar.gz"; then
      error "Failed to download Node.js using curl"
      echo "  - Try running scripts/prepare-precompiled-binaries.sh instead"
      exit 1
    fi
  elif check_command wget; then
    info "Using wget to download Node.js binary..."
    if ! wget -q "${NODE_DIST_URL}" -O "${TEMP_DIR}/node-download/node.tar.gz"; then
      error "Failed to download Node.js using wget"
      echo "  - Try running scripts/prepare-precompiled-binaries.sh instead"
      exit 1
    fi
  fi

  # Extract Node.js binary
  info "Extracting Node.js binary..."
  if ! tar -xzf "${TEMP_DIR}/node-download/node.tar.gz" -C "${TEMP_DIR}/node-download"; then
    error "Failed to extract Node.js binary"
    echo "  - Try running scripts/prepare-precompiled-binaries.sh instead"
    exit 1
  fi

  # Copy Node.js binary to package
  NODE_DIR=$(find "${TEMP_DIR}/node-download" -type d -name "node-v*" | head -n 1)
  if [ -z "${NODE_DIR}" ]; then
    error "Failed to find Node.js directory in extracted archive"
    echo "  - Try running scripts/prepare-precompiled-binaries.sh instead"
    exit 1
  fi

  # Copy Node.js binary to package
  info "Copying Node.js binary to package..."
  mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}/node"
  cp "${NODE_DIR}/bin/node" "${TEMP_DIR}/${PACKAGE_NAME}/node/node"
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/node/node"

  success "Node.js binary prepared for offline use"
fi

# Copy application code (excluding unnecessary files)
info "Copying application code..."
cd "${SCRIPT_DIR}/.."
rsync -av --exclude="node_modules" \
         --exclude=".git" \
         --exclude=".github" \
         --exclude="docker" \
         --exclude="logs" \
         --exclude="scripts" \
         --exclude="npm-packages" \
         --exclude="*.zip" \
         --exclude="*.tar" \
         --exclude="*.tar.gz" \
         . "${TEMP_DIR}/${PACKAGE_NAME}/app/"

success "Application code copied"

# Install dependencies in the package
info "Installing dependencies..."
cd "${TEMP_DIR}/${PACKAGE_NAME}/app"

if [ -f "package-lock.json" ]; then
  success "Found existing package-lock.json"
else
  warning "No package-lock.json found, generating one..."
  "${TEMP_DIR}/${PACKAGE_NAME}/node/node" "$(which npm)" install --package-lock-only
  if [ $? -ne 0 ]; then
    error "Failed to generate package-lock.json"
    echo "  - This may cause issues with offline dependency installation"
    echo "  - Consider running 'npm install' in the project root before packaging"
  else
    success "Generated package-lock.json"
  fi
fi

# Install dependencies using local Node.js binary
info "Installing dependencies (this may take a while)..."
"${TEMP_DIR}/${PACKAGE_NAME}/node/node" "$(which npm)" install --no-audit
if [ $? -ne 0 ]; then
  error "Failed to install dependencies"
  echo "  - This may cause issues when running DeltaVision"
  echo "  - Try running 'npm install' manually before packaging"
else
  success "Dependencies installed successfully"
fi

# Copy documentation
info "Copying documentation..."
cd "${SCRIPT_DIR}/.."
cp -f README.md "${TEMP_DIR}/${PACKAGE_NAME}/"
cp -f docs/INSTALLATION.md "${TEMP_DIR}/${PACKAGE_NAME}/docs/"
cp -f docs/OFFLINE-CHECKLIST.md "${TEMP_DIR}/${PACKAGE_NAME}/docs/"
cp -f docs/OFFLINE-README.md "${TEMP_DIR}/${PACKAGE_NAME}/docs/"

# Create standalone documentation
cat > "${TEMP_DIR}/${PACKAGE_NAME}/STANDALONE-README.md" << 'EOF'
# DeltaVision Standalone Edition

This is the standalone edition of DeltaVision, packaged with a statically-compiled Node.js binary. 
This package is designed for highly-restricted environments where Docker/Podman or Node.js 
cannot be installed.

## System Requirements

- Linux x64 system (other platforms available upon request)
- At least 200MB of disk space
- No internet connection required
- No additional software installation required

## Quick Start

1. Extract the package:
   ```
   unzip deltavision-standalone-1.0.0.zip
   ```

2. Enter the directory:
   ```
   cd deltavision-standalone-1.0.0
   ```

3. Run the start script:
   ```
   ./start-deltavision.sh /path/to/old/folder /path/to/new/folder [keywords.txt]
   ```

4. Access DeltaVision in your browser:
   ```
   http://localhost:3000
   ```

## Scripts

- `start-deltavision.sh`: Main script to start DeltaVision
- `scripts/verify-standalone.sh`: Verify the package integrity
- `scripts/help.sh`: Show help for all scripts

## Troubleshooting

If you encounter issues:

1. Run the verification script:
   ```
   ./scripts/verify-standalone.sh
   ```

2. Check permissions:
   ```
   chmod +x ./scripts/*.sh
   chmod +x ./node/node
   chmod +x ./start-deltavision.sh
   ```

3. See the full documentation in `docs/` directory

## License

See LICENSE file for details.
EOF

success "Documentation created"

# Create standalone start script
info "Creating startup script..."
cat > "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision.sh" << 'EOF'
#!/usr/bin/env bash
#
# DeltaVision Standalone Startup Script
#
# Usage: ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]
#

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="${SCRIPT_DIR}/node/node"

# Check if node binary exists and is executable
if [ ! -f "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  error "Node.js binary not found or not executable: $NODE_BIN"
  echo "  - Please make sure it exists and is executable"
  echo "  - Try: chmod +x $NODE_BIN"
  exit 1
fi

# Check parameters
if [ $# -lt 2 ]; then
  error "Missing required parameters"
  echo "Usage: $0 <old_folder> <new_folder> [keywords_file]"
  echo ""
  echo "Parameters:"
  echo "  old_folder     Path to the folder containing old files"
  echo "  new_folder     Path to the folder containing new files"
  echo "  keywords_file  Optional path to a file containing keywords to highlight"
  exit 1
fi

# Validate directories
OLD_FOLDER="$1"
NEW_FOLDER="$2"
KEYWORDS_FILE="${3:-${SCRIPT_DIR}/keywords.txt}"

if [ ! -d "$OLD_FOLDER" ]; then
  error "Old folder does not exist: $OLD_FOLDER"
  echo "  - Please provide a valid directory path"
  exit 1
fi

if [ ! -d "$NEW_FOLDER" ]; then
  error "New folder does not exist: $NEW_FOLDER"
  echo "  - Please provide a valid directory path"
  exit 1
fi

# Use default keywords file if not provided and it exists
if [ "$#" -lt 3 ] && [ -f "${SCRIPT_DIR}/keywords.txt" ]; then
  info "Using default keywords file: ${SCRIPT_DIR}/keywords.txt"
  KEYWORDS_FILE="${SCRIPT_DIR}/keywords.txt"
fi

# Check keywords file if provided
if [ "$#" -ge 3 ] && [ ! -f "$KEYWORDS_FILE" ]; then
  warning "Keywords file does not exist: $KEYWORDS_FILE"
  echo "  - Will proceed without keywords highlighting"
  echo "  - You can create a keywords.txt file with one keyword per line"
fi

# Create folder-config.json
CONFIG_FILE="${SCRIPT_DIR}/app/folder-config.json"
info "Creating configuration file: $CONFIG_FILE"

cat > "$CONFIG_FILE" << EOL
{
  "oldFolder": "$(realpath "${OLD_FOLDER}")",
  "newFolder": "$(realpath "${NEW_FOLDER}")",
  "keywordsFile": "$(realpath "${KEYWORDS_FILE}")"
}
EOL

success "Configuration file created"

# Start the application
info "Starting DeltaVision..."
echo "  - Old folder: $(realpath "${OLD_FOLDER}")"
echo "  - New folder: $(realpath "${NEW_FOLDER}")"
echo "  - Keywords file: $(realpath "${KEYWORDS_FILE}")"
echo ""

cd "${SCRIPT_DIR}/app"
"$NODE_BIN" src/server/index.js

# Exit with the same code as the Node.js process
exit $?
EOF

chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision.sh"
success "Startup script created"

# Create verification script
info "Creating verification script..."
cat > "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-standalone.sh" << 'EOF'
#!/usr/bin/env bash
#
# verify-standalone.sh
#
# Verifies the DeltaVision standalone package integrity
#

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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

# Check Node.js binary
check_node() {
  NODE_BIN="${PACKAGE_DIR}/node/node"
  
  if [ ! -f "$NODE_BIN" ]; then
    error "Node.js binary not found: $NODE_BIN"
    echo "  - The package may be incomplete or corrupted"
    echo "  - Try extracting the package again"
    return 1
  fi
  
  if [ ! -x "$NODE_BIN" ]; then
    error "Node.js binary is not executable: $NODE_BIN"
    echo "  - Fix with: chmod +x $NODE_BIN"
    return 1
  fi
  
  # Test Node.js binary
  NODE_VERSION=$("$NODE_BIN" --version 2>/dev/null)
  if [ $? -ne 0 ]; then
    error "Node.js binary is not working properly"
    echo "  - Try running with: $NODE_BIN --version"
    echo "  - The binary may be incompatible with your system"
    return 1
  fi
  
  success "Node.js binary is valid: $NODE_VERSION"
  return 0
}

# Check application files
check_app_files() {
  REQUIRED_FILES=(
    "app/package.json"
    "app/src/server/index.js"
    "app/public/index.html"
    "start-deltavision.sh"
    "keywords.txt"
  )
  
  MISSING=0
  for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "${PACKAGE_DIR}/$file" ]; then
      error "Required file missing: $file"
      echo "  - The package may be incomplete or corrupted"
      MISSING=$((MISSING+1))
    else
      success "Required file exists: $file"
    fi
  done
  
  if [ $MISSING -gt 0 ]; then
    error "$MISSING required files are missing"
    echo "  - The package may not function correctly"
    return 1
  fi
  
  return 0
}

# Check node_modules
check_dependencies() {
  if [ ! -d "${PACKAGE_DIR}/app/node_modules" ]; then
    error "Dependencies are missing: app/node_modules"
    echo "  - The application may not function correctly"
    echo "  - Try running 'npm install' in the app directory"
    return 1
  fi
  
  # Check for essential dependencies
  ESSENTIAL_DEPS=("express" "react" "react-dom" "diff" "chokidar")
  MISSING=0
  
  for dep in "${ESSENTIAL_DEPS[@]}"; do
    if [ ! -d "${PACKAGE_DIR}/app/node_modules/$dep" ]; then
      error "Essential dependency missing: $dep"
      echo "  - The application may not function correctly"
      MISSING=$((MISSING+1))
    else
      success "Essential dependency exists: $dep"
    fi
  done
  
  if [ $MISSING -gt 0 ]; then
    error "$MISSING essential dependencies are missing"
    echo "  - The application may not function correctly"
    return 1
  fi
  
  success "All essential dependencies are present"
  return 0
}

# Run all checks
info "Verifying DeltaVision standalone package..."
echo "  - Package directory: $PACKAGE_DIR"
echo ""

FAILED=0

info "Checking Node.js binary..."
check_node || FAILED=$((FAILED+1))
echo ""

info "Checking application files..."
check_app_files || FAILED=$((FAILED+1))
echo ""

info "Checking dependencies..."
check_dependencies || FAILED=$((FAILED+1))
echo ""

# Print summary
if [ $FAILED -eq 0 ]; then
  success "All verification checks passed!"
  echo "  - The package is ready to use"
  echo "  - Run ./start-deltavision.sh <old_folder> <new_folder> to start DeltaVision"
  echo ""
  success "----------------------------------------"
  success "Package successfully verified"
  echo ""
  echo "To install on a highly-restricted system:"
  echo "1. Transfer the ${PACKAGE_NAME}.zip file to the target system"
  echo "2. Extract: unzip ${PACKAGE_NAME}.zip"
  echo "3. CD into the directory: cd ${PACKAGE_NAME}"
  echo "4. Verify the package: ./scripts/verify-standalone.sh"
  echo "5. Start DeltaVision: ./start-deltavision.sh /path/to/old/folder /path/to/new/folder"
  echo "6. Access in browser: http://localhost:3000"
  echo ""
  info "For help and documentation:"
  echo "- Read STANDALONE-README.md"
  echo "- Run the help script: ./scripts/help.sh"
  echo "----------------------------------------"
else
  error "$FAILED verification checks failed"
  echo "  - The package may not function correctly"
  echo "  - Check the errors above for details"
  echo "  - You may need to extract the package again or reinstall dependencies"
fi

exit $FAILED
EOF

chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-standalone.sh"
success "Verification script created"

# Copy help script
info "Creating help script..."
cat > "${TEMP_DIR}/${PACKAGE_NAME}/scripts/help.sh" << 'EOF'
#!/usr/bin/env bash
#
# help.sh
#
# Displays help information for DeltaVision standalone scripts
#

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

# Display DeltaVision header
echo -e "
  ${CYAN}_____        _  _        __      ___      _             
 |  __ \\      | || |       \\ \\    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \\ \\  / / _ ___ _  ___  _ __   
 | |  | |/ _ \\| || __/ _' |  \\ \\/ / | / __| |/ _ \\| '_ \\  
 | |__| |  __/| || || (_| |   \\  /  | \\__ \\ | (_) | | | | 
 |_____/ \\___|\\__|\\__\\__,_|    \\/   |_|___/_|\\___/|_| |_| ${NC}
"
echo -e "===== DeltaVision Standalone Helper ====="
echo ""

# Check if a specific script was requested
if [ $# -ge 1 ]; then
  SCRIPT_NAME="$1"
  
  case "$SCRIPT_NAME" in
    "start-deltavision.sh")
      echo -e "${YELLOW}start-deltavision.sh${NC}"
      echo -e "Description:"
      echo -e "  Starts DeltaVision using the bundled Node.js binary."
      echo -e ""
      echo -e "Usage:"
      echo -e "  ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]"
      echo -e ""
      echo -e "Examples:"
      echo -e "# Start DeltaVision with required parameters:"
      echo -e "./start-deltavision.sh /path/to/old/files /path/to/new/files"
      echo -e ""
      echo -e "# Start DeltaVision with custom keywords file:"
      echo -e "./start-deltavision.sh /path/to/old/files /path/to/new/files /path/to/custom-keywords.txt"
      ;;
    "verify-standalone.sh")
      echo -e "${YELLOW}verify-standalone.sh${NC}"
      echo -e "Description:"
      echo -e "  Verifies the integrity of the DeltaVision standalone package."
      echo -e ""
      echo -e "Usage:"
      echo -e "  ./scripts/verify-standalone.sh"
      echo -e ""
      echo -e "Examples:"
      echo -e "# Verify package integrity:"
      echo -e "./scripts/verify-standalone.sh"
      ;;
    "help.sh")
      echo -e "${YELLOW}help.sh${NC}"
      echo -e "Description:"
      echo -e "  Displays help information for DeltaVision standalone scripts."
      echo -e ""
      echo -e "Usage:"
      echo -e "  ./scripts/help.sh [script_name]"
      echo -e ""
      echo -e "Examples:"
      echo -e "# Show list of all scripts:"
      echo -e "./scripts/help.sh"
      echo -e ""
      echo -e "# Show help for a specific script:"
      echo -e "./scripts/help.sh start-deltavision.sh"
      ;;
    *)
      echo -e "${RED}Unknown script: $SCRIPT_NAME${NC}"
      echo -e "Available scripts:"
      echo -e "  start-deltavision.sh"
      echo -e "  scripts/verify-standalone.sh"
      echo -e "  scripts/help.sh"
      ;;
  esac
  
  exit 0
fi

# List all available scripts
echo -e "Available Scripts:"
echo -e ""
echo -e "${YELLOW}Main Scripts:${NC}"
echo -e "  start-deltavision.sh - Start DeltaVision using the bundled Node.js binary"
echo -e ""
echo -e "${YELLOW}Helper Scripts:${NC}"
echo -e "  scripts/verify-standalone.sh - Verify the integrity of the package"
echo -e "  scripts/help.sh - Display this help information"
echo -e ""
echo -e "${YELLOW}Common Workflow:${NC}"
echo -e ""
echo -e "1. Verify the package integrity:"
echo -e "   ./scripts/verify-standalone.sh"
echo -e ""
echo -e "2. Start DeltaVision:"
echo -e "   ./start-deltavision.sh /path/to/old/folder /path/to/new/folder"
echo -e ""
echo -e "For detailed information about a script, run:"
echo -e "./scripts/help.sh <script_name>"
echo -e ""
echo -e "For full documentation, see:"
echo -e "  - STANDALONE-README.md   - Main documentation"
echo -e "  - docs/                  - Additional documentation"

exit 0
EOF

chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/help.sh"
success "Help script created"

# Create default keywords.txt if it doesn't exist
if [ ! -f "${SCRIPT_DIR}/../keywords.txt" ]; then
  info "Creating default keywords.txt..."
  cat > "${TEMP_DIR}/${PACKAGE_NAME}/keywords.txt" << 'EOF'
TODO
FIXME
BUG
ERROR
WARNING
EOF
  success "Default keywords.txt created"
else
  info "Copying existing keywords.txt..."
  cp "${SCRIPT_DIR}/../keywords.txt" "${TEMP_DIR}/${PACKAGE_NAME}/keywords.txt"
  success "Existing keywords.txt copied"
fi

# Verify the package
info "Verifying package integrity..."
FAILED=0

# Check core files
verify_file "start-deltavision.sh"
verify_file "node/node"
verify_file "app/package.json"
verify_file "app/src/server/index.js"
verify_file "app/public/index.html"
verify_file "STANDALONE-README.md"
verify_file "keywords.txt"
verify_file "scripts/verify-standalone.sh"
verify_file "scripts/help.sh"

# Check if app/node_modules exists
if [ -d "${TEMP_DIR}/${PACKAGE_NAME}/app/node_modules" ]; then
  success "Verified: app/node_modules directory"
else
  error "Missing required directory: app/node_modules"
  echo "  - This is essential for DeltaVision to operate"
  echo "  - Dependency installation may have failed"
  FAILED=$((FAILED+1))
fi

# Check permissions
if [ ! -x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision.sh" ]; then
  error "start-deltavision.sh is not executable"
  echo "  - Fixing permissions..."
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-deltavision.sh"
fi

if [ ! -x "${TEMP_DIR}/${PACKAGE_NAME}/node/node" ]; then
  error "node/node is not executable"
  echo "  - Fixing permissions..."
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/node/node"
fi

if [ ! -x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-standalone.sh" ]; then
  error "scripts/verify-standalone.sh is not executable"
  echo "  - Fixing permissions..."
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/verify-standalone.sh"
fi

if [ ! -x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/help.sh" ]; then
  error "scripts/help.sh is not executable"
  echo "  - Fixing permissions..."
  chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/help.sh"
fi

# Summary and ZIP creation
if [ $FAILED -gt 0 ]; then
  error "Package verification failed with $FAILED errors."
  echo "  - The package may not function correctly"
  echo "  - Check the errors above and ensure all required files exist"
  
  read -p "Continue creating the package despite issues? (y/n): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    error "Package creation aborted."
    echo "  - Fix the issues and try again"
    exit 1
  fi
  
  warning "Continuing with package creation despite issues..."
else
  success "Package verification successful!"
fi

# Create the ZIP file
info "Creating ZIP archive file..."
cd "${TEMP_DIR}"
zip -r "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" "${PACKAGE_NAME}"

if [ $? -eq 0 ]; then
  success "Created standalone package: ${SCRIPT_DIR}/${PACKAGE_NAME}.zip"
  echo "  - Size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
  echo ""
  success "DeltaVision standalone package created successfully!"
  echo "  - Package is ready for deployment in highly-restricted environments"
  echo "  - Transfer the package to the target system and extract it"
  echo "  - Run ./scripts/verify-standalone.sh to verify package integrity"
  echo "  - Run ./start-deltavision.sh <old_folder> <new_folder> to start DeltaVision"
  echo ""
  success "----------------------------------------"
  success "Package successfully created: ${SCRIPT_DIR}/${PACKAGE_NAME}.zip"
  info "Package size: $(du -h "${SCRIPT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)"
  echo ""
  echo "To install on a highly-restricted system:"
  echo "1. Transfer the ${PACKAGE_NAME}.zip file to the target system"
  echo "2. Extract: unzip ${PACKAGE_NAME}.zip"
  echo "3. CD into the directory: cd ${PACKAGE_NAME}"
  echo "4. Verify the package: ./scripts/verify-standalone.sh"
  echo "5. Start DeltaVision: ./start-deltavision.sh /path/to/old/folder /path/to/new/folder"
  echo "6. Access in browser: http://localhost:3000"
  echo ""
  info "For help and documentation:"
  echo "- Read STANDALONE-README.md"
  echo "- Run the help script: ./scripts/help.sh"
  echo "----------------------------------------"
else
  error "Failed to create ZIP archive"
  echo "  - Check disk space and permissions"
  exit 1
fi

# Clean up temporary files
info "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

exit 0
