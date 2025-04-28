#!/usr/bin/env bash

# start-deltavision.sh
# Usage: ./start-deltavision.sh <old_folder> <new_folder> [keywords_file]
# Simple helper to configure and launch DeltaVision.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <old_folder> <new_folder> [keywords_file]"
  exit 1
fi

OLD_DIR=$(realpath "$1")
NEW_DIR=$(realpath "$2")
KW_FILE=${3:-"keywords.txt"}
KW_FILE=$(realpath "$KW_FILE")

CONFIG_FILE="$(pwd)/folder-config.json"

cat > "$CONFIG_FILE" <<EOF
{
  "oldFolderPath": "$OLD_DIR",
  "newFolderPath": "$NEW_DIR",
  "keywordFilePath": "$KW_FILE"
}
EOF

echo "Configuration written to $CONFIG_FILE"
echo "Starting DeltaVision..."
npm start
