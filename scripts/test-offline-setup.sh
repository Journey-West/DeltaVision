#!/usr/bin/env bash
# test-offline-setup.sh
# Quick test script to verify DeltaVision offline environment is ready

# Source the diagnostic logger if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Basic color definitions - define these regardless
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

error() { echo -e "${RED}ERROR: $1${NC}" >&2; }
warning() { echo -e "${YELLOW}WARNING: $1${NC}" >&2; }
info() { echo -e "${BLUE}INFO: $1${NC}"; }
success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }

# Try to source the diagnostic logger but continue if there's an issue
if [ -f "${SCRIPT_DIR}/diagnostic-logger.sh" ]; then
    source "${SCRIPT_DIR}/diagnostic-logger.sh" 2>/dev/null || true
fi

# Header
echo "DeltaVision Offline Setup Verification"
echo "====================================="
echo 

# Check file organization
info "Checking file organization..."
ALL_CORRECT=true

# Critical script check
for script in "${SCRIPT_DIR}/start-deltavision-offline.sh" "${SCRIPT_DIR}/configure-offline.sh" "${SCRIPT_DIR}/verify-offline-dependencies.sh" "${SCRIPT_DIR}/preflight-check.sh"; do
    if [ ! -f "$script" ]; then
        error "Missing script: $script"
        ALL_CORRECT=false
    elif [ ! -x "$script" ]; then
        warning "Script exists but not executable: $script"
        echo "  - Run: chmod +x $script"
        ALL_CORRECT=false
    else
        success "Script ready: $(basename "$script")"
    fi
done

# Docker compose files check
if [ ! -f "${PROJECT_ROOT}/docker/docker-compose.offline.yml" ]; then
    error "Missing docker-compose.offline.yml in docker directory"
    ALL_CORRECT=false
else
    success "docker-compose.offline.yml properly located in docker directory"
fi

# Documentation check
if [ ! -f "${PROJECT_ROOT}/docs/OFFLINE-README.md" ]; then
    error "Missing OFFLINE-README.md in docs directory"
    ALL_CORRECT=false
else
    success "OFFLINE-README.md properly located in docs directory"
fi

# Symlink check
if [ ! -L "${PROJECT_ROOT}/start-deltavision-offline.sh" ]; then
    warning "Symlink missing for start-deltavision-offline.sh in root directory"
    echo "  - Run: ln -s scripts/start-deltavision-offline.sh ${PROJECT_ROOT}/start-deltavision-offline.sh"
    ALL_CORRECT=false
else
    success "Symlink exists for start-deltavision-offline.sh in root directory"
fi

# Directories check
for dir in "logs" "npm-packages"; do
    if [ ! -d "${PROJECT_ROOT}/$dir" ]; then
        warning "Directory missing: $dir"
        echo "  - Run: mkdir -p ${PROJECT_ROOT}/$dir"
        ALL_CORRECT=false
    else
        success "Directory exists: $dir"
    fi
done

# Path check in scripts (sample check)
DOCKER_PATH_CHECK=$(grep -l "docker/docker-compose.offline.yml" ${SCRIPT_DIR}/start-deltavision-offline.sh 2>/dev/null || echo "")
if [ -z "$DOCKER_PATH_CHECK" ]; then
    warning "Path reference to docker/docker-compose.offline.yml not found in start-deltavision-offline.sh"
    echo "  - Check if paths were updated correctly after reorganization"
    ALL_CORRECT=false
else
    success "Path references updated correctly in start-deltavision-offline.sh"
fi

# Summary
echo
echo "====================================="
if [ "$ALL_CORRECT" = true ]; then
    success "All checks passed! DeltaVision is ready for testing."
    echo
    echo "Run the following commands to test offline deployment:"
    echo "1. ${SCRIPT_DIR}/verify-offline-dependencies.sh"
    echo "2. ${SCRIPT_DIR}/preflight-check.sh"
    echo "3. ${SCRIPT_DIR}/configure-offline.sh"
    echo "4. ${SCRIPT_DIR}/start-deltavision-offline.sh"
else
    warning "Some checks failed. Please address the issues above before testing."
fi
echo
