#!/usr/bin/env bash
# diagnostic-logger.sh
# Provides a robust logging system for DeltaVision in offline/air-gapped environments
# Usage: source /path/to/diagnostic-logger.sh

# Create logs directory if it doesn't exist
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "$LOG_DIR"

# Timestamp for this log session
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${LOG_DIR}/deltavision-${TIMESTAMP}.log"
DEBUG_LOG_FILE="${LOG_DIR}/deltavision-debug-${TIMESTAMP}.log"

# Maximum number of log files to keep
MAX_LOG_FILES=10

# Create the log files with headers
cat > "$LOG_FILE" << EOF
=================================================
DeltaVision Log - Started at $(date)
System: $(uname -a)
=================================================
EOF

cat > "$DEBUG_LOG_FILE" << EOF
=================================================
DeltaVision Debug Log - Started at $(date)
System: $(uname -a)
=================================================
EOF

# Color definitions for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Icons for different log types
ERROR_ICON="✖"
WARNING_ICON="⚠"
INFO_ICON="ℹ"
SUCCESS_ICON="✓"
DEBUG_ICON="🔍"
SYSTEM_ICON="🖥"
DATABASE_ICON="🗃"
NETWORK_ICON="🌐"
USER_ICON="👤"

# Logging levels
LOG_LEVEL_ERROR=0
LOG_LEVEL_WARNING=1
LOG_LEVEL_INFO=2
LOG_LEVEL_DEBUG=3
LOG_LEVEL_TRACE=4

# Default logging level
current_log_level=$LOG_LEVEL_INFO

# Allow overriding from environment variables
if [ -n "$DELTAVISION_LOG_LEVEL" ]; then
  case "$DELTAVISION_LOG_LEVEL" in
    "error") current_log_level=$LOG_LEVEL_ERROR ;;
    "warning") current_log_level=$LOG_LEVEL_WARNING ;;
    "info") current_log_level=$LOG_LEVEL_INFO ;;
    "debug") current_log_level=$LOG_LEVEL_DEBUG ;;
    "trace") current_log_level=$LOG_LEVEL_TRACE ;;
    *) echo "Unknown log level: $DELTAVISION_LOG_LEVEL, using default (info)" ;;
  esac
fi

# Function to get current timestamp
get_timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Function to write to log file
write_to_log() {
  log_level=$1
  log_type=$2
  message=$3
  timestamp=$(get_timestamp)
  
  # Always write to log file regardless of log level
  echo "[$timestamp] [$log_type] $message" >> "$LOG_FILE"
  
  # Write to debug log with extra context
  caller_info=$(caller 1)
  echo "[$timestamp] [$log_type] $message (${caller_info})" >> "$DEBUG_LOG_FILE"
}

# Function to clean up old log files
cleanup_logs() {
  # Count number of log files
  log_count=$(find "$LOG_DIR" -name "deltavision-*.log" | wc -l)
  
  # If more than MAX_LOG_FILES, delete the oldest ones
  if [ "$log_count" -gt "$MAX_LOG_FILES" ]; then
    ls -t "$LOG_DIR"/deltavision-*.log | tail -n +$(($MAX_LOG_FILES + 1)) | xargs rm -f
  fi
  
  # Also clean up debug logs
  debug_log_count=$(find "$LOG_DIR" -name "deltavision-debug-*.log" | wc -l)
  if [ "$debug_log_count" -gt "$MAX_LOG_FILES" ]; then
    ls -t "$LOG_DIR"/deltavision-debug-*.log | tail -n +$(($MAX_LOG_FILES + 1)) | xargs rm -f
  fi
}

# Main logging functions
log_error() {
  if [ $current_log_level -ge $LOG_LEVEL_ERROR ]; then
    write_to_log "ERROR" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${RED}${ERROR_ICON} ERROR${NC} [${1:-GENERAL}]: ${2:-No message provided}" >&2
  fi
}

log_warning() {
  if [ $current_log_level -ge $LOG_LEVEL_WARNING ]; then
    write_to_log "WARNING" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${YELLOW}${WARNING_ICON} WARNING${NC} [${1:-GENERAL}]: ${2:-No message provided}" >&2
  fi
}

log_info() {
  if [ $current_log_level -ge $LOG_LEVEL_INFO ]; then
    write_to_log "INFO" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${BLUE}${INFO_ICON} INFO${NC} [${1:-GENERAL}]: ${2:-No message provided}"
  fi
}

log_success() {
  if [ $current_log_level -ge $LOG_LEVEL_INFO ]; then
    write_to_log "SUCCESS" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${GREEN}${SUCCESS_ICON} SUCCESS${NC} [${1:-GENERAL}]: ${2:-No message provided}"
  fi
}

log_debug() {
  if [ $current_log_level -ge $LOG_LEVEL_DEBUG ]; then
    write_to_log "DEBUG" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${GRAY}${DEBUG_ICON} DEBUG${NC} [${1:-GENERAL}]: ${2:-No message provided}"
  fi
}

log_trace() {
  if [ $current_log_level -ge $LOG_LEVEL_TRACE ]; then
    write_to_log "TRACE" "${1:-GENERAL}" "${2:-No message provided}"
    echo -e "${PURPLE}${DEBUG_ICON} TRACE${NC} [${1:-GENERAL}]: ${2:-No message provided}"
  fi
}

# Specialized logging functions
log_system() {
  log_info "SYSTEM" "$1"
}

log_network() {
  log_info "NETWORK" "$1"
}

log_user() {
  log_info "USER" "$1"
}

log_database() {
  log_info "DATABASE" "$1"
}

# Function to set log level
set_log_level() {
  case "$1" in
    "error") current_log_level=$LOG_LEVEL_ERROR ;;
    "warning") current_log_level=$LOG_LEVEL_WARNING ;;
    "info") current_log_level=$LOG_LEVEL_INFO ;;
    "debug") current_log_level=$LOG_LEVEL_DEBUG ;;
    "trace") current_log_level=$LOG_LEVEL_TRACE ;;
    *) log_warning "CONFIG" "Unknown log level: $1, using current ($current_log_level)" ;;
  esac
  
  log_debug "CONFIG" "Log level set to: $1 ($current_log_level)"
}

# Function to log environment information
log_environment() {
  log_system "=================== ENVIRONMENT INFO ==================="
  log_system "Hostname: $(hostname)"
  log_system "OS: $(uname -s)"
  log_system "Kernel: $(uname -r)"
  log_system "Architecture: $(uname -m)"
  
  # Log container engine information
  if command -v docker &> /dev/null; then
    log_system "Docker version: $(docker --version)"
  elif command -v podman &> /dev/null; then
    log_system "Podman version: $(podman --version)"
  else
    log_warning "SYSTEM" "No container engine (Docker/Podman) found"
  fi
  
  # Log Node.js version if available
  if command -v node &> /dev/null; then
    log_system "Node.js version: $(node --version)"
    log_system "NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"
  else
    log_warning "SYSTEM" "Node.js not found"
  fi
  
  # Log disk space
  log_system "Disk space: $(df -h . | awk 'NR==2 {print $4}') available"
  
  # Log memory information
  if command -v free &> /dev/null; then
    log_system "Memory: $(free -h | awk '/^Mem:/ {print $7}') available"
  fi
  
  log_system "======================================================="
}

# Function to log file paths
log_file_paths() {
  log_debug "CONFIG" "Project root: $PROJECT_ROOT"
  log_debug "CONFIG" "Log directory: $LOG_DIR"
  log_debug "CONFIG" "Log file: $LOG_FILE"
  log_debug "CONFIG" "Debug log file: $DEBUG_LOG_FILE"
}

# Function to view the log file
view_log() {
  if [ -f "$LOG_FILE" ]; then
    less "$LOG_FILE"
  else
    echo "Log file not found: $LOG_FILE"
  fi
}

# Function to view the debug log file
view_debug_log() {
  if [ -f "$DEBUG_LOG_FILE" ]; then
    less "$DEBUG_LOG_FILE"
  else
    echo "Debug log file not found: $DEBUG_LOG_FILE"
  fi
}

# Run cleanup to ensure we don't accumulate too many logs
cleanup_logs

# Log initial startup information
log_info "LOGGER" "Diagnostic logging initialized"
log_debug "LOGGER" "Log level: $current_log_level"
log_file_paths

# Support importing this as a library in other scripts
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  # Script is being run directly, not sourced
  log_environment
  echo "DeltaVision Diagnostic Logger"
  echo "============================"
  echo "Log file: $LOG_FILE"
  echo "Debug log file: $DEBUG_LOG_FILE"
  echo ""
  echo "Usage:"
  echo "  source $(basename "$0")"
  echo "  log_info CATEGORY \"Your message here\""
  echo ""
  echo "Log levels (current: $current_log_level):"
  echo "  $LOG_LEVEL_ERROR: ERROR"
  echo "  $LOG_LEVEL_WARNING: WARNING"
  echo "  $LOG_LEVEL_INFO: INFO"
  echo "  $LOG_LEVEL_DEBUG: DEBUG"
  echo "  $LOG_LEVEL_TRACE: TRACE"
  echo ""
  echo "Set log level: set_log_level info"
fi
