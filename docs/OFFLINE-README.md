# DeltaVision Offline Deployment Guide

This document provides comprehensive instructions for deploying and using DeltaVision in air-gapped (internetless) environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

## Prerequisites

To deploy DeltaVision in an offline environment, you need:

- A Docker-compatible container engine:
  - Docker Engine 19.03+ OR
  - Podman 3.0+ (with or without compose functionality)
- 100MB of disk space for the application (plus space for your data)
- Read/write permissions for the configured data directories
- A modern web browser (Chrome, Firefox, Edge, Safari)

## Installation Steps

Follow these steps to deploy DeltaVision in an offline environment:

### 1. Extract the Package

```bash
unzip deltavision-docker-offline-*.zip
cd deltavision-docker-offline-*
```

### 2. Run the Configuration Script

This interactive script will guide you through setting up your environment:

```bash
./scripts/configure-offline.sh
```

When prompted, provide:
- Path to your "old" folder (containing previous output files)
- Path to your "new" folder (containing current output files)
- Optional path to a keywords file for custom highlighting
- Optional custom port (default is 3000)

### 3. Verify Your Installation

Run the verification script to ensure all components are properly set up:

```bash
./scripts/verify-offline-package.sh
```

This will check for:
- Required files
- Correct permissions
- Container engine availability
- Configuration validity
- Image availability

### 4. Load the Container Image

```bash
# For Docker:
docker load -i deltavision-image.tar

# For Podman:
podman load -i deltavision-image.tar
```

### 5. Start DeltaVision

```bash
./start-deltavision-offline.sh
```

This script automatically detects your environment (Docker or Podman) and starts DeltaVision accordingly.

### 6. Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```
(or the custom port you specified during configuration)

## Verification

You can verify your installation at any time by running:

```bash
./scripts/verify-offline-package.sh
```

This script performs a comprehensive check of all components required for offline operation.

## Troubleshooting

### Container Engine Detection

If the start script is having trouble with your container engine:

```bash
# Set environment variable to enable debug output
export DEBUG=true
./start-deltavision-offline.sh
```

### Manual Container Start

If the automated scripts fail, you can try starting the container manually:

```bash
# For Docker:
docker run -d --name deltavision -p 3000:3000 \
  -v $(pwd)/folder-config.json:/app/folder-config.json \
  -v $(pwd)/keywords.txt:/app/keywords.txt \
  -v /path/to/your/old/folder:/app/data/old \
  -v /path/to/your/new/folder:/app/data/new \
  deltavision:1.0.0

# For Podman:
podman run -d --name deltavision -p 3000:3000 \
  -v $(pwd)/folder-config.json:/app/folder-config.json:Z \
  -v $(pwd)/keywords.txt:/app/keywords.txt:Z \
  -v /path/to/your/old/folder:/app/data/old:Z \
  -v /path/to/your/new/folder:/app/data/new:Z \
  localhost/deltavision:1.0.0
```

### Checking Container Status

```bash
# For Docker:
docker ps -a | grep deltavision
docker logs deltavision

# For Podman:
podman ps -a | grep deltavision
podman logs deltavision
```

## Common Issues

### "Image not found" error

If you see "Image not found" when starting:

1. Verify the image was loaded:
   ```bash
   # For Docker:
   docker images | grep deltavision
   
   # For Podman:
   podman images | grep deltavision
   ```

2. Load the image manually:
   ```bash
   # For Docker:
   docker load -i deltavision-image.tar
   
   # For Podman:
   podman load -i deltavision-image.tar
   ```

### Permission denied errors

If you encounter "permission denied" errors with volume mounts:

1. For Podman, try adding the `:Z` suffix to volume mounts:
   ```bash
   -v /path/to/folder:/app/data/folder:Z
   ```

2. Check the directory permissions:
   ```bash
   ls -la /path/to/your/old/folder
   ls -la /path/to/your/new/folder
   ```

### Container exits immediately

1. Check logs for errors:
   ```bash
   # For Docker:
   docker logs deltavision
   
   # For Podman:
   podman logs deltavision
   ```

2. Verify folder-config.json has valid paths:
   ```bash
   cat folder-config.json
   ```

3. Make sure the mounted directories exist and are accessible

### SELinux Issues

If you're using Podman with SELinux enabled:

```bash
# Check if SELinux is enforcing
getenforce

# If it shows "Enforcing", either:
# 1. Add :Z to volume mounts, or
# 2. Run this command to allow container access to the directories
chcon -R -t container_file_t /path/to/your/old/folder /path/to/your/new/folder
```

### Compose Functionality Not Available

If you see "Compose functionality not available" with Podman:

```bash
# Try using the direct container command approach instead
./start-deltavision-offline.sh
```

The script is designed to fall back to direct container commands when Compose is unavailable.
