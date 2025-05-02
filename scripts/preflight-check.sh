#!/usr/bin/env bash

# preflight-check.sh
# Performs pre-flight checks to ensure DeltaVision will run correctly
# in a standalone environment

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Color definitions for better user experience
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize counters
WARNINGS=0
ERRORS=0
DIAGNOSTIC_MODE=${DIAGNOSTIC_MODE:-false}

# Helper functions
error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  ERRORS=$((ERRORS+1))
}

warning() {
  echo -e "${YELLOW}WARNING: $1${NC}" >&2
  WARNINGS=$((WARNINGS+1))
}

info() {
  echo -e "${BLUE}INFO: $1${NC}"
}

success() {
  echo -e "${GREEN}SUCCESS: $1${NC}"
}

log_debug() {
  if [ "$DIAGNOSTIC_MODE" = "true" ]; then
    echo -e "${BLUE}DEBUG[$1]: $2${NC}"
  fi
}

log_error() {
  echo -e "${RED}ERROR[$1]: $2${NC}" >&2
  ERRORS=$((ERRORS+1))
}

log_warning() {
  echo -e "${YELLOW}WARNING[$1]: $2${NC}" >&2
  WARNINGS=$((WARNINGS+1))
}

log_success() {
  echo -e "${GREEN}SUCCESS[$1]: $2${NC}"
}

# Check system info
check_system_info() {
  log_debug "SYSTEM" "Running system info checks"
  
  # Check OS
  OS_NAME=$(uname -s)
  OS_VERSION=$(uname -r)
  log_debug "SYSTEM" "OS: $OS_NAME $OS_VERSION"
  
  # Check CPU architecture
  CPU_ARCH=$(uname -m)
  log_debug "SYSTEM" "CPU Architecture: $CPU_ARCH"
  
  # Check available memory
  if command -v free &> /dev/null; then
    MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$MEM_TOTAL" -lt 1024 ]; then
      log_warning "SYSTEM" "Less than 1GB RAM available: ${MEM_TOTAL}MB"
      log_debug "SYSTEM" "DeltaVision may run slowly with less than 1GB RAM"
    else
      log_success "SYSTEM" "Sufficient memory available: ${MEM_TOTAL}MB"
    fi
  else
    log_warning "SYSTEM" "Cannot check available memory (free command not available)"
  fi
  
  # Check disk space
  if command -v df &> /dev/null; then
    DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    log_debug "SYSTEM" "Available disk space: $DISK_SPACE"
  else
    log_warning "SYSTEM" "Cannot check available disk space (df command not available)"
  fi
}

# Check Node.js
check_node() {
  log_debug "NODE" "Checking Node.js installation"
  
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_success "NODE" "Node.js installed: $NODE_VERSION"
    
    # Check Node.js version is adequate
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d '.' -f 1 | tr -d 'v')
    if [ "$NODE_MAJOR" -lt 14 ]; then
      log_warning "NODE" "Node.js version $NODE_VERSION may be too old"
      log_debug "NODE" "DeltaVision works best with Node.js 14.x or later"
    fi
  else
    log_error "NODE" "Node.js is not installed"
    log_debug "NODE" "Install Node.js: https://nodejs.org/"
    return 1
  fi
  
  # Check npm
  if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log_success "NODE" "npm installed: $NPM_VERSION"
  else
    log_error "NODE" "npm is not installed"
    log_debug "NODE" "npm is required for DeltaVision to function"
    return 1
  fi
  
  return 0
}

# Check if required files exist
check_required_files() {
  log_debug "FILES" "Checking for required files"
  
  # Check for package.json
  if [ -f "$PARENT_DIR/package.json" ]; then
    log_success "FILES" "package.json found"
  else
    log_error "FILES" "package.json not found in $PARENT_DIR"
    log_debug "FILES" "Make sure you're running this script from the DeltaVision directory"
    return 1
  fi
  
  # Check for server script
  if [ -f "$PARENT_DIR/src/server/index.js" ]; then
    log_success "FILES" "Server script found"
  else
    log_error "FILES" "Server script not found: $PARENT_DIR/src/server/index.js"
    log_debug "FILES" "Make sure the DeltaVision installation is complete"
    return 1
  fi
  
  # Check for public assets
  if [ -d "$PARENT_DIR/public" ] && [ -f "$PARENT_DIR/public/index.html" ]; then
    log_success "FILES" "Public assets found"
  else
    log_error "FILES" "Public assets not found: $PARENT_DIR/public/index.html"
    log_debug "FILES" "Make sure the DeltaVision installation is complete"
    return 1
  fi
  
  return 0
}

# Check dependencies
check_dependencies() {
  log_debug "DEPS" "Checking for Node.js dependencies"
  
  # Check if node_modules exists
  if [ -d "$PARENT_DIR/node_modules" ]; then
    if [ -d "$PARENT_DIR/node_modules/express" ]; then
      log_success "DEPS" "Node.js dependencies are installed"
    else
      log_warning "DEPS" "Some dependencies may be missing"
      log_debug "DEPS" "Run 'npm install' to install missing dependencies"
    fi
  else
    log_warning "DEPS" "node_modules directory not found"
    log_debug "DEPS" "Run 'npm install' to install dependencies"
  fi
}

# Check port availability
check_port() {
  PORT=${1:-3000}
  log_debug "NETWORK" "Checking if port $PORT is available"
  
  # Check with different tools based on availability
  if command -v nc &> /dev/null; then
    if nc -z localhost $PORT 2>/dev/null; then
      log_warning "NETWORK" "Port $PORT is already in use"
      log_debug "NETWORK" "Another service is using port $PORT"
      return 1
    else
      log_success "NETWORK" "Port $PORT is available"
    fi
  elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":$PORT "; then
      log_warning "NETWORK" "Port $PORT is already in use"
      log_debug "NETWORK" "Another service is using port $PORT"
      return 1
    else
      log_success "NETWORK" "Port $PORT is available"
    fi
  elif command -v ss &> /dev/null; then
    if ss -tuln | grep -q ":$PORT "; then
      log_warning "NETWORK" "Port $PORT is already in use"
      log_debug "NETWORK" "Another service is using port $PORT"
      return 1
    else
      log_success "NETWORK" "Port $PORT is available"
    fi
  else
    log_warning "NETWORK" "Cannot check if port $PORT is available (nc, netstat, or ss command not found)"
  fi
  
  return 0
}

# Main script execution
echo
echo "========================================"
echo "DeltaVision Pre-flight Check"
echo "Checking system compatibility..."
echo "========================================"
echo

# Run checks
check_system_info
check_node
check_required_files
check_dependencies
check_port 3000

echo
echo "========================================"

if [ $ERRORS -gt 0 ]; then
  error "Pre-flight check failed with $ERRORS error(s) and $WARNINGS warning(s)"
  echo "Fix the errors above before running DeltaVision"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  warning "Pre-flight check passed with $WARNINGS warning(s)"
  echo "DeltaVision may not function correctly due to warnings"
  echo "Consider fixing the warnings above before proceeding"
  exit 2
else
  success "Pre-flight check passed successfully!"
  echo "DeltaVision should run properly on this system"
  exit 0
fi
