# DeltaVision Installation Guide

This guide covers all deployment options for DeltaVision, from containerized deployments to zero-installation standalone options.

## Table of Contents

- [Deployment Options Overview](#deployment-options-overview)
- [Option 1: Docker/Podman Deployment (Recommended)](#option-1-dockerpodman-deployment-recommended)
- [Option 2: Non-containerized Deployment](#option-2-non-containerized-deployment)
- [Option 3: Offline/Air-gapped Containerized Deployment](#option-3-offlineair-gapped-containerized-deployment)
- [Option 4: Standalone Deployment (No Installation Required)](#option-4-standalone-deployment-no-installation-required)
- [Troubleshooting](#troubleshooting)
- [System Requirements](#system-requirements)

## Deployment Options Overview

DeltaVision offers multiple deployment options to fit virtually any environment:

| Deployment Option | Best For | Requirements | Complexity |
|-------------------|----------|--------------|------------|
| **Docker/Podman** | Standard environments | Docker or Podman | Easy |
| **Non-containerized** | Development, testing | Node.js & npm | Medium |
| **Offline Containerized** | Air-gapped with containers | Docker/Podman (no internet) | Medium |
| **Standalone** | Highly-restricted environments | None | Simple |

## Option 1: Docker/Podman Deployment (Recommended)

This is the recommended approach for most users, providing the most isolated and reproducible environment.

### Prerequisites
- Docker or Podman installed

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. **Configure volumes**:
   
   Edit `docker/docker-compose.yml` to specify your data directories:
   ```yaml
   volumes:
     - /path/to/your/old/folder:/app/data/old
     - /path/to/your/new/folder:/app/data/new
     - ./keywords.txt:/app/keywords.txt
   ```

3. **Start with Docker Compose**:
   ```bash
   cd docker
   docker-compose up -d
   ```

   Or with Podman:
   ```bash
   cd docker
   podman-compose up -d
   # OR
   podman compose up -d  # For newer Podman versions
   ```

4. **Access DeltaVision**:
   ```
   http://localhost:3000
   ```

5. **Stop the container** when done:
   ```bash
   docker-compose down
   # OR
   podman-compose down
   ```

### Using Docker/Podman Directly

If you prefer not to use Compose:

```bash
# With Docker
docker build -t deltavision -f docker/Dockerfile .
docker run -p 3000:3000 \
  -v /path/to/your/old/folder:/app/data/old \
  -v /path/to/your/new/folder:/app/data/new \
  -v $(pwd)/keywords.txt:/app/keywords.txt \
  deltavision

# With Podman
podman build -t deltavision -f docker/Dockerfile .
podman run -p 3000:3000 \
  -v /path/to/your/old/folder:/app/data/old \
  -v /path/to/your/new/folder:/app/data/new \
  -v $(pwd)/keywords.txt:/app/keywords.txt \
  deltavision
```

## Option 2: Non-containerized Deployment

For environments where Docker/Podman is unavailable but Node.js can be installed.

### Prerequisites
- Node.js 14.x or higher
- npm 6.x or higher

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start DeltaVision**:
   ```bash
   ./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
   ```

4. **Access DeltaVision**:
   ```
   http://localhost:3000
   ```

## Option 3: Offline/Air-gapped Containerized Deployment

For environments without internet access but where Docker/Podman is available.

### Step 1: Package Creation (On Internet-Connected System)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. **Create the offline package**:
   ```bash
   ./scripts/docker-package-offline.sh
   ```

3. **Transfer the package**:
   
   Transfer the generated `deltavision-docker-offline-1.0.0.zip` file to the air-gapped system.

### Step 2: Deployment (On Air-Gapped System)

1. **Extract the package**:
   ```bash
   unzip deltavision-docker-offline-1.0.0.zip
   cd deltavision-docker-offline-1.0.0
   ```

2. **Verify the package integrity**:
   ```bash
   ./scripts/test-offline-setup.sh
   ./scripts/verify-offline-dependencies.sh
   ```

3. **Configure the deployment**:
   ```bash
   ./scripts/configure-offline.sh
   ```
   Follow the interactive prompts to set up your directories.

4. **Run pre-flight checks**:
   ```bash
   ./scripts/preflight-check.sh
   ```

5. **Start DeltaVision**:
   ```bash
   ./start-deltavision-offline.sh
   ```

6. **Access DeltaVision**:
   ```
   http://localhost:3000
   ```

## Option 4: Standalone Deployment (No Installation Required)

For highly-restricted environments where nothing can be installed. This option requires zero installation and works out of the box with a self-contained Node.js binary.

### Step 1: Package Creation (On Internet-Connected System)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/deltavision.git
   cd deltavision
   ```

2. **Prepare precompiled Node.js binaries** (optional, but recommended for multi-platform support):
   ```bash
   ./scripts/prepare-precompiled-binaries.sh
   ```
   This downloads Node.js binaries for all supported platforms (Linux, macOS, Windows) and architectures.

3. **Create the standalone package**:
   ```bash
   ./scripts/package-standalone.sh
   ```
   This creates a self-contained package that automatically uses the appropriate precompiled binary.

4. **Transfer the package**:
   
   Transfer the generated `deltavision-standalone-1.0.0.zip` file to the target system.

### Step 2: Deployment (On Target System)

1. **Extract the package**:
   ```bash
   unzip deltavision-standalone-1.0.0.zip
   cd deltavision-standalone-1.0.0
   ```

2. **Verify the package integrity**:
   ```bash
   ./scripts/verify-standalone.sh
   ```

3. **Start DeltaVision**:
   ```bash
   ./start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
   ```

4. **Access DeltaVision**:
   ```
   http://localhost:3000
   ```

## Troubleshooting

### Docker/Podman Issues

- **Container won't start**:
  - Check if port 3000 is already in use
  - Verify volume mount paths exist
  - Check for SELinux issues with volume mounts

- **Permission errors**:
  - Ensure your user has permissions to access the mounted directories
  - For SELinux systems, try adding `:Z` to volume mounts

### Non-containerized Issues

- **Node.js version errors**:
  - Ensure you're using Node.js 14.x or higher
  - Run `node --version` to check

- **Missing dependencies**:
  - Run `npm install` to install required packages

### Offline Deployment Issues

- **Image loading errors**:
  - Verify the image was properly extracted: `docker images` or `podman images`
  - Try loading the image manually: `docker load -i deltavision-image.tar`

- **Missing files**:
  - Run `./scripts/verify-offline-dependencies.sh` to check for required files
  - Re-extract the package if necessary

### Standalone Deployment Issues

- **Binary won't execute**:
  - Ensure execute permissions: `chmod +x node/node`
  - Verify architecture compatibility with `file node/node`

- **Node.js errors**:
  - Run `./scripts/verify-standalone.sh` to check binary integrity
  - Check for specific error messages

## System Requirements

### Docker/Podman Deployment
- Docker 19+ or Podman 3+
- 2GB RAM
- 500MB disk space

### Non-containerized Deployment
- Node.js 14.x or higher
- npm 6.x or higher
- 2GB RAM
- 500MB disk space

### Offline Containerized Deployment
- Docker 19+ or Podman 3+
- 2GB RAM
- 500MB disk space
- No internet connection required

### Standalone Deployment
- Basic Linux, macOS, or Windows system
- 2GB RAM
- 500MB disk space
- No installation rights or internet required
- Supports multiple architectures:
  - Linux x64
  - Linux ARM64 (Raspberry Pi, AWS Graviton)
  - macOS Intel x64
  - macOS Apple Silicon
  - Windows x64

## Next Steps

See the [User Guide](./USER-GUIDE.md) for instructions on using DeltaVision after installation.
