# DeltaVision Installation Guide

This document provides detailed installation instructions for DeltaVision.

## Table of Contents
- [Docker Installation (Recommended)](#docker-installation-recommended)
- [Standard Installation (Alternative)](#standard-installation-alternative)
- [Offline Installation](#offline-installation)
- [System Requirements](#system-requirements)

## Docker Installation (Recommended)

Docker is the recommended way to run DeltaVision as it provides a consistent environment across different systems.

### Prerequisites
- Docker Engine (19.03 or newer)
- Docker Compose (1.25.0 or newer)

### Docker Permissions
Ensure your user is part of the docker group to run Docker commands without sudo:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Then log out and back in, or run this to apply changes to current session
newgrp docker
```

### Installation Steps

1. **Configure docker-compose.yml**:
   Edit `docker/docker-compose.yml` to specify your data directories:

   ```yaml
   volumes:
     - /path/to/your/old/folder:/app/data/old
     - /path/to/your/new/folder:/app/data/new
     - ./keywords.txt:/app/keywords.txt
     - ./folder-config.json:/app/folder-config.json
   ```

2. **Update folder-config.json**:
   ```json
   {
     "oldFolderPath": "/app/data/old",
     "newFolderPath": "/app/data/new",
     "keywordFilePath": "/app/keywords.txt"
   }
   ```

3. **Build and start the container**:
   ```bash
   cd docker
   docker-compose up -d
   ```

4. **Access DeltaVision**:
   Open your browser and navigate to http://localhost:3000

## Standard Installation (Alternative)

If you prefer not to use Docker, you can install DeltaVision directly on your system.

### Prerequisites
- Node.js 14.x or higher
- npm 6.x or higher

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run using the helper script**:
   ```bash
   chmod +x scripts/start-deltavision.sh
   ./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
   ```

4. **Access DeltaVision**:
   Open your browser and navigate to http://localhost:3000

## Offline Installation

For air-gapped environments where internet access is not available, DeltaVision provides an offline installation package.

### Creating the Offline Package

On a system with internet access:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Journey-West/DeltaVision.git
   cd DeltaVision
   ```

2. **Create the offline package**:
   ```bash
   chmod +x scripts/docker-package-offline.sh
   ./scripts/docker-package-offline.sh [version]
   ```

3. **Transfer the package**:
   Transfer the generated ZIP file (`deltavision-docker-offline-x.x.x.zip`) to your air-gapped system.

### Installing from the Offline Package

On the air-gapped system:

1. **Extract the package**:
   ```bash
   unzip deltavision-docker-offline-x.x.x.zip
   cd deltavision-docker-offline-x.x.x
   ```

2. **Run the configuration script**:
   ```bash
   ./scripts/configure-offline.sh
   ```

3. **Load the Docker image**:
   ```bash
   docker load -i deltavision-image.tar
   ```

4. **Start DeltaVision**:
   ```bash
   docker-compose -f docker-compose.offline.yml up -d
   ```

5. **Access DeltaVision**:
   Open your browser and navigate to http://localhost:3000 (or the custom port you specified)

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **Memory**: 512MB RAM
- **Disk Space**: 100MB plus space for your data directories
- **Network**: For Docker deployment, no internet access is required after initial setup

### Recommended
- **CPU**: 4 cores
- **Memory**: 1GB+ RAM
- **Disk Space**: 1GB+ depending on the size of your data
- **Browser**: Chrome, Firefox, Edge, or Safari (latest versions)
