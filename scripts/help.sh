#!/usr/bin/env bash
# help.sh - Script to display comprehensive help for DeltaVision scripts
# Usage: ./scripts/help.sh [script_name]

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# DeltaVision logo
print_logo() {
  echo -e "${CYAN}"
  echo "  _____        _  _        __      ___      _             "
  echo " |  __ \\      | || |       \\ \\    / (_)    (_)            "
  echo " | |  | | ___ | || |_ __ _  \\ \\  / / _ ___ _  ___  _ __   "
  echo " | |  | |/ _ \\| || __/ _' |  \\ \\/ / | / __| |/ _ \\| '_ \\  "
  echo " | |__| |  __/| || || (_| |   \\  /  | \\__ \\ | (_) | | | | "
  echo " |_____/ \\___|\\__|\\__\\__,_|    \\/   |_|___/_|\\___/|_| |_| "
  echo -e "${NC}"
  echo "===== DeltaVision Script Helper ====="
  echo
}

# Script information
declare -A SCRIPT_INFO
SCRIPT_INFO["start-deltavision.sh"]="Starts DeltaVision in standard (non-Docker) mode when Node.js is installed locally."
SCRIPT_INFO["docker-package-offline.sh"]="Creates a self-contained package for offline/air-gapped deployment."
SCRIPT_INFO["configure-offline.sh"]="Configures the offline deployment with correct paths and settings."
SCRIPT_INFO["start-deltavision-offline.sh"]="Starts DeltaVision in offline mode using Docker/Podman."
SCRIPT_INFO["verify-offline-dependencies.sh"]="Verifies all dependencies are available for offline mode operation."
SCRIPT_INFO["preflight-check.sh"]="Performs pre-flight checks before starting in offline mode."
SCRIPT_INFO["diagnostic-logger.sh"]="Provides diagnostic logging capabilities (sourced by other scripts)."
SCRIPT_INFO["install-offline-deps.sh"]="Installs npm dependencies from offline cache when internet is unavailable."
SCRIPT_INFO["test-offline-setup.sh"]="Verifies correct file organization and structure."
SCRIPT_INFO["help.sh"]="Displays this help information for DeltaVision scripts."

# Script usage information
declare -A SCRIPT_USAGE
SCRIPT_USAGE["start-deltavision.sh"]="./scripts/start-deltavision.sh <old_folder> <new_folder> [keywords_file]"
SCRIPT_USAGE["docker-package-offline.sh"]="./scripts/docker-package-offline.sh [version]"
SCRIPT_USAGE["configure-offline.sh"]="./scripts/configure-offline.sh"
SCRIPT_USAGE["start-deltavision-offline.sh"]="./scripts/start-deltavision-offline.sh"
SCRIPT_USAGE["verify-offline-dependencies.sh"]="./scripts/verify-offline-dependencies.sh"
SCRIPT_USAGE["preflight-check.sh"]="./scripts/preflight-check.sh"
SCRIPT_USAGE["install-offline-deps.sh"]="./scripts/install-offline-deps.sh"
SCRIPT_USAGE["test-offline-setup.sh"]="./scripts/test-offline-setup.sh"
SCRIPT_USAGE["help.sh"]="./scripts/help.sh [script_name]"

# Script examples
declare -A SCRIPT_EXAMPLES
SCRIPT_EXAMPLES["start-deltavision.sh"]="# Start DeltaVision with old and new directories:
./scripts/start-deltavision.sh /path/to/old/files /path/to/new/files

# Start DeltaVision with custom keywords file:
./scripts/start-deltavision.sh /path/to/old/files /path/to/new/files /path/to/custom-keywords.txt"

SCRIPT_EXAMPLES["docker-package-offline.sh"]="# Create an offline package with default version (1.0.0):
./scripts/docker-package-offline.sh

# Create an offline package with custom version:
./scripts/docker-package-offline.sh 2.1.0"

SCRIPT_EXAMPLES["configure-offline.sh"]="# Configure offline deployment interactively:
./scripts/configure-offline.sh"

SCRIPT_EXAMPLES["start-deltavision-offline.sh"]="# Start DeltaVision in offline mode:
./scripts/start-deltavision-offline.sh

# Start with debug output:
DEBUG=true ./scripts/start-deltavision-offline.sh"

SCRIPT_EXAMPLES["verify-offline-dependencies.sh"]="# Verify all dependencies are available:
./scripts/verify-offline-dependencies.sh"

SCRIPT_EXAMPLES["preflight-check.sh"]="# Run preflight checks before starting:
./scripts/preflight-check.sh"

SCRIPT_EXAMPLES["install-offline-deps.sh"]="# Install dependencies from offline cache:
./scripts/install-offline-deps.sh"

SCRIPT_EXAMPLES["test-offline-setup.sh"]="# Verify file organization:
./scripts/test-offline-setup.sh"

SCRIPT_EXAMPLES["help.sh"]="# Show all available scripts:
./scripts/help.sh

# Show help for a specific script:
./scripts/help.sh start-deltavision-offline.sh"

# Workflow recommendations based on scenarios
declare -A WORKFLOWS
WORKFLOWS["online"]="Standard online deployment:
1. Configure Docker:
   Edit docker/docker-compose.yml with your settings

2. Start with Docker:
   cd docker && docker-compose up -d"

WORKFLOWS["offline_packaging"]="Creating a package for offline deployment:
1. On a connected system, run:
   ./scripts/docker-package-offline.sh

2. Transfer the resulting ZIP file to the air-gapped system"

WORKFLOWS["offline_deployment"]="Deploying in an air-gapped environment:
1. Extract the offline package ZIP file

2. Verify the package:
   ./scripts/test-offline-setup.sh
   
3. Configure paths:
   ./scripts/configure-offline.sh
   
4. Verify dependencies:
   ./scripts/verify-offline-dependencies.sh
   
5. Run preflight checks:
   ./scripts/preflight-check.sh
   
6. Start DeltaVision:
   ./scripts/start-deltavision-offline.sh"

WORKFLOWS["standard"]="Traditional deployment (without Docker):
1. Install Node.js and npm locally

2. Start DeltaVision:
   ./scripts/start-deltavision.sh /path/to/old/files /path/to/new/files"

WORKFLOWS["troubleshooting"]="Troubleshooting:
1. Check logs in the logs/ directory

2. Verify offline dependencies:
   ./scripts/verify-offline-dependencies.sh
   
3. Run the diagnostic test:
   ./scripts/test-offline-setup.sh"

# Function to display info for a specific script
display_script_info() {
  local script=$1
  
  if [[ -z "${SCRIPT_INFO[$script]}" ]]; then
    echo -e "${RED}Script '$script' not found or not documented.${NC}"
    echo "Run './scripts/help.sh' to see all available scripts."
    exit 1
  fi
  
  echo -e "${BOLD}${PURPLE}$script${NC}"
  echo -e "${YELLOW}Description:${NC}"
  echo "  ${SCRIPT_INFO[$script]}"
  echo 
  
  if [[ -n "${SCRIPT_USAGE[$script]}" ]]; then
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ${SCRIPT_USAGE[$script]}"
    echo
  fi
  
  if [[ -n "${SCRIPT_EXAMPLES[$script]}" ]]; then
    echo -e "${YELLOW}Examples:${NC}"
    echo "${SCRIPT_EXAMPLES[$script]}"
    echo
  fi
  
  # Find dependent scripts
  if grep -q "source.*${script}" "${SCRIPT_DIR}"/* 2>/dev/null; then
    echo -e "${YELLOW}Used by:${NC}"
    grep -l "source.*${script}" "${SCRIPT_DIR}"/* | while read -r dependent; do
      echo "  - $(basename "$dependent")"
    done
    echo
  fi
}

# Function to list all available scripts
list_all_scripts() {
  print_logo
  echo -e "${BOLD}Available Scripts:${NC}"
  echo
  
  echo -e "${BOLD}${BLUE}Standard Deployment Scripts:${NC}"
  echo -e "  ${BOLD}start-deltavision.sh${NC} - Starts DeltaVision in standard mode"
  echo
  
  echo -e "${BOLD}${BLUE}Offline/Air-Gapped Deployment Scripts:${NC}"
  for script in docker-package-offline.sh configure-offline.sh start-deltavision-offline.sh \
                verify-offline-dependencies.sh preflight-check.sh diagnostic-logger.sh \
                install-offline-deps.sh test-offline-setup.sh; do
    if [[ -f "${SCRIPT_DIR}/$script" ]]; then
      echo -e "  ${BOLD}$script${NC} - ${SCRIPT_INFO[$script]}"
    fi
  done
  echo
  
  echo -e "${BOLD}${BLUE}Helper Scripts:${NC}"
  echo -e "  ${BOLD}help.sh${NC} - Displays this help information"
  echo
  
  echo -e "${BOLD}${YELLOW}Common Workflows:${NC}"
  echo
  echo -e "${BOLD}${GREEN}1. ${WORKFLOWS["online"]}${NC}"
  echo
  echo -e "${BOLD}${GREEN}2. ${WORKFLOWS["offline_packaging"]}${NC}"
  echo
  echo -e "${BOLD}${GREEN}3. ${WORKFLOWS["offline_deployment"]}${NC}"
  echo
  echo -e "${BOLD}${GREEN}4. ${WORKFLOWS["standard"]}${NC}"
  echo
  echo -e "${BOLD}For detailed information about a script, run:${NC}"
  echo "./scripts/help.sh <script_name>"
  echo
  echo -e "${BOLD}For full documentation, see:${NC}"
  echo "  - README.md                 - Main documentation"
  echo "  - docs/OFFLINE-README.md    - Offline deployment guide"
  echo "  - docs/OFFLINE-CHECKLIST.md - Pre-flight checklist"
  echo "  - docs/INSTALLATION.md      - Installation guide"
}

# Main function
if [[ $# -eq 0 ]]; then
  list_all_scripts
else
  display_script_info "$1"
fi
