#!/usr/bin/env bash
#
# prepare-precompiled-binaries.sh
#
# Downloads and prepares precompiled Node.js binaries for various platforms
# These binaries are used by the standalone packaging script
#
# Usage: ./prepare-precompiled-binaries.sh [node_version]
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

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRECOMPILED_DIR="${SCRIPT_DIR}/../precompiled"

# Default Node.js version
NODE_VERSION=${1:-"18.17.1"}

# Supported platforms
PLATFORMS=(
  "linux-x64"
  "linux-arm64"
  "darwin-x64"
  "darwin-arm64"
  "win-x64"
)

# Check for required commands
if ! check_command curl && ! check_command wget; then
  error "Neither curl nor wget is available. Cannot download Node.js."
  echo "  - Please install curl or wget"
  exit 1
fi

info "Preparing Node.js v${NODE_VERSION} binaries for multiple platforms..."
echo "  - Precompiled directory: ${PRECOMPILED_DIR}"

# Create temporary directory for downloads
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Create README file for the precompiled directory
cat > "${PRECOMPILED_DIR}/README.md" << 'EOF'
# Precompiled Node.js Binaries

This directory contains precompiled Node.js binaries for various platforms.
These binaries are used by the standalone packaging script to create self-contained 
DeltaVision packages that require no installation.

## Available Platforms

- `linux-x64`: Linux 64-bit (most desktop/server Linux distributions)
- `linux-arm64`: Linux ARM 64-bit (Raspberry Pi 4, AWS Graviton, etc.)
- `darwin-x64`: macOS Intel 64-bit
- `darwin-arm64`: macOS Apple Silicon (M1/M2/M3)
- `win-x64`: Windows 64-bit

## Adding New Platforms

To add support for additional platforms:

1. Create a new directory for the platform
2. Download the appropriate Node.js binary
3. Extract the binary and place it in the platform directory
4. Make sure the binary is executable

## Updating Node.js Version

To update the Node.js version for all platforms:

```bash
./scripts/prepare-precompiled-binaries.sh [new_version]
```

For example:

```bash
./scripts/prepare-precompiled-binaries.sh 20.0.0
```

## Manual Preparation

If you need to manually prepare a binary:

1. Download the appropriate Node.js binary from https://nodejs.org/dist/
2. Extract the binary
3. Copy the `node` executable to the appropriate platform directory
4. Make the binary executable: `chmod +x node`
EOF

success "Created README.md in precompiled directory"

# Function to download and prepare a Node.js binary for a specific platform
prepare_platform() {
  local platform=$1
  local node_version=$2
  local filename_suffix=""
  
  info "Processing platform: ${platform}"
  
  # Different platforms have different archive formats
  if [[ "${platform}" == "win-x64" ]]; then
    filename_suffix="zip"
    binary_name="node.exe"
  else
    filename_suffix="tar.gz"
    binary_name="node"
  fi
  
  # Construct the download URL
  local download_url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-${platform}.${filename_suffix}"
  local output_file="${TEMP_DIR}/node-${platform}.${filename_suffix}"
  
  # Download the binary
  echo "  - Downloading from: ${download_url}"
  if check_command curl; then
    if ! curl -L "${download_url}" -o "${output_file}" --silent; then
      warning "Failed to download Node.js for ${platform}"
      return 1
    fi
  elif check_command wget; then
    if ! wget -q "${download_url}" -O "${output_file}"; then
      warning "Failed to download Node.js for ${platform}"
      return 1
    fi
  fi
  
  # Create extraction directory
  local extract_dir="${TEMP_DIR}/extract-${platform}"
  mkdir -p "${extract_dir}"
  
  # Extract the archive
  echo "  - Extracting archive..."
  if [[ "${platform}" == "win-x64" ]]; then
    # For Windows, use unzip
    if ! check_command unzip; then
      warning "unzip command not found, cannot extract Windows binary"
      return 1
    fi
    
    unzip -q "${output_file}" -d "${extract_dir}" || {
      warning "Failed to extract Windows binary"
      return 1
    }
    
    # Find the node.exe in the extracted files
    node_path=$(find "${extract_dir}" -name "${binary_name}" -type f | head -n 1)
  else
    # For Unix platforms, use tar
    tar -xzf "${output_file}" -C "${extract_dir}" || {
      warning "Failed to extract archive for ${platform}"
      return 1
    }
    
    # Find the node binary in the extracted files
    node_path=$(find "${extract_dir}" -name "${binary_name}" -type f | head -n 1)
  fi
  
  if [ -z "${node_path}" ]; then
    warning "Could not find ${binary_name} in the extracted files for ${platform}"
    return 1
  fi
  
  # Copy the binary to the precompiled directory
  mkdir -p "${PRECOMPILED_DIR}/node/${platform}"
  cp "${node_path}" "${PRECOMPILED_DIR}/node/${platform}/${binary_name}"
  
  # Make the binary executable (except for Windows)
  if [[ "${platform}" != "win-x64" ]]; then
    chmod +x "${PRECOMPILED_DIR}/node/${platform}/${binary_name}"
  fi
  
  # Verify the binary works (for the current platform only)
  if [[ "${platform}" == "linux-x64" && "$(uname)" == "Linux" && "$(uname -m)" == "x86_64" ]] || \
     [[ "${platform}" == "linux-arm64" && "$(uname)" == "Linux" && ("$(uname -m)" == "aarch64" || "$(uname -m)" == "arm64") ]] || \
     [[ "${platform}" == "darwin-x64" && "$(uname)" == "Darwin" && "$(uname -m)" == "x86_64" ]] || \
     [[ "${platform}" == "darwin-arm64" && "$(uname)" == "Darwin" && ("$(uname -m)" == "arm64" || "$(uname -m)" == "aarch64") ]]; then
     
    echo "  - Verifying binary for current platform..."
    if "${PRECOMPILED_DIR}/node/${platform}/${binary_name}" --version > /dev/null; then
      echo "  - Binary verified: $("${PRECOMPILED_DIR}/node/${platform}/${binary_name}" --version)"
    else
      warning "Binary verification failed for ${platform}"
      return 1
    fi
  else
    echo "  - Skipping verification (not running on ${platform})"
  fi
  
  success "Successfully prepared Node.js v${node_version} for ${platform}"
  return 0
}

# Process each platform
failed_platforms=()
for platform in "${PLATFORMS[@]}"; do
  if prepare_platform "${platform}" "${NODE_VERSION}"; then
    echo ""
  else
    failed_platforms+=("${platform}")
    echo ""
  fi
done

# Summary
echo ""
info "Precompiled binaries preparation summary:"
echo "  - Node.js version: ${NODE_VERSION}"
echo "  - Total platforms: ${#PLATFORMS[@]}"
echo "  - Successful: $((${#PLATFORMS[@]} - ${#failed_platforms[@]}))"
echo "  - Failed: ${#failed_platforms[@]}"

if [ ${#failed_platforms[@]} -gt 0 ]; then
  echo ""
  warning "Failed to prepare binaries for the following platforms:"
  for platform in "${failed_platforms[@]}"; do
    echo "  - ${platform}"
  done
  echo ""
  warning "You can add these platforms manually. See ${PRECOMPILED_DIR}/README.md for instructions."
else
  echo ""
  success "All platform binaries were prepared successfully!"
fi

# Check if the current platform has a binary
current_platform=""
if [[ "$(uname)" == "Linux" && "$(uname -m)" == "x86_64" ]]; then
  current_platform="linux-x64"
elif [[ "$(uname)" == "Linux" && ("$(uname -m)" == "aarch64" || "$(uname -m)" == "arm64") ]]; then
  current_platform="linux-arm64"
elif [[ "$(uname)" == "Darwin" && "$(uname -m)" == "x86_64" ]]; then
  current_platform="darwin-x64"
elif [[ "$(uname)" == "Darwin" && ("$(uname -m)" == "arm64" || "$(uname -m)" == "aarch64") ]]; then
  current_platform="darwin-arm64"
fi

if [ -n "${current_platform}" ] && [ -f "${PRECOMPILED_DIR}/node/${current_platform}/node" ]; then
  success "Binary for current platform (${current_platform}) is ready for use"
else
  warning "Could not prepare binary for current platform"
  echo "  - The standalone packaging script may need to download a binary"
fi

echo ""
info "Precompiled binaries are available in: ${PRECOMPILED_DIR}/node/"
info "Run ./scripts/package-standalone.sh to create a standalone package using these binaries"
