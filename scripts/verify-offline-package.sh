#!/usr/bin/env bash

# verify-offline-package.sh
# Verifies that all components needed for offline operation are present and configured correctly
# Run this script from the root of the extracted package directory

set -e  # Exit immediately if a command exits with a non-zero status

# Current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${PARENT_DIR}"

# Enable debug output if DEBUG environment variable is set
if [ "${DEBUG}" = "true" ]; then
  set -x
fi

# ASCII art banner
cat << "EOF"
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 

===== DeltaVision Offline Package Verifier =====
EOF

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# More descriptive status indicators
STATUS="${GREEN}✓${NC}"
WARNING="${YELLOW}⚠${NC}"
ERROR="${RED}✗${NC}"
INFO="${BLUE}ℹ${NC}"

# Helper functions for more detailed reporting
print_status() {
  printf "  ${STATUS} %-60s\n" "$1"
}

print_warning() {
  printf "  ${WARNING} %-60s\n" "$1"
}

print_error() {
  printf "  ${ERROR} %-60s\n" "$1"
}

print_info() {
  printf "  ${INFO} %-60s\n" "$1"
}

print_detail() {
  printf "    - %s\n" "$1"
}

print_suggestion() {
  printf "    ► %s\n" "$1"
}

print_command() {
  printf "    $ %s\n" "$1"
}

print_section() {
  echo
  echo "==== $1 ===="
}

# Function to check file existence with better error messages
check_file() {
  if [ -f "$1" ]; then
    print_status "File exists: $1"
    PASSED=$((PASSED+1))
  else
    print_error "Missing file: $1"
    print_detail "This file is essential for DeltaVision to operate."
    
    case "$(basename "$1")" in
      "start-deltavision-offline.sh")
        print_suggestion "This script is required to start DeltaVision in offline mode."
        print_suggestion "It should be located in the root directory of the extracted package."
        print_suggestion "Re-extract the package or check if file was moved/deleted."
        ;;
      "docker-compose.offline.yml")
        print_suggestion "This file is required for container orchestration."
        print_suggestion "Run './scripts/configure-offline.sh' to generate this file."
        ;;
      "folder-config.json")
        print_suggestion "This configuration file specifies the data directories."
        print_suggestion "Run './scripts/configure-offline.sh' to generate this file."
        print_suggestion "Or create it manually with the following content:"
        print_command 'echo "{\n  \"oldFolderPath\": \"/app/data/old\",\n  \"newFolderPath\": \"/app/data/new\",\n  \"keywordFilePath\": \"/app/keywords.txt\"\n}" > folder-config.json'
        ;;
      "keywords.txt")
        print_suggestion "This file specifies custom syntax highlighting rules."
        print_suggestion "You can create an empty file if it's missing:"
        print_command "touch ${PARENT_DIR}/keywords.txt"
        ;;
      "deltavision-image.tar")
        print_suggestion "The container image file is missing. This is required to run DeltaVision."
        print_suggestion "Check if you fully extracted the package."
        print_suggestion "If packaging DeltaVision yourself, ensure the image was built and saved."
        ;;
      "configure-offline.sh")
        print_suggestion "This configuration script is missing from the scripts directory."
        print_suggestion "It should be present in the 'scripts' folder."
        print_suggestion "Re-extract the package or check if file was moved/deleted."
        ;;
      *)
        print_suggestion "Check if the package was extracted completely."
        print_suggestion "Re-extract the package or create this file manually."
        ;;
    esac
    ERRORS=$((ERRORS+1))
  fi
}

# Function to check directory existence with better error messages
check_dir() {
  if [ -d "$1" ]; then
    print_status "Directory exists: $1"
    PASSED=$((PASSED+1))
  else
    print_error "Missing directory: $1"
    print_detail "This directory is required for proper organization of the package."
    print_suggestion "Create it with: mkdir -p $1"
    print_suggestion "Re-extract the package if multiple directories are missing."
    ERRORS=$((ERRORS+1))
  fi
}

# Function to check if a file has executable permissions
check_executable() {
  if [ -x "$1" ]; then
    print_status "File is executable: $1"
    PASSED=$((PASSED+1))
  else
    print_error "File is not executable: $1"
    print_detail "This script needs executable permissions to run."
    print_suggestion "Fix with: chmod +x $1"
    print_suggestion "This is required for the start and configure scripts to work."
    ERRORS=$((ERRORS+1))
  fi
}

# Function to check if a config file has all required fields
check_config() {
  file="$1"
  key="$2"
  if grep -q "\"$key\"" "$file"; then
    # Check if the value is empty
    value=$(grep "\"$key\"" "$file" | sed -E 's/.*"'"$key"'"\s*:\s*"([^"]*)".*/\1/')
    if [ -z "$value" ]; then
      print_warning "Field '$key' exists in $file but has an empty value"
      print_detail "Empty values may cause errors when running DeltaVision."
      print_suggestion "Run './scripts/configure-offline.sh' to set proper values."
      print_suggestion "Or manually edit $file to provide a value for '$key'."
      WARNINGS=$((WARNINGS+1))
    else
      print_status "Field '$key' exists with value in $file"
      PASSED=$((PASSED+1))
    fi
  else
    print_error "Missing field '$key' in $file"
    print_detail "This configuration field is required for proper operation."
    print_suggestion "Run './scripts/configure-offline.sh' to recreate the configuration file."
    print_suggestion "Or manually edit $file to add the missing field."
    ERRORS=$((ERRORS+1))
  fi
}

# Function to check if a container engine is available
check_container_engine() {
  if command -v "$1" &> /dev/null; then
    print_status "Container engine available: $1"
    print_detail "Version: $($1 --version 2>&1 | head -n 1)"
    PASSED=$((PASSED+1))
    return 0
  else
    print_error "Container engine not found: $1"
    case "$1" in
      "docker")
        print_detail "Docker is required to run DeltaVision in container mode."
        print_suggestion "Install Docker using your system's package manager:"
        print_suggestion "Ubuntu/Debian: sudo apt install docker.io"
        print_suggestion "RHEL/CentOS: sudo dnf install docker"
        print_suggestion "Or see https://docs.docker.com/engine/install/"
        ;;
      "podman")
        print_detail "Podman is required to run DeltaVision in container mode."
        print_suggestion "Install Podman using your system's package manager:"
        print_suggestion "Ubuntu/Debian: sudo apt install podman"
        print_suggestion "RHEL/CentOS: sudo dnf install podman"
        ;;
    esac
    ERRORS=$((ERRORS+1))
    return 1
  fi
}

# Function to check if an image exists
check_image() {
  engine="$1"
  image="$2"
  if $engine image inspect "$image" &> /dev/null; then
    print_status "Image exists: $image"
    print_detail "Image ID: $($engine image inspect -f '{{.Id}}' "$image" 2>/dev/null | cut -d':' -f2 | cut -c1-12)"
    PASSED=$((PASSED+1))
    return 0
  else
    # Check with localhost prefix for podman
    if [ "$engine" = "podman" ] && podman image inspect "localhost/$image" &> /dev/null; then
      print_status "Image exists: localhost/$image"
      print_detail "Image ID: $(podman image inspect -f '{{.Id}}' "localhost/$image" 2>/dev/null | cut -d':' -f2 | cut -c1-12)"
      PASSED=$((PASSED+1))
      return 0
    else
      print_warning "Image not found: $image"
      print_detail "This is expected if you haven't loaded the image yet."
      print_suggestion "Load the image from the package with:"
      print_command "$engine load -i ${PARENT_DIR}/deltavision-image.tar"
      WARNINGS=$((WARNINGS+1))
      return 1
    fi
  fi
}

print_section "STARTING VERIFICATION"
print_info "Checking environment on $(date)"
print_detail "Package directory: ${PARENT_DIR}"
print_detail "Operating system: $(uname -a)"

print_section "REQUIRED FILES"
check_file "${PARENT_DIR}/start-deltavision-offline.sh"
check_file "${PARENT_DIR}/docker-compose.offline.yml"
check_file "${PARENT_DIR}/folder-config.json"
check_file "${PARENT_DIR}/keywords.txt"
check_file "${PARENT_DIR}/deltavision-image.tar"
check_file "${SCRIPT_DIR}/configure-offline.sh"
check_file "${PARENT_DIR}/OFFLINE-README.md"
if [ -d "${PARENT_DIR}/docs" ]; then
  check_file "${PARENT_DIR}/docs/OFFLINE-CHECKLIST.md"
else
  print_warning "Documentation directory not found: ${PARENT_DIR}/docs"
  print_detail "This is not critical but contains helpful guides."
  print_suggestion "Create docs directory: mkdir -p ${PARENT_DIR}/docs"
  WARNINGS=$((WARNINGS+1))
fi

print_section "FILE PERMISSIONS"
check_executable "${PARENT_DIR}/start-deltavision-offline.sh"
check_executable "${SCRIPT_DIR}/configure-offline.sh"
check_executable "${SCRIPT_DIR}/verify-offline-package.sh"

print_section "CONFIGURATION FILES"
if [ -f "${PARENT_DIR}/folder-config.json" ]; then
  check_config "${PARENT_DIR}/folder-config.json" "oldFolderPath"
  check_config "${PARENT_DIR}/folder-config.json" "newFolderPath"
  check_config "${PARENT_DIR}/folder-config.json" "keywordFilePath"
  
  # Check if configured paths exist
  OLD_PATH=$(grep -o '"oldFolderPath": *"[^"]*"' "${PARENT_DIR}/folder-config.json" | cut -d'"' -f4)
  NEW_PATH=$(grep -o '"newFolderPath": *"[^"]*"' "${PARENT_DIR}/folder-config.json" | cut -d'"' -f4)
  
  if [ "${OLD_PATH}" = "/app/data/old" ]; then
    print_warning "oldFolderPath is set to default container path: ${OLD_PATH}"
    print_detail "This is correct for the container config, but check docker-compose.offline.yml for correct host volume mounts."
    WARNINGS=$((WARNINGS+1))
  fi
  
  if [ "${NEW_PATH}" = "/app/data/new" ]; then
    print_warning "newFolderPath is set to default container path: ${NEW_PATH}"
    print_detail "This is correct for the container config, but check docker-compose.offline.yml for correct host volume mounts."
    WARNINGS=$((WARNINGS+1))
  fi
else
  print_error "Cannot check folder-config.json configuration (file missing)"
  ERRORS=$((ERRORS+1))
fi

# Check if docker-compose.offline.yml has the required volume mounts
print_section "DOCKER COMPOSE CONFIGURATION"
if [ -f "${PARENT_DIR}/docker-compose.offline.yml" ]; then
  if grep -q "/app/data/old" "${PARENT_DIR}/docker-compose.offline.yml"; then
    print_status "Found old folder mount in docker-compose.offline.yml"
    
    # Check if the path is still the default or has been customized
    if grep -q "/path/to/your/old/folder:/app/data/old" "${PARENT_DIR}/docker-compose.offline.yml"; then
      print_warning "Old folder mount is still using default path"
      print_detail "You need to customize the source path for your old folder."
      print_suggestion "Run './scripts/configure-offline.sh' to set the correct paths."
      WARNINGS=$((WARNINGS+1))
    else
      # Extract the actual path configured and check if it exists
      HOST_PATH=$(grep -A1 "old folder" "${PARENT_DIR}/docker-compose.offline.yml" | tail -1 | awk -F- '{print $2}' | tr -d ' ' | cut -d':' -f1)
      if [ ! -d "$HOST_PATH" ] && [ "$HOST_PATH" != "" ]; then
        print_warning "Configured old folder directory does not exist: $HOST_PATH"
        print_suggestion "Create the directory: mkdir -p $HOST_PATH"
        print_suggestion "Or run './scripts/configure-offline.sh' to update the path."
        WARNINGS=$((WARNINGS+1))
      else
        print_status "Old folder path exists and is correctly configured"
        PASSED=$((PASSED+1))
      fi
    fi
  else
    print_error "Missing old folder mount in docker-compose.offline.yml"
    print_detail "The volume mount for '/app/data/old' is required."
    print_suggestion "Run './scripts/configure-offline.sh' to recreate the configuration."
    ERRORS=$((ERRORS+1))
  fi

  if grep -q "/app/data/new" "${PARENT_DIR}/docker-compose.offline.yml"; then
    print_status "Found new folder mount in docker-compose.offline.yml"
    
    # Check if the path is still the default or has been customized
    if grep -q "/path/to/your/new/folder:/app/data/new" "${PARENT_DIR}/docker-compose.offline.yml"; then
      print_warning "New folder mount is still using default path"
      print_detail "You need to customize the source path for your new folder."
      print_suggestion "Run './scripts/configure-offline.sh' to set the correct paths."
      WARNINGS=$((WARNINGS+1))
    else
      # Extract the actual path configured and check if it exists
      HOST_PATH=$(grep -A1 "new folder" "${PARENT_DIR}/docker-compose.offline.yml" | tail -1 | awk -F- '{print $2}' | tr -d ' ' | cut -d':' -f1)
      if [ ! -d "$HOST_PATH" ] && [ "$HOST_PATH" != "" ]; then
        print_warning "Configured new folder directory does not exist: $HOST_PATH"
        print_suggestion "Create the directory: mkdir -p $HOST_PATH"
        print_suggestion "Or run './scripts/configure-offline.sh' to update the path."
        WARNINGS=$((WARNINGS+1))
      else
        print_status "New folder path exists and is correctly configured"
        PASSED=$((PASSED+1))
      fi
    fi
  else
    print_error "Missing new folder mount in docker-compose.offline.yml"
    print_detail "The volume mount for '/app/data/new' is required."
    print_suggestion "Run './scripts/configure-offline.sh' to recreate the configuration."
    ERRORS=$((ERRORS+1))
  fi
else
  print_error "Cannot check docker-compose.offline.yml configuration (file missing)"
  ERRORS=$((ERRORS+1))
fi

print_section "CONTAINER ENVIRONMENT"
# Detect which container engine is available (podman or docker)
CONTAINER_ENGINE=""
if check_container_engine "podman"; then
  CONTAINER_ENGINE="podman"
  
  # Additional podman-specific checks
  print_info "Running additional Podman checks"
  # Check for rootless vs root mode
  if podman info 2>/dev/null | grep -q "rootless: true"; then
    print_status "Podman is running in rootless mode"
    print_detail "This is the recommended configuration for security."
  else
    print_warning "Podman is running in root mode"
    print_detail "Running as root is less secure but may have fewer permission issues."
    WARNINGS=$((WARNINGS+1))
  fi
  
  # Check for SELinux
  if command -v getenforce &>/dev/null && [ "$(getenforce 2>/dev/null)" = "Enforcing" ]; then
    print_warning "SELinux is in enforcing mode, may affect container volume mounts"
    print_detail "You might need to use :Z/:z volume mount options or set proper context."
    print_suggestion "If you encounter permission issues, try adding :Z to volume mounts."
    print_suggestion "Or temporarily set SELinux to permissive: sudo setenforce 0"
    WARNINGS=$((WARNINGS+1))
  fi
  
elif check_container_engine "docker"; then
  CONTAINER_ENGINE="docker"
  
  # Additional docker-specific checks
  print_info "Running additional Docker checks"
  # Check if user is in docker group
  if groups | grep -q "\\bdocker\\b"; then
    print_status "Current user is in the docker group"
    print_detail "You can run Docker commands without sudo."
  else
    print_warning "Current user is not in the docker group"
    print_detail "You might need to use sudo to run Docker commands."
    print_suggestion "Add your user to the docker group:"
    print_command "sudo usermod -aG docker $USER && newgrp docker"
    WARNINGS=$((WARNINGS+1))
  fi
  
  # Check Docker daemon status
  if systemctl is-active docker &>/dev/null; then
    print_status "Docker daemon is active"
  else
    print_warning "Docker daemon may not be running"
    print_suggestion "Start the Docker daemon:"
    print_command "sudo systemctl start docker"
    WARNINGS=$((WARNINGS+1))
  fi
else
  print_error "No container engine detected. Either Docker or Podman is required."
  print_suggestion "Install Docker:"
  print_command "sudo apt install docker.io  # For Ubuntu/Debian"
  print_command "sudo dnf install docker     # For RHEL/CentOS"
  print_suggestion "Or install Podman:"
  print_command "sudo apt install podman     # For Ubuntu/Debian"
  print_command "sudo dnf install podman     # For RHEL/CentOS"
  ERRORS=$((ERRORS+1))
fi

# Check for compose functionality if a container engine was found
if [ -n "$CONTAINER_ENGINE" ]; then
  print_section "COMPOSE FUNCTIONALITY"
  COMPOSE_AVAILABLE=false
  
  if [ "$CONTAINER_ENGINE" = "podman" ]; then
    if command -v podman-compose &> /dev/null; then
      print_status "podman-compose is available"
      print_detail "Version: $(podman-compose --version 2>&1 | head -n 1)"
      PASSED=$((PASSED+1))
      COMPOSE_AVAILABLE=true
    elif podman compose version &> /dev/null; then
      print_status "podman compose subcommand is available"
      print_detail "Version: $(podman compose version 2>&1 | head -n 1)"
      PASSED=$((PASSED+1))
      COMPOSE_AVAILABLE=true
      
      # Check if -f flag is supported (important for our scripts)
      if podman compose -f /dev/null --help &> /dev/null; then
        print_status "podman compose supports -f flag"
      else
        print_warning "podman compose doesn't support -f flag"
        print_detail "Will use directory-based approach in the start script."
        print_suggestion "This is handled automatically by start-deltavision-offline.sh."
        WARNINGS=$((WARNINGS+1))
      fi
    else
      print_warning "No Podman Compose functionality detected"
      print_detail "This is acceptable, will use direct podman commands."
      print_detail "The start script handles this automatically."
      print_suggestion "For better experience, consider installing podman-compose:"
      print_command "pip install podman-compose"
      WARNINGS=$((WARNINGS+1))
    fi
  elif [ "$CONTAINER_ENGINE" = "docker" ]; then
    if command -v docker-compose &> /dev/null; then
      print_status "docker-compose is available"
      print_detail "Version: $(docker-compose --version 2>&1 | head -n 1)"
      PASSED=$((PASSED+1))
      COMPOSE_AVAILABLE=true
    else
      print_warning "docker-compose not found"
      print_detail "The start script will fall back to direct container commands."
      print_suggestion "For better experience, install docker-compose:"
      print_command "sudo apt install docker-compose  # For Ubuntu/Debian"
      print_command "sudo dnf install docker-compose  # For RHEL/CentOS"
      WARNINGS=$((WARNINGS+1))
    fi
  fi
  
  # Check for container image
  print_section "CONTAINER IMAGE"
  check_image "$CONTAINER_ENGINE" "deltavision:1.0.0"
  
  # Check port availability (default is 3000)
  print_section "NETWORK CONFIGURATION"
  PORT=3000
  if [ -f "${PARENT_DIR}/docker-compose.offline.yml" ]; then
    CONFIGURED_PORT=$(grep -oP '"\\K[0-9]+(?=:3000")' "${PARENT_DIR}/docker-compose.offline.yml" || echo "3000")
    if [ -n "$CONFIGURED_PORT" ]; then
      PORT=$CONFIGURED_PORT
    fi
  fi
  
  # Check if the port is already in use
  if command -v netstat &>/dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
      print_warning "Port $PORT is already in use"
      print_detail "This will prevent DeltaVision from starting correctly."
      print_suggestion "Reconfigure to use a different port:"
      print_command "./scripts/configure-offline.sh  # Choose a different port when prompted"
      WARNINGS=$((WARNINGS+1))
    else
      print_status "Port $PORT is available"
      PASSED=$((PASSED+1))
    fi
  else
    print_warning "Cannot check port availability (netstat not found)"
    print_detail "Make sure port $PORT is not in use by another application."
    WARNINGS=$((WARNINGS+1))
  fi
fi

# Final results
print_section "VERIFICATION SUMMARY"
printf "${GREEN}Tests passed:${NC} %d\n" $PASSED
printf "${YELLOW}Warnings:${NC} %d\n" $WARNINGS
printf "${RED}Errors:${NC} %d\n" $ERRORS
echo

if [ $ERRORS -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    printf "${GREEN}All checks passed! Your DeltaVision offline package is ready to use.${NC}\n"
    print_info "Next steps:"
    print_detail "1. If you haven't done so, configure your environment:"
    print_command "./scripts/configure-offline.sh"
    echo
    print_detail "2. Start DeltaVision:"
    print_command "./start-deltavision-offline.sh"
    
    # Add suggestion to run with DEBUG if needed
    print_info "If you encounter any issues during startup, run with debug mode:"
    print_command "DEBUG=true ./start-deltavision-offline.sh"
  else
    printf "${YELLOW}Package verification completed with warnings.${NC}\n"
    print_info "You can still proceed, but you may encounter some issues:"
    print_detail "1. Address the warnings listed above"
    print_detail "2. Run configuration to fix warnings:"
    print_command "./scripts/configure-offline.sh"
    echo
    print_detail "3. Start DeltaVision:"
    print_command "./start-deltavision-offline.sh"
    echo
    print_info "For detailed troubleshooting guidance, see:"
    print_command "less ./OFFLINE-README.md"
  fi
else
  printf "${RED}Verification failed with %d errors.${NC}\n" $ERRORS
  print_info "Critical issues detected. Please address them before proceeding:"
  print_detail "1. Fix the errors highlighted above"
  print_detail "2. Run the configuration script to fix configuration issues:"
  print_command "./scripts/configure-offline.sh"
  print_detail "3. Make sure the container image is loaded:"
  print_command "$CONTAINER_ENGINE load -i ./deltavision-image.tar"
  print_detail "4. Run this verification script again to confirm issues are resolved:"
  print_command "./scripts/verify-offline-package.sh"
  echo
  print_info "For detailed troubleshooting guidance, see:"
  print_command "less ./OFFLINE-README.md"
fi

exit $ERRORS
