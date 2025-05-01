#!/usr/bin/env bash
# verify-offline-dependencies.sh
# Comprehensive verification tool to ensure all dependencies are available offline

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Status indicators
PASS="[ ${GREEN}PASS${NC} ]"
FAIL="[ ${RED}FAIL${NC} ]"
WARN="[ ${YELLOW}WARN${NC} ]"
INFO="[ ${BLUE}INFO${NC} ]"

# Counters for summary
TOTAL_CHECKS=0
PASSED=0
FAILED=0
WARNINGS=0

# Log file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/verification-$(date +%Y%m%d-%H%M%S).log"

# Message functions
print_status() {
  printf "  ${PASS} %-60s\\n" "$1" | tee -a "$LOG_FILE"
}

print_error() {
  printf "  ${FAIL} %-60s\\n" "$1" | tee -a "$LOG_FILE"
}

print_warning() {
  printf "  ${WARN} %-60s\\n" "$1" | tee -a "$LOG_FILE"
}

print_info() {
  printf "  ${INFO} %-60s\\n" "$1" | tee -a "$LOG_FILE"
}

print_detail() {
  printf "       ${GRAY}%s${NC}\\n" "$1" | tee -a "$LOG_FILE"
}

header() {
  echo -e "\n${CYAN}$1${NC}" | tee -a "$LOG_FILE"
  echo -e "${CYAN}$(printf '%.0s-' $(seq 1 ${#1}))${NC}" | tee -a "$LOG_FILE"
}

log_only() {
  echo "$1" >> "$LOG_FILE"
}

# Function to check if a command exists
check_command() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if command -v "$1" &> /dev/null; then
    print_status "Command exists: $1"
    print_detail "Path: $(which "$1")"
    PASSED=$((PASSED+1))
    return 0
  else
    print_error "Command not found: $1"
    print_detail "This command is required for DeltaVision operation."
    if [ -n "$2" ]; then
      print_detail "$2"
    fi
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check if a file exists
check_file() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -f "$1" ]; then
    print_status "File exists: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    print_error "Missing file: $1"
    print_detail "This file is required for DeltaVision operation."
    if [ -n "$2" ]; then
      print_detail "$2"
    fi
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check if a directory exists
check_dir() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -d "$1" ]; then
    print_status "Directory exists: $1"
    PASSED=$((PASSED+1))
    return 0
  else
    print_error "Missing directory: $1"
    print_detail "This directory is required for DeltaVision operation."
    if [ -n "$2" ]; then
      print_detail "$2"
    fi
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check for npm packages
check_npm_package() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  if [ -d "${PROJECT_ROOT}/node_modules/$1" ]; then
    if [ -n "$2" ]; then
      # Check version if specified
      VERSION=$(grep -e '"version"' "${PROJECT_ROOT}/node_modules/$1/package.json" 2>/dev/null | head -1 | sed 's/.*"version": "\(.*\)",/\1/')
      if [ -n "$VERSION" ]; then
        # Very simple version comparison - just check if versions match exactly
        if [ "$VERSION" = "$2" ]; then
          print_status "Package $1 installed with correct version ($2)"
          PASSED=$((PASSED+1))
          return 0
        else
          print_warning "Package $1 installed, but version mismatch (found: $VERSION, expected: $2)"
          print_detail "Version differences may cause issues in offline environments."
          WARNINGS=$((WARNINGS+1))
          return 1
        fi
      else
        print_warning "Package $1 installed, but couldn't determine version"
        WARNINGS=$((WARNINGS+1))
        return 1
      fi
    else
      print_status "Package $1 installed"
      PASSED=$((PASSED+1))
      return 0
    fi
  else
    print_error "Package $1 not installed"
    print_detail "This dependency is required for DeltaVision operation."
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check for package.json dependencies
check_package_json_deps() {
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    print_error "package.json not found"
    print_detail "Cannot verify dependencies without package.json"
    return 1
  fi

  print_info "Checking package.json dependencies..."
  log_only "Dependencies from package.json:"
  
  # Extract dependencies from package.json
  DEPS=$(grep -A 100 '"dependencies"' "${PROJECT_ROOT}/package.json" | grep -B 100 '}' | grep -v '[{}]' | sed 's/.*"\(.*\)":.*/\1/' | tr -d ',')
  
  for dep in $DEPS; do
    if [ -n "$dep" ]; then
      check_npm_package "$dep"
    fi
  done
}

# Function to check offline npm cache
check_npm_cache() {
  NPM_CACHE_DIR="${PROJECT_ROOT}/npm-packages"
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if [ -d "$NPM_CACHE_DIR" ]; then
    pkg_count=$(find "$NPM_CACHE_DIR" -name "*.tgz" | wc -l)
    if [ "$pkg_count" -gt 0 ]; then
      print_status "Offline npm cache contains $pkg_count packages"
      print_detail "Packages are available for offline installation"
      PASSED=$((PASSED+1))
      return 0
    else
      print_error "Offline npm cache directory exists but contains no packages"
      print_detail "The npm-packages directory should contain .tgz files for offline installation"
      FAILED=$((FAILED+1))
      return 1
    fi
  else
    print_error "Offline npm cache directory not found: $NPM_CACHE_DIR"
    print_detail "This directory is required for offline dependency installation"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Check for container images
check_container_image() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  # Detect container engine
  CONTAINER_ENGINE="docker"
  if command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
  fi
  
  if $CONTAINER_ENGINE image ls | grep -q "$1"; then
    print_status "Container image exists: $1"
    PASSED=$((PASSED+1))
    return 0
  elif [ -f "${PROJECT_ROOT}/deltavision-image.tar" ]; then
    print_warning "Container image not loaded, but image archive exists"
    print_detail "Run: $CONTAINER_ENGINE load -i ${PROJECT_ROOT}/deltavision-image.tar"
    WARNINGS=$((WARNINGS+1))
    return 1
  else
    print_error "Container image not found: $1"
    print_detail "The container image is required for DeltaVision operation."
    print_detail "Image archive should be at: ${PROJECT_ROOT}/deltavision-image.tar"
    FAILED=$((FAILED+1))
    return 1
  fi
}

# Function to check for external dependencies in JavaScript files
check_external_deps() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  header "Checking for external dependencies in JavaScript files"
  
  # Patterns that might indicate external dependencies
  SUSPICIOUS_PATTERNS=(
    "https://"
    "http://"
    "cdn.jsdelivr.net"
    "unpkg.com"
    "cdnjs.cloudflare.com"
    "ajax.googleapis.com"
    "fonts.googleapis.com"
    "api.mapbox.com"
    "connect.facebook.net"
    "platform.twitter.com"
    "maps.googleapis.com"
  )
  
  FOUND_EXTERNAL=false
  EXTERNAL_REFS=()
  
  for pattern in "${SUSPICIOUS_PATTERNS[@]}"; do
    # Find in JavaScript and HTML files
    FOUND=$(find "${PROJECT_ROOT}/src" "${PROJECT_ROOT}/public" -type f \( -name "*.js" -o -name "*.html" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -exec grep -l "$pattern" {} \; 2>/dev/null)
    
    if [ -n "$FOUND" ]; then
      FOUND_EXTERNAL=true
      while IFS= read -r file; do
        refs=$(grep -n "$pattern" "$file" | head -5)
        EXTERNAL_REFS+=("File: $file")
        EXTERNAL_REFS+=("$refs")
      done <<< "$FOUND"
    fi
  done
  
  if [ "$FOUND_EXTERNAL" = true ]; then
    print_warning "Found potential external dependencies in code"
    print_detail "These may cause issues in offline environments:"
    for ref in "${EXTERNAL_REFS[@]}"; do
      print_detail "$ref"
    done
    log_only "$(printf '%s\n' "${EXTERNAL_REFS[@]}")"
    WARNINGS=$((WARNINGS+1))
    return 1
  else
    print_status "No external dependencies found in code files"
    print_detail "The application should work without internet connectivity"
    PASSED=$((PASSED+1))
    return 0
  fi
}

# Check browser compatibility
check_browser_cache() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  if [ -f "${PROJECT_ROOT}/public/service-worker.js" ]; then
    print_status "Service worker found for offline browser caching"
    PASSED=$((PASSED+1))
    return 0
  else
    print_warning "No service worker found for offline browser caching"
    print_detail "Files at ${PROJECT_ROOT}/public/service-worker.js is recommended"
    print_detail "This affects browser caching but doesn't prevent basic functionality"
    WARNINGS=$((WARNINGS+1))
    return 1
  fi
}

# Check for environment variables that might reference external services
check_env_vars() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  ENV_FILES=(".env" ".env.production" ".env.local" ".env.development")
  
  SUSPICIOUS_VARS=(
    "API_URL="
    "API_KEY="
    "AUTH_URL="
    "EXTERNAL_"
    "CLOUD_"
    "AWS_"
    "AZURE_"
    "GOOGLE_"
  )
  
  FOUND_SUSPICIOUS=false
  SUSPICIOUS_ENV_REFS=()
  
  for env_file in "${ENV_FILES[@]}"; do
    if [ -f "${PROJECT_ROOT}/${env_file}" ]; then
      for pattern in "${SUSPICIOUS_VARS[@]}"; do
        FOUND=$(grep "$pattern" "${PROJECT_ROOT}/${env_file}" 2>/dev/null)
        if [ -n "$FOUND" ]; then
          FOUND_SUSPICIOUS=true
          SUSPICIOUS_ENV_REFS+=("File: ${env_file}")
          SUSPICIOUS_ENV_REFS+=("$FOUND")
        fi
      done
    fi
  done
  
  if [ "$FOUND_SUSPICIOUS" = true ]; then
    print_warning "Found potential external service references in env files"
    print_detail "These may cause issues in offline environments:"
    for ref in "${SUSPICIOUS_ENV_REFS[@]}"; do
      print_detail "$ref"
    done
    log_only "$(printf '%s\n' "${SUSPICIOUS_ENV_REFS[@]}")"
    WARNINGS=$((WARNINGS+1))
    return 1
  else
    print_status "No suspicious environment variables found"
    print_detail "The application should work without external services"
    PASSED=$((PASSED+1))
    return 0
  fi
}

# Function to check running processes
check_running_processes() {
  TOTAL_CHECKS=$((TOTAL_CHECKS+1))
  
  # Detect container engine
  CONTAINER_ENGINE="docker"
  if command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
  fi
  
  if $CONTAINER_ENGINE ps | grep -q "deltavision"; then
    print_status "DeltaVision container is running"
    PASSED=$((PASSED+1))
    return 0
  else
    print_warning "DeltaVision container is not running"
    print_detail "Run: ./start-deltavision-offline.sh to start the container"
    WARNINGS=$((WARNINGS+1))
    return 1
  fi
}

# Main verification process
echo "DeltaVision Offline Dependencies Verification" | tee "$LOG_FILE"
echo "=========================================" | tee -a "$LOG_FILE"
echo "Date: $(date)" | tee -a "$LOG_FILE"
echo "Verifying offline capabilities and dependencies..." | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# System Requirements
header "System Requirements"
check_command "node" "Install Node.js: https://nodejs.org/"
check_command "npm" "Install npm: https://www.npmjs.com/"

# Either Docker or Podman should be available
TOTAL_CHECKS=$((TOTAL_CHECKS+1))
if command -v docker &> /dev/null; then
  print_status "Container engine exists: docker"
  print_detail "Path: $(which docker)"
  PASSED=$((PASSED+1))
elif command -v podman &> /dev/null; then
  print_status "Container engine exists: podman"
  print_detail "Path: $(which podman)"
  PASSED=$((PASSED+1))
else
  print_error "No container engine found (docker or podman)"
  print_detail "Either Docker or Podman is required for DeltaVision."
  print_detail "Install Docker: https://docs.docker.com/get-docker/"
  print_detail "Or install Podman: https://podman.io/getting-started/installation"
  FAILED=$((FAILED+1))
fi

# Required files
header "Required Files"
check_file "${PROJECT_ROOT}/package.json" "This defines the application dependencies"
check_file "${PROJECT_ROOT}/folder-config.json" "This configures the directory paths for DeltaVision"
check_file "${PROJECT_ROOT}/keywords.txt" "This defines the keywords for highlighting in DeltaVision"
check_file "${PROJECT_ROOT}/start-deltavision-offline.sh" "This is the main startup script"

# Required directories
header "Required Directories"
check_dir "${PROJECT_ROOT}/src" "This contains the application source code"
check_dir "${PROJECT_ROOT}/public" "This contains static assets for the web interface"
check_dir "${PROJECT_ROOT}/scripts" "This contains helper scripts for DeltaVision"

# Container image
header "Container Images"
check_container_image "deltavision"

# NPM packages
header "NPM Dependencies"
check_npm_cache
check_package_json_deps

# External dependencies
check_external_deps
check_env_vars

# Browser caching
header "Browser Offline Capabilities"
check_browser_cache

# Running processes
header "Running Processes"
check_running_processes

# Summary
header "Verification Summary"
echo "Total checks: $TOTAL_CHECKS" | tee -a "$LOG_FILE"
echo "Passed: $PASSED" | tee -a "$LOG_FILE"
echo "Failed: $FAILED" | tee -a "$LOG_FILE"
echo "Warnings: $WARNINGS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ $FAILED -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! DeltaVision is properly configured for offline use.${NC}" | tee -a "$LOG_FILE"
  else
    echo -e "${YELLOW}Verification completed with warnings. DeltaVision may function, but there are potential issues.${NC}" | tee -a "$LOG_FILE"
    echo -e "Review the warnings above and the log file for details." | tee -a "$LOG_FILE"
  fi
else
  echo -e "${RED}Verification failed with $FAILED errors. DeltaVision cannot function properly in offline mode.${NC}" | tee -a "$LOG_FILE"
  echo -e "Review the errors above and the log file for details." | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Verification log saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
