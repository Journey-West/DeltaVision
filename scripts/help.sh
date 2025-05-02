#!/usr/bin/env bash

# help.sh
# Provides help information for all DeltaVision scripts
#
# Usage: ./scripts/help.sh [script_name]
#

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Define script descriptions and usage
declare -A SCRIPT_INFO
SCRIPT_INFO["start-deltavision.sh"]="Starts DeltaVision in standalone mode."
SCRIPT_INFO["package-standalone.sh"]="Creates a self-contained package for deployment in restricted environments."
SCRIPT_INFO["verify-standalone.sh"]="Verifies the integrity of a standalone package."
SCRIPT_INFO["help.sh"]="Displays this help information."

declare -A SCRIPT_USAGE
SCRIPT_USAGE["start-deltavision.sh"]="./scripts/start-deltavision.sh <old_folder> <new_folder> [keywords_file]"
SCRIPT_USAGE["package-standalone.sh"]="./scripts/package-standalone.sh [version]"
SCRIPT_USAGE["verify-standalone.sh"]="./scripts/verify-standalone.sh"
SCRIPT_USAGE["help.sh"]="./scripts/help.sh [script_name]"

declare -A SCRIPT_EXAMPLES
SCRIPT_EXAMPLES["start-deltavision.sh"]="# Compare two directories:
./scripts/start-deltavision.sh /path/to/old/folder /path/to/new/folder

# Compare with custom keywords file:
./scripts/start-deltavision.sh /path/to/old/folder /path/to/new/folder /path/to/keywords.txt"

SCRIPT_EXAMPLES["package-standalone.sh"]="# Create a standalone package with default version (1.0.0):
./scripts/package-standalone.sh

# Create a standalone package with custom version:
./scripts/package-standalone.sh 2.1.0"

SCRIPT_EXAMPLES["verify-standalone.sh"]="# Verify the integrity of a standalone package:
./scripts/verify-standalone.sh"

SCRIPT_EXAMPLES["help.sh"]="# Show help for all scripts:
./scripts/help.sh

# Show help for a specific script:
./scripts/help.sh start-deltavision.sh"

# Define common workflows
declare -A WORKFLOWS
WORKFLOWS["standard"]="Traditional deployment (standalone mode):

1. Install dependencies:
   npm install

2. Start DeltaVision:
   ./scripts/start-deltavision.sh /path/to/old/folder /path/to/new/folder

3. Access the web interface:
   http://localhost:3000"

WORKFLOWS["restricted"]="Deployment in restricted environments:

1. Create standalone package:
   ./scripts/package-standalone.sh

2. Transfer the package to the target system
   
3. Extract the package:
   unzip deltavision-standalone-1.0.0.zip
   
4. Start DeltaVision:
   cd deltavision-standalone-1.0.0
   ./start-deltavision.sh /path/to/old/folder /path/to/new/folder"

# Show help for a specific script
show_script_help() {
  local script=$1
  
  if [ -z "${SCRIPT_INFO[$script]}" ]; then
    error "Unknown script: $script"
    echo "Run ./scripts/help.sh to see a list of available scripts."
    return 1
  fi
  
  echo
  echo -e "${CYAN}=== ${script} ===${NC}"
  echo
  echo "${SCRIPT_INFO[$script]}"
  echo
  echo -e "${YELLOW}Usage:${NC}"
  echo "${SCRIPT_USAGE[$script]}"
  echo
  
  if [ -n "${SCRIPT_EXAMPLES[$script]}" ]; then
    echo -e "${YELLOW}Examples:${NC}"
    echo "${SCRIPT_EXAMPLES[$script]}"
    echo
  fi
  
  return 0
}

# List all available scripts
list_all_scripts() {
  echo -e "${CYAN}Available DeltaVision Scripts:${NC}"
  echo
  
  for script in package-standalone.sh start-deltavision.sh \
               verify-standalone.sh preflight-check.sh help.sh; do
    if [ -n "${SCRIPT_INFO[$script]}" ]; then
      echo -e "${YELLOW}${script}${NC}: ${SCRIPT_INFO[$script]}"
    fi
  done
  
  echo
  echo "For detailed help on a specific script, run: ./scripts/help.sh <script_name>"
  echo
}

# Show common workflows
show_workflows() {
  echo -e "${CYAN}Common Workflows:${NC}"
  echo
  
  for key in "${!WORKFLOWS[@]}"; do
    echo -e "${YELLOW}${key}${NC}:"
    echo "${WORKFLOWS[$key]}"
    echo
  done
}

# Main execution
if [ "$#" -eq 0 ]; then
  echo
  echo -e "${CYAN}DeltaVision Help System${NC}"
  echo
  info "DeltaVision is a tool for visualizing differences between files in two separate directories."
  echo
  
  list_all_scripts
  show_workflows
  
  echo -e "${CYAN}For more information, see the README.md file.${NC}"
  echo
elif [ "$#" -eq 1 ]; then
  show_script_help "$1"
else
  error "Too many arguments"
  echo "Usage: ./scripts/help.sh [script_name]"
  exit 1
fi

exit 0
