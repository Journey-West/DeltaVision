# DeltaVision Pre-built Packages

This directory should contain ready-to-use DeltaVision packages for immediate deployment in various environments, including air-gapped systems.

## Important Note About GitHub Size Limitations

GitHub has a file size limit of 100MB for standard repositories. The DeltaVision packages exceed this limit:
- `deltavision-docker-offline-1.0.0.zip` (~674MB)
- `deltavision-standalone-1.0.0.zip` (~182MB)

### How to Obtain the Packages

These packages can be built using the scripts in the repository:

```bash
# Create Docker/Podman offline package
./scripts/docker-package-offline.sh

# Create standalone package
./scripts/package-standalone.sh
```

### Alternative Distribution Methods

For teams that need to distribute these packages:

1. **Internal Artifact Repository**: Store the packages in an internal artifact repository like Nexus, Artifactory, or Azure DevOps Artifacts
2. **Self-hosted Git LFS**: Use Git Large File Storage on a self-hosted Git server
3. **Shared Network Drive**: Maintain the packages on a shared network location
4. **Release Assets**: Add these as release assets to GitHub Releases (with GitHub Enterprise)

## Package Descriptions

| Package | Description | Use Case |
|---------|-------------|----------|
| `deltavision-docker-offline-1.0.0.zip` | Complete Docker/Podman offline package | Air-gapped environments with Docker/Podman |
| `deltavision-standalone-1.0.0.zip` | Zero-installation standalone package | Highly-restricted environments with no installation rights |

## Usage Instructions

### Docker/Podman Offline Package

1. **Build or obtain the package**: `./scripts/docker-package-offline.sh`
2. **Transfer the package** to your air-gapped environment
3. **Extract the package**: `unzip deltavision-docker-offline-1.0.0.zip`
4. **Configure**: `cd deltavision-docker-offline-1.0.0 && ./configure-offline.sh`
5. **Start DeltaVision**: `./start-deltavision-offline.sh`

For detailed instructions, see `OFFLINE-README.md` inside the package.

### Standalone Package

1. **Build or obtain the package**: `./scripts/package-standalone.sh`
2. **Transfer the package** to your target system
3. **Extract the package**: `unzip deltavision-standalone-1.0.0.zip`
4. **Start DeltaVision**: `cd deltavision-standalone-1.0.0 && ./start-deltavision.sh /path/to/old/folder /path/to/new/folder`

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
