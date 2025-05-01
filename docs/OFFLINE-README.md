# DeltaVision Offline Deployment Guide

This document provides comprehensive instructions for deploying and using DeltaVision in air-gapped (internetless) environments. DeltaVision offers two approaches for offline deployment, each designed for different levels of restrictions.

## Table of Contents

- [Offline Deployment Options](#offline-deployment-options)
- [Option 1: Containerized Offline Deployment](#option-1-containerized-offline-deployment)
- [Option 2: Standalone Offline Deployment](#option-2-standalone-offline-deployment)
- [Verification Tools](#verification-tools)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Offline Deployment Options

DeltaVision provides two distinct approaches for offline/air-gapped environments:

| Deployment Option | Best For | Requirements | Advantages |
|-------------------|----------|--------------|------------|
| **Containerized** | Air-gapped systems with Docker/Podman | Docker or Podman installed | Isolation, consistent environment |
| **Standalone** | Highly-restricted environments | None (zero installation) | Works anywhere, no prerequisites |

### Choosing the Right Option:

- **Containerized Offline Deployment**: Choose this when Docker or Podman is available on your air-gapped system. This provides better isolation and a consistent runtime environment.

- **Standalone Offline Deployment**: Choose this when you cannot install anything (Docker, Podman, or Node.js) on the target system. This option includes a statically-compiled Node.js binary and requires zero installation.

## Option 1: Containerized Offline Deployment

### Step 1: Package Creation (On Internet-Connected System)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/deltavision.git
   cd deltavision
   ```

2. **Create the offline package**:
   ```bash
   ./scripts/docker-package-offline.sh
   ```
   This creates `deltavision-docker-offline-1.0.0.zip` containing everything needed for offline deployment.

3. **Transfer the package**:
   Transfer this ZIP file to your air-gapped system using approved methods (USB drive, approved file transfer, etc.).

### Step 2: Deployment (On Air-Gapped System)

1. **Extract the package**:
   ```bash
   unzip deltavision-docker-offline-1.0.0.zip
   cd deltavision-docker-offline-1.0.0
   ```

2. **Verify package integrity**:
   ```bash
   ./scripts/test-offline-setup.sh
   ```
   This ensures all required files are present and correctly organized.

3. **Verify dependencies**:
   ```bash
   ./scripts/verify-offline-dependencies.sh
   ```
   This checks that all required components are available in the offline environment.

4. **Configure the deployment**:
   ```bash
   ./scripts/configure-offline.sh
   ```
   Follow the interactive prompts to set up your directory paths and configuration.

5. **Run pre-flight checks**:
   ```bash
   ./scripts/preflight-check.sh
   ```
   This checks system resources, port availability, and permissions.

6. **Start DeltaVision**:
   ```bash
   ./start-deltavision-offline.sh
   ```
   If Compose is available, it will be used; otherwise, direct container commands will be used.

7. **Access DeltaVision**:
   Open your browser and navigate to http://localhost:3000

### Container Engine Detection

The offline scripts automatically detect and adapt to the available container engine:

- Docker with Docker Compose
- Docker without Compose
- Podman with podman-compose
- Podman with the built-in 'podman compose' subcommand
- Podman without Compose

Each scenario has appropriate fallback mechanisms to ensure DeltaVision will run regardless of the specific container setup.

## Option 2: Standalone Offline Deployment

This option requires absolutely no installation on the target system, not even Docker or Node.js.

### Step 1: Package Creation (On Internet-Connected System)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/deltavision.git
   cd deltavision
   ```

2. **Create the standalone package**:
   ```bash
   ./scripts/package-standalone.sh
   ```
   This creates `deltavision-standalone-1.0.0.zip` containing a complete, self-contained DeltaVision deployment.

3. **Transfer the package**:
   Transfer this ZIP file to your target system using approved methods.

### Step 2: Deployment (On Target System)

1. **Extract the package**:
   ```bash
   unzip deltavision-standalone-1.0.0.zip
   cd deltavision-standalone-1.0.0
   ```

2. **Verify package integrity**:
   ```bash
   ./scripts/verify-standalone.sh
   ```
   This checks that all components are present and working.

3. **Start DeltaVision**:
   ```bash
   ./start-deltavision.sh /path/to/old/folder /path/to/new/folder [keywords.txt]
   ```
   This uses the included Node.js binary to run DeltaVision without any external dependencies.

4. **Access DeltaVision**:
   Open your browser and navigate to http://localhost:3000

## Verification Tools

DeltaVision includes several tools to verify and troubleshoot offline deployments:

### For Containerized Deployment

- **test-offline-setup.sh**: Verifies file structure and organization
- **verify-offline-dependencies.sh**: Checks all required dependencies
- **preflight-check.sh**: Performs system resource validation
- **diagnostic-logger.sh**: Provides structured logging capabilities

### For Standalone Deployment

- **verify-standalone.sh**: Checks the Node.js binary and application files
- **help.sh**: Displays comprehensive help information

## Troubleshooting

### Common Issues in Containerized Deployment

1. **Container startup issues**:
   - Check container logs: `docker logs deltavision` or `podman logs deltavision`
   - Verify the image was loaded: `docker images` or `podman images`
   - Try loading the image manually: `docker load -i deltavision-image.tar`

2. **Volume mount problems**:
   - Ensure paths specified during configuration exist
   - Check permissions on the host directories
   - On SELinux systems, use the `:Z` suffix for volume mounts

3. **Port conflicts**:
   - Check if port 3000 is in use: `netstat -tuln | grep 3000`
   - Change the port in docker-compose.offline.yml if needed

### Common Issues in Standalone Deployment

1. **Node.js binary issues**:
   - Ensure the binary is executable: `chmod +x node/node`
   - Verify architecture compatibility: `file node/node`

2. **Permission problems**:
   - Make scripts executable: `chmod +x scripts/*.sh`
   - Make the main script executable: `chmod +x start-deltavision.sh`

3. **Configuration errors**:
   - Verify the paths to old/new folders exist
   - Check the folder-config.json file for correct paths

### Using Debug Mode

Both deployment methods support debug mode for detailed logging:

```bash
# Containerized mode
DEBUG=true ./start-deltavision-offline.sh

# Standalone mode
DEBUG=true ./start-deltavision.sh /path/to/old /path/to/new
```

## Advanced Configuration

### Custom Port Configuration

To use a port other than 3000:

#### For Containerized Deployment:
Edit `docker-compose.offline.yml` and change the port mapping:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

#### For Standalone Deployment:
Set the PORT environment variable:
```bash
PORT=8080 ./start-deltavision.sh /path/to/old /path/to/new
```

### Custom Keyword Highlighting

Create a keywords file with one keyword per line:
```
TODO:red
FIXME:orange
WARNING:yellow
```

Then specify this file when starting DeltaVision:
```bash
# Containerized mode
# (Edit docker-compose.offline.yml to mount your keywords file)

# Standalone mode
./start-deltavision.sh /path/to/old /path/to/new /path/to/keywords.txt
```

## Security Considerations

DeltaVision is designed to be secure in offline environments:

1. **No External Connections**: The application never attempts to connect to external services
2. **No Data Collection**: No usage data is collected or transmitted
3. **File System Isolation**: When using containers, the application only accesses mounted volumes
4. **Read-Only Access**: Files are accessed in read-only mode; no modifications are made to your data
