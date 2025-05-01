#!/usr/bin/env bash
# preflight-check.sh
# Run pre-flight checks before starting DeltaVision to ensure all resources are accessible

# Source the diagnostic logger
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "${SCRIPT_DIR}/diagnostic-logger.sh"

# Set log level for preflight checks
set_log_level "info"

log_info "PREFLIGHT" "Starting DeltaVision pre-flight checks"
log_environment

# Check result counters
TOTAL_CHECKS=0
PASSED=0
FAILED=0
WARNINGS=0

# Function to check read permissions on a file
check_read_permission() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -r "$1" ]; then
    log_success "PERMISSIONS" "Read permission OK: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    log_error "PERMISSIONS" "Cannot read file: $1"
    log_debug "PERMISSIONS" "Current user: $(whoami), File owner: $(stat -c '%U' "$1" 2>/dev/null || echo 'unknown')"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check write permissions on a directory
check_write_permission() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -w "$1" ]; then
    log_success "PERMISSIONS" "Write permission OK: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    log_error "PERMISSIONS" "Cannot write to directory: $1"
    log_debug "PERMISSIONS" "Current user: $(whoami), Directory owner: $(stat -c '%U' "$1" 2>/dev/null || echo 'unknown')"
    log_debug "PERMISSIONS" "Try: sudo chown -R $(whoami) $1"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check executable permissions
check_exec_permission() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -x "$1" ]; then
    log_success "PERMISSIONS" "Execute permission OK: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    log_error "PERMISSIONS" "Cannot execute: $1"
    log_debug "PERMISSIONS" "Current user: $(whoami), File owner: $(stat -c '%U' "$1" 2>/dev/null || echo 'unknown')"
    log_debug "PERMISSIONS" "Try: chmod +x $1"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check directory exists
check_directory() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -d "$1" ]; then
    log_success "DIRECTORY" "Directory exists: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    log_error "DIRECTORY" "Directory not found: $1"
    log_debug "DIRECTORY" "Try: mkdir -p $1"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check file exists
check_file() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -f "$1" ]; then
    log_success "FILE" "File exists: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    log_error "FILE" "File not found: $1"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check port availability
check_port_available() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":$1 "; then
      log_error "NETWORK" "Port $1 is already in use"
      log_debug "NETWORK" "Process using port $1: $(lsof -i :$1 2>/dev/null | grep LISTEN || echo 'unknown')"
      FAILED=$((FAILED+1))
      return 1
    else
      log_success "NETWORK" "Port $1 is available"
      PASSED=$((PASSED+1))
      return 0
    fi
  elif command -v ss &> /dev/null; then
    if ss -tuln | grep -q ":$1 "; then
      log_error "NETWORK" "Port $1 is already in use"
      log_debug "NETWORK" "Process using port $1: $(lsof -i :$1 2>/dev/null | grep LISTEN || echo 'unknown')"
      FAILED=$((FAILED+1))
      return 1
    else
      log_success "NETWORK" "Port $1 is available"
      PASSED=$((PASSED+1))
      return 0
    fi
  else
    log_warning "NETWORK" "Cannot check if port $1 is available (netstat/ss not found)"
    WARNINGS=$((WARNINGS+1))
    return 0
  fi
}

# Function to check disk space
check_disk_space() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  # Get available disk space in KB
  local available
  available=$(df -k "$1" | awk 'NR==2 {print $4}')
  
  if [ -z "$available" ]; then
    log_error "DISK" "Unable to determine available disk space for $1"
    FAILED=$((FAILED+1))
    return 1
  fi
  
  if [ "$available" -lt "$2" ]; then
    log_error "DISK" "Insufficient disk space: $1 has $(( available / 1024 )) MB, but $(( $2 / 1024 )) MB required"
    FAILED=$((FAILED+1))
    return 1
  else
    log_success "DISK" "Sufficient disk space: $1 has $(( available / 1024 )) MB, $(( $2 / 1024 )) MB required"
    PASSED=$((PASSED+1))
    return 0
  fi
}

# Function to check memory
check_memory() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if command -v free &> /dev/null; then
    local available
    available=$(free -k | awk '/^Mem:/ {print $7}')
    
    if [ -z "$available" ]; then
      log_warning "MEMORY" "Unable to determine available memory"
      WARNINGS=$((WARNINGS+1))
      return 0
    fi
    
    if [ "$available" -lt "$1" ]; then
      log_warning "MEMORY" "Low memory: $(( available / 1024 )) MB available, $(( $1 / 1024 )) MB recommended"
      WARNINGS=$((WARNINGS+1))
      return 1
    else
      log_success "MEMORY" "Sufficient memory: $(( available / 1024 )) MB available, $(( $1 / 1024 )) MB recommended"
      PASSED=$((PASSED+1))
      return 0
    fi
  else
    log_warning "MEMORY" "Cannot check available memory (free command not found)"
    WARNINGS=$((WARNINGS+1))
    return 0
  fi
}

# Function to check container image
check_container_image() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  # Detect container engine
  CONTAINER_ENGINE="docker"
  if command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
  fi
  
  if $CONTAINER_ENGINE image ls | grep -q "$1"; then
    log_success "CONTAINER" "Image exists: $1"
    PASSED=$((PASSED+1))
    return 0
  elif [ -f "${PROJECT_ROOT}/deltavision-image.tar" ]; then
    log_warning "CONTAINER" "Container image not loaded, but image archive exists"
    log_debug "CONTAINER" "Run: $CONTAINER_ENGINE load -i ${PROJECT_ROOT}/deltavision-image.tar"
    WARNINGS=$((WARNINGS+1))
    return 1
  else
    log_error "CONTAINER" "Container image not found: $1"
    log_debug "CONTAINER" "Image archive should be at: ${PROJECT_ROOT}/deltavision-image.tar"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check dependencies in package.json
check_package_json_deps() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    log_error "DEPENDENCIES" "package.json not found"
    FAILED=$((FAILED+1))
    return 1
  fi
  
  local MISSING_MODULES=false
  
  # Get the list of dependencies from package.json
  local DEPS
  DEPS=$(grep -A 100 '"dependencies"' "${PROJECT_ROOT}/package.json" | grep -B 100 '}' | grep -v '[{}]' | grep '"' | sed 's/.*"\(.*\)":.*/\1/')
  
  for dep in $DEPS; do
    if [ ! -d "${PROJECT_ROOT}/node_modules/${dep}" ]; then
      log_error "DEPENDENCIES" "Missing npm module: ${dep}"
      MISSING_MODULES=true
    fi
  done
  
  if [ "$MISSING_MODULES" = true ]; then
    log_error "DEPENDENCIES" "Some required npm modules are missing"
    log_debug "DEPENDENCIES" "Try: ./scripts/install-offline-deps.sh"
    FAILED=$((FAILED+1))
    return 1
  else
    log_success "DEPENDENCIES" "All required npm modules are installed"
    PASSED=$((PASSED+1))
    return 0
  fi
}

# Function to check if config.json is valid
check_config_json() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if [ ! -f "${PROJECT_ROOT}/folder-config.json" ]; then
    log_error "CONFIG" "folder-config.json not found"
    FAILED=$((FAILED+1))
    return 1
  fi
  
  # Try to parse the JSON file
  if command -v jq &> /dev/null; then
    if ! jq '.' "${PROJECT_ROOT}/folder-config.json" > /dev/null 2>&1; then
      log_error "CONFIG" "folder-config.json is not valid JSON"
      FAILED=$((FAILED+1))
      return 1
    fi
    
    # Check for required fields
    OLD_PATH=$(jq -r '.oldFolderPath' "${PROJECT_ROOT}/folder-config.json" 2>/dev/null)
    NEW_PATH=$(jq -r '.newFolderPath' "${PROJECT_ROOT}/folder-config.json" 2>/dev/null)
    KW_PATH=$(jq -r '.keywordFilePath' "${PROJECT_ROOT}/folder-config.json" 2>/dev/null)
    
    if [ "$OLD_PATH" = "null" ] || [ -z "$OLD_PATH" ]; then
      log_error "CONFIG" "Missing oldFolderPath in folder-config.json"
      FAILED=$((FAILED+1))
      return 1
    fi
    
    if [ "$NEW_PATH" = "null" ] || [ -z "$NEW_PATH" ]; then
      log_error "CONFIG" "Missing newFolderPath in folder-config.json"
      FAILED=$((FAILED+1))
      return 1
    fi
    
    if [ ! -d "$OLD_PATH" ]; then
      log_error "CONFIG" "oldFolderPath does not exist: $OLD_PATH"
      FAILED=$((FAILED+1))
      return 1
    fi
    
    if [ ! -d "$NEW_PATH" ]; then
      log_error "CONFIG" "newFolderPath does not exist: $NEW_PATH"
      FAILED=$((FAILED+1))
      return 1
    fi
    
    if [ -n "$KW_PATH" ] && [ "$KW_PATH" != "null" ] && [ ! -f "$KW_PATH" ]; then
      log_warning "CONFIG" "keywordFilePath does not exist: $KW_PATH"
      WARNINGS=$((WARNINGS+1))
    fi
    
    log_success "CONFIG" "folder-config.json is valid"
    PASSED=$((PASSED+1))
    return 0
  else
    # Fallback to a simple check if jq is not available
    if grep -q "oldFolderPath" "${PROJECT_ROOT}/folder-config.json" && \
       grep -q "newFolderPath" "${PROJECT_ROOT}/folder-config.json"; then
      log_success "CONFIG" "folder-config.json seems valid (basic check only)"
      PASSED=$((PASSED+1))
      return 0
    else
      log_error "CONFIG" "folder-config.json appears to be missing required fields"
      FAILED=$((FAILED+1))
      return 1
    fi
  fi
}

# Check if SELinux is enforcing
check_selinux() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce 2>/dev/null || echo "Unknown")
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
      log_warning "SELINUX" "SELinux is enforcing, which may cause container volume mount issues"
      log_debug "SELINUX" "You may need to use :Z option in volume mounts or run: sudo setenforce 0"
      WARNINGS=$((WARNINGS+1))
      return 1
    else
      log_success "SELINUX" "SELinux is not enforcing: $SELINUX_STATUS"
      PASSED=$((PASSED+1))
      return 0
    fi
  else
    log_debug "SELINUX" "SELinux status check skipped (getenforce not available)"
    return 0
  fi
}

# Check if current user is in docker group (if using Docker)
check_docker_group() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if command -v docker &> /dev/null; then
    if groups | grep -q "docker"; then
      log_success "DOCKER" "Current user is in docker group"
      PASSED=$((PASSED+1))
      return 0
    else
      log_warning "DOCKER" "Current user is not in docker group, may need sudo for Docker commands"
      log_debug "DOCKER" "Run: sudo usermod -aG docker $(whoami) && newgrp docker"
      WARNINGS=$((WARNINGS+1))
      return 1
    fi
  fi
  return 0
}

# Check if startup script exists and is executable
check_startup_script() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  STARTUP_SCRIPT="${PROJECT_ROOT}/start-deltavision-offline.sh"
  
  if [ ! -f "$STARTUP_SCRIPT" ]; then
    log_error "STARTUP" "Startup script not found: $STARTUP_SCRIPT"
    FAILED=$((FAILED+1))
    return 1
  fi
  
  if [ ! -x "$STARTUP_SCRIPT" ]; then
    log_error "STARTUP" "Startup script is not executable: $STARTUP_SCRIPT"
    log_debug "STARTUP" "Run: chmod +x $STARTUP_SCRIPT"
    FAILED=$((FAILED+1))
    return 1
  fi
  
  log_success "STARTUP" "Startup script is ready: $STARTUP_SCRIPT"
  PASSED=$((PASSED+1))
  return 0
}

# ==================== Begin Preflight Checks ====================

# Check critical system requirements
log_info "PREFLIGHT" "Checking system requirements..."

# Check if Node.js and npm are installed
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  log_success "SYSTEM" "Node.js installed: $NODE_VERSION"
else
  log_warning "SYSTEM" "Node.js not found, but may not be needed if using container only"
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  log_success "SYSTEM" "npm installed: $NPM_VERSION"
else
  log_warning "SYSTEM" "npm not found, but may not be needed if using container only"
fi

# Check if Docker or Podman is installed
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  log_success "SYSTEM" "Docker installed: $DOCKER_VERSION"
  check_docker_group
elif command -v podman &> /dev/null; then
  PODMAN_VERSION=$(podman --version)
  log_success "SYSTEM" "Podman installed: $PODMAN_VERSION"
else
  log_error "SYSTEM" "Neither Docker nor Podman is installed"
  log_debug "SYSTEM" "Install Docker: https://docs.docker.com/get-docker/"
  log_debug "SYSTEM" "Or install Podman: https://podman.io/getting-started/installation"
fi

# Check SELinux status
check_selinux

# Check disk space (at least 1GB free for DeltaVision)
check_disk_space "$PROJECT_ROOT" 1048576  # 1GB in KB

# Check memory (at least 2GB recommended)
check_memory 2097152  # 2GB in KB

# Check port 3000 availability (DeltaVision server port)
check_port_available 3000

# Check for container image
check_container_image "deltavision"

# Check if critical files exist
log_info "PREFLIGHT" "Checking critical files..."
check_file "${PROJECT_ROOT}/folder-config.json"
check_file "${PROJECT_ROOT}/keywords.txt"
check_startup_script

# Check filesystem permissions
log_info "PREFLIGHT" "Checking filesystem permissions..."
check_read_permission "${PROJECT_ROOT}/folder-config.json"
check_read_permission "${PROJECT_ROOT}/keywords.txt"

# Check folder-config.json validity
check_config_json

# Check for direct npm dependencies if not in container-only mode
if [ -d "${PROJECT_ROOT}/node_modules" ]; then
  log_info "PREFLIGHT" "Checking npm dependencies..."
  check_package_json_deps
fi

# Check volume directories from folder-config.json
if command -v jq &> /dev/null && [ -f "${PROJECT_ROOT}/folder-config.json" ]; then
  OLD_PATH=$(jq -r '.oldFolderPath' "${PROJECT_ROOT}/folder-config.json" 2>/dev/null)
  NEW_PATH=$(jq -r '.newFolderPath' "${PROJECT_ROOT}/folder-config.json" 2>/dev/null)
  
  if [ -n "$OLD_PATH" ] && [ "$OLD_PATH" != "null" ]; then
    check_directory "$OLD_PATH"
    check_read_permission "$OLD_PATH"
  fi
  
  if [ -n "$NEW_PATH" ] && [ "$NEW_PATH" != "null" ]; then
    check_directory "$NEW_PATH"
    check_read_permission "$NEW_PATH"
  fi
fi

# ==================== Preflight Check Summary ====================
log_info "PREFLIGHT" "========= Preflight Check Summary ========="
log_info "PREFLIGHT" "Total checks: $TOTAL_CHECKS"
log_info "PREFLIGHT" "Passed: $PASSED"
log_info "PREFLIGHT" "Failed: $FAILED"
log_info "PREFLIGHT" "Warnings: $WARNINGS"

if [ $FAILED -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    log_success "PREFLIGHT" "All checks passed! DeltaVision is ready to launch."
    exit 0
  else
    log_warning "PREFLIGHT" "Checks completed with warnings. DeltaVision may work, but there are potential issues."
    log_debug "PREFLIGHT" "Review the warnings above and the log file for details."
    exit 0
  fi
else
  log_error "PREFLIGHT" "Preflight check failed with $FAILED errors. DeltaVision cannot function properly."
  log_debug "PREFLIGHT" "Review the errors above and the log file for details."
  exit 1
fi
