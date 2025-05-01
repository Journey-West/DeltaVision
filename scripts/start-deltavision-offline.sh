#!/usr/bin/env bash

# start-deltavision-offline.sh
# Starts the DeltaVision container in offline/air-gapped environments
# This script is designed to work with both Docker and Podman

# Initialize diagnostic logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/scripts/diagnostic-logger.sh" ]; then
    source "${SCRIPT_DIR}/scripts/diagnostic-logger.sh"
    log_system "Starting DeltaVision offline deployment"
    log_environment
else
    # Define basic logging functions if the diagnostic logger isn't available
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color

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
fi

# Set debug mode from environment variable
DEBUG=${DEBUG:-false}

# Run pre-flight checks if available
if [ -f "${SCRIPT_DIR}/scripts/preflight-check.sh" ]; then
    info "Running pre-flight checks..."
    if ! "${SCRIPT_DIR}/scripts/preflight-check.sh"; then
        warning "Pre-flight checks failed. Proceeding anyway, but DeltaVision may not function correctly."
        read -p "Continue despite failed checks? (y/n): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            error "Startup aborted by user."
            exit 1
        fi
    else
        success "Pre-flight checks passed!"
    fi
fi

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "Required command not found: $1"
        echo "  - This command is necessary for DeltaVision to operate."
        return 1
    fi
    return 0
}

# Logo and header
cat << "EOF"
  _____        _  _        __      ___      _             
 |  __ \      | || |       \ \    / (_)    (_)            
 | |  | | ___ | || |_ __ _  \ \  / / _ ___ _  ___  _ __   
 | |  | |/ _ \| || __/ _' |  \ \/ / | / __| |/ _ \| '_ \  
 | |__| |  __/| || || (_| |   \  /  | \__ \ | (_) | | | | 
 |_____/ \___||_| \__\__,_|    \/   |_|___/_|\___/|_| |_| 

===== DeltaVision Offline Startup =====
EOF

# Print debug info
if [ "$DEBUG" = "true" ]; then
    info "Debug mode enabled - will print verbose information"
    info "Current directory: $(pwd)"
    info "Script directory: $SCRIPT_DIR"
fi

# Function to check if a file exists and is readable
check_file() {
    if [ ! -f "$1" ]; then
        error "Required file not found: $1"
        echo "  - This file is essential for DeltaVision to operate."
        if [ -n "$2" ]; then
            echo "  - $2"
        fi
        return 1
    elif [ ! -r "$1" ]; then
        error "Cannot read file: $1"
        echo "  - Check file permissions: chmod +r $1"
        return 1
    fi
    
    if [ "$DEBUG" = "true" ]; then
        info "File check passed: $1"
    fi
    
    return 0
}

# Detect if we're using Podman or Docker
info "Detecting container engine..."
CONTAINER_ENGINE="docker"
COMPOSE_AVAILABLE=true
COMPOSE_CMD="docker-compose"

# First check if the environment has recorded what we should be using
if [ -f "container-engine.txt" ]; then
    SAVED_ENGINE=$(cat container-engine.txt)
    if [ "$SAVED_ENGINE" = "podman" ]; then
        CONTAINER_ENGINE="podman"
        if [ "$DEBUG" = "true" ]; then
            info "Using podman based on saved configuration"
        fi
    fi
    
    if [ -f "compose-available.txt" ]; then
        SAVED_COMPOSE=$(cat compose-available.txt)
        if [ "$SAVED_COMPOSE" = "false" ]; then
            COMPOSE_AVAILABLE=false
            if [ "$DEBUG" = "true" ]; then
                info "Compose functionality not available based on saved configuration"
            fi
        fi
    fi
    
    if [ -f "compose-cmd.txt" ]; then
        SAVED_COMPOSE_CMD=$(cat compose-cmd.txt)
        if [ -n "$SAVED_COMPOSE_CMD" ]; then
            COMPOSE_CMD="$SAVED_COMPOSE_CMD"
            if [ "$DEBUG" = "true" ]; then
                info "Using compose command from saved configuration: $COMPOSE_CMD"
            fi
        fi
    fi
else
    # Detect at runtime
    if check_command podman && podman --version | grep -q "podman"; then
        CONTAINER_ENGINE="podman"
        success "Detected Podman as container engine"
        
        # Check if podman-compose is available
        if check_command podman-compose; then
            COMPOSE_CMD="podman-compose"
            success "Detected podman-compose"
        # Check if podman compose subcommand is available by actually trying to run it
        elif podman compose version &> /dev/null; then
            COMPOSE_CMD="podman compose"
            success "Detected podman compose subcommand"
        else
            COMPOSE_AVAILABLE=false
            warning "No Podman Compose functionality detected"
            echo "  - Will use direct Podman commands instead"
            echo "  - This is normal for minimal Podman installations"
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
            warning "docker-compose not found"
            echo "  - For better experience, install docker-compose:"
            echo "  - For Ubuntu/Debian: sudo apt install docker-compose"
            echo "  - Will attempt to use Docker without Compose"
            COMPOSE_AVAILABLE=false
        else
            success "Detected docker-compose"
        fi
    fi
fi

# Check if the container image is available
info "Checking for DeltaVision container image..."
if ! $CONTAINER_ENGINE image ls | grep -q "deltavision"; then
    warning "DeltaVision container image not found in local repository"
    
    # Check if we have the image file
    if [ -f "deltavision-image.tar" ]; then
        info "Found deltavision-image.tar, loading image..."
        if ! $CONTAINER_ENGINE load -i deltavision-image.tar; then
            error "Failed to load container image"
            echo "  - Check if the image file is corrupt"
            echo "  - Try extracting the offline package again"
            exit 1
        fi
        success "Container image loaded successfully"
    else
        error "DeltaVision container image not found"
        echo "  - The image file deltavision-image.tar should be in this directory"
        echo "  - Make sure you extracted the complete offline package"
        exit 1
    fi
else
    success "DeltaVision container image is available"
fi

# Check if docker-compose.offline.yml exists
if [ "$COMPOSE_AVAILABLE" = true ]; then
    info "Checking compose configuration..."
    COMPOSE_FILE="${SCRIPT_DIR}/../docker/docker-compose.offline.yml"
    if ! check_file "${COMPOSE_FILE}" "Run the configure-offline.sh script first to set up your environment"; then
        warning "Will try to use direct container commands instead"
        COMPOSE_AVAILABLE=false
    fi
fi

# Check if folder-config.json exists
if ! check_file "folder-config.json" "Run the configure-offline.sh script first to set up your folders"; then
    error "Cannot proceed without valid configuration"
    echo "  - Run: ./scripts/configure-offline.sh"
    exit 1
fi

# Check if keywords.txt exists
if ! check_file "keywords.txt" "This file defines highlighting keywords"; then
    warning "Creating an empty keywords.txt file"
    echo "# Add keywords for highlighting, one per line" > keywords.txt
    echo "# Lines starting with # are comments" >> keywords.txt
fi

# Verify configuration - check the paths in folder-config.json
info "Verifying folder configuration..."
if command -v jq &> /dev/null; then
    OLD_PATH=$(jq -r '.oldFolderPath' folder-config.json 2>/dev/null)
    NEW_PATH=$(jq -r '.newFolderPath' folder-config.json 2>/dev/null)
    
    if [ "$OLD_PATH" = "null" ] || [ -z "$OLD_PATH" ]; then
        error "Invalid configuration: oldFolderPath not set in folder-config.json"
        echo "  - Run: ./scripts/configure-offline.sh"
        exit 1
    fi
    
    if [ "$NEW_PATH" = "null" ] || [ -z "$NEW_PATH" ]; then
        error "Invalid configuration: newFolderPath not set in folder-config.json"
        echo "  - Run: ./scripts/configure-offline.sh"
        exit 1
    fi
    
    if [ ! -d "$OLD_PATH" ]; then
        error "Directory not found: $OLD_PATH (oldFolderPath)"
        echo "  - Check that this directory exists and is accessible"
        echo "  - Run: ./scripts/configure-offline.sh to update configuration"
        exit 1
    fi
    
    if [ ! -d "$NEW_PATH" ]; then
        error "Directory not found: $NEW_PATH (newFolderPath)"
        echo "  - Check that this directory exists and is accessible"
        echo "  - Run: ./scripts/configure-offline.sh to update configuration"
        exit 1
    fi
    
    success "Folder configuration valid"
else
    warning "jq not installed, skipping detailed configuration validation"
    echo "  - Install jq for better configuration validation:"
    echo "  - For Ubuntu/Debian: sudo apt install jq"
    echo "  - For RHEL/CentOS: sudo dnf install jq"
fi

# Check if port 3000 is in use
info "Checking if port 3000 is available..."
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":3000 "; then
        warning "Port 3000 is already in use"
        echo "  - DeltaVision may not start correctly"
        echo "  - Stop any other service using port 3000 or modify docker-compose.offline.yml"
    else
        success "Port 3000 is available"
    fi
elif command -v ss &> /dev/null; then
    if ss -tuln | grep -q ":3000 "; then
        warning "Port 3000 is already in use"
        echo "  - DeltaVision may not start correctly"
        echo "  - Stop any other service using port 3000 or modify docker-compose.offline.yml"
    else
        success "Port 3000 is available"
    fi
else
    warning "Cannot check if port 3000 is available (netstat/ss not found)"
fi

# Start the container using compose if available
if [ "$COMPOSE_AVAILABLE" = true ]; then
    info "Starting DeltaVision using $COMPOSE_CMD..."
    if ! $COMPOSE_CMD -f "${SCRIPT_DIR}/../docker/docker-compose.offline.yml" up -d; then
        error "Failed to start container with $COMPOSE_CMD"
        echo "  - Check the error message above"
        echo "  - Will try direct container commands instead"
        COMPOSE_AVAILABLE=false
    else
        success "DeltaVision container started successfully with $COMPOSE_CMD"
    fi
fi

# If compose failed or is not available, try direct container commands
if [ "$COMPOSE_AVAILABLE" = false ]; then
    info "Starting DeltaVision with direct container commands..."
    
    # Stop and remove any existing container
    $CONTAINER_ENGINE rm -f deltavision 2>/dev/null
    
    # Get the paths from folder-config.json if jq is available
    if command -v jq &> /dev/null; then
        OLD_PATH=$(jq -r '.oldFolderPath' folder-config.json)
        NEW_PATH=$(jq -r '.newFolderPath' folder-config.json)
        KW_PATH=$(jq -r '.keywordFilePath' folder-config.json 2>/dev/null || echo "$(pwd)/keywords.txt")
    else
        warning "jq not installed, using basic path extraction"
        OLD_PATH=$(grep -o '"oldFolderPath"[^,]*' folder-config.json | cut -d '"' -f 4)
        NEW_PATH=$(grep -o '"newFolderPath"[^,]*' folder-config.json | cut -d '"' -f 4)
        KW_PATH=$(grep -o '"keywordFilePath"[^,]*' folder-config.json | cut -d '"' -f 4 || echo "$(pwd)/keywords.txt")
    fi
    
    # Fallback if path extraction failed
    if [ -z "$OLD_PATH" ] || [ -z "$NEW_PATH" ]; then
        error "Failed to extract paths from folder-config.json"
        echo "  - Check if folder-config.json is valid JSON"
        echo "  - Run: ./scripts/configure-offline.sh"
        exit 1
    fi
    
    # Check if we need SELinux options for volume mounts
    SELINUX_OPT=""
    if command -v getenforce &> /dev/null && [ "$(getenforce 2>/dev/null)" = "Enforcing" ]; then
        SELINUX_OPT=":Z"
        warning "SELinux is enforcing, adding :Z option to volume mounts"
        echo "  - This is normal on RHEL/CentOS/Fedora systems"
    fi
    
    # Start the container with direct command
    if ! $CONTAINER_ENGINE run -d --name deltavision \
        -p 3000:3000 \
        -v "$(pwd)/folder-config.json:/app/folder-config.json${SELINUX_OPT}" \
        -v "$(pwd)/keywords.txt:/app/keywords.txt${SELINUX_OPT}" \
        -v "${OLD_PATH}:/app/data/old${SELINUX_OPT}" \
        -v "${NEW_PATH}:/app/data/new${SELINUX_OPT}" \
        -e NODE_ENV=production \
        localhost/deltavision:1.0.0; then
        
        error "Failed to start container with direct command"
        echo "  - Check if the container engine daemon is running"
        echo "  - Check if volume paths are correct and accessible"
        echo "  - Run: ${CONTAINER_ENGINE} ps -a to see if container already exists"
        echo "  - Run: ${CONTAINER_ENGINE} logs deltavision to see container error logs"
        exit 1
    else
        success "DeltaVision container started successfully with direct command"
    fi
fi

# Verify that the container is running
info "Verifying container status..."
if $CONTAINER_ENGINE ps | grep -q "deltavision"; then
    success "DeltaVision container is running"
else
    error "DeltaVision container is not running"
    echo "  - Container may have exited immediately after starting"
    echo "  - Check logs: ${CONTAINER_ENGINE} logs deltavision"
    exit 1
fi

# Print success message and access information
success "=================================================="
success "DeltaVision started successfully!"
echo
echo "Access DeltaVision in your web browser at: http://localhost:3000"
echo
echo "To stop DeltaVision:"
if [ "$COMPOSE_AVAILABLE" = true ]; then
    echo "  $COMPOSE_CMD -f ${SCRIPT_DIR}/../docker/docker-compose.offline.yml down"
else
    echo "  $CONTAINER_ENGINE stop deltavision"
    echo "  $CONTAINER_ENGINE rm deltavision"
fi
echo
echo "To see container logs:"
echo "  $CONTAINER_ENGINE logs deltavision"
echo
echo "To verify offline dependencies:"
echo "  ./scripts/verify-offline-dependencies.sh"
echo
echo "If you encounter any issues, run the verification script:"
echo "  ./scripts/preflight-check.sh"
echo
echo "For more details, see the OFFLINE-README.md file"
echo "=================================================="

# Log successful start if using diagnostics
if type log_success > /dev/null 2>&1; then
    log_success "STARTUP" "DeltaVision started successfully at $(date)"
fi
