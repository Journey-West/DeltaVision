# DeltaVision Pre-built Packages

This directory contains ready-to-use DeltaVision packages for immediate deployment in various environments, including air-gapped systems. These packages are included in the Git repository for your convenience.

## Available Packages

| Package | Description | Use Case |
|---------|-------------|----------|
| `deltavision-docker-offline-1.0.0.zip` | Complete Docker/Podman offline package | Air-gapped environments with Docker/Podman |
| `deltavision-standalone-1.0.0.zip` | Zero-installation standalone package | Highly-restricted environments with no installation rights |

## Usage Instructions

### Docker/Podman Offline Package

1. **Transfer the package** to your air-gapped environment
2. **Extract the package**: `unzip deltavision-docker-offline-1.0.0.zip`
3. **Configure**: `cd deltavision-docker-offline-1.0.0 && ./configure-offline.sh`
4. **Start DeltaVision**: `./start-deltavision-offline.sh`

For detailed instructions, see `OFFLINE-README.md` inside the package.

### Standalone Package

1. **Transfer the package** to your target system
2. **Extract the package**: `unzip deltavision-standalone-1.0.0.zip`
3. **Start DeltaVision**: `cd deltavision-standalone-1.0.0 && ./start-deltavision.sh /path/to/old/folder /path/to/new/folder`

For detailed instructions, see `STANDALONE-README.md` inside the package.

## Updating Packages

When new versions of DeltaVision are released, these packages should be updated:

```bash
# Create Docker/Podman offline package
./scripts/docker-package-offline.sh

# Create standalone package
./scripts/package-standalone.sh

# Copy to precompiled/packages directory
cp scripts/deltavision-docker-offline-*.zip precompiled/packages/
cp scripts/deltavision-standalone-*.zip precompiled/packages/
```

## Benefits

Including these packages in the repository provides several advantages:

1. **Immediate Deployment**: Users can deploy without building packages
2. **Guaranteed Compatibility**: Pre-tested and verified packages
3. **Complete Air-Gap Support**: No internet needed at any stage
4. **Version Control**: Packages are versioned with the codebase
