# DeltaVision Precompiled Binaries and Packages

This directory contains precompiled binaries and information about ready-to-use packages for DeltaVision, enabling deployment in highly-restricted and air-gapped environments.

## Structure

```
precompiled/
├── node/                # Node.js binaries for different platforms
│   ├── linux-x64/       # Linux 64-bit (most desktop/server Linux distributions)
│   ├── linux-arm64/     # Linux ARM 64-bit (Raspberry Pi, AWS Graviton, etc.)
│   ├── darwin-x64/      # macOS Intel 64-bit
│   ├── darwin-arm64/    # macOS Apple Silicon (M1/M2/M3)
│   └── win-x64/         # Windows 64-bit
├── packages/            # Information about ready-to-use DeltaVision packages
│   └── README.md        # Instructions for building and distributing packages
└── README.md            # This file
```

## GitHub File Size Limitations

GitHub has file size limits that affect the DeltaVision packages:
- 100MB hard limit for individual files
- 50MB soft limit (warning) for large files

The Node.js binaries are included directly in the repository as they're under the 100MB limit, but the deployment packages exceed this limit and must be built locally. See `packages/README.md` for details.

## Precompiled Node.js Binaries

### Usage

The precompiled binaries are automatically used by the `package-standalone.sh` script when creating standalone packages. If a precompiled binary is available for the target platform, it will be used instead of downloading one.

### Populating Precompiled Binaries

To populate this directory with Node.js binaries for all supported platforms:

```bash
./scripts/prepare-precompiled-binaries.sh
```

This script will download and extract Node.js binaries for all supported platforms, making them available for standalone packaging.

### Adding a Custom Binary

If you need to add a binary for a platform not included by default:

1. Create a directory for your platform: `mkdir -p precompiled/node/your-platform`
2. Download the appropriate Node.js binary from https://nodejs.org/dist/
3. Extract the `node` executable and place it in the platform directory
4. Make the binary executable: `chmod +x precompiled/node/your-platform/node`

## Pre-built Packages

The `packages/` directory contains information about the available DeltaVision package types and instructions for building them. Due to GitHub's file size limitations, the packages themselves must be built locally using the included scripts.

See `packages/README.md` for detailed build and usage instructions.

## Benefits

Including precompiled binaries and package instructions offers several advantages:

1. **Faster Deployment**: No need to download Node.js binaries
2. **Cross-Platform Support**: Works across different architectures
3. **Internet Independence**: Minimizes external dependencies
4. **Version Control**: Consistent versioning across all components
5. **Zero Installation**: Deploy in highly-restricted environments

## Supported Platforms

- `linux-x64`: 64-bit Linux (Ubuntu, CentOS, Debian, Fedora, etc.)
- `linux-arm64`: 64-bit ARM Linux (Raspberry Pi 4, AWS Graviton, etc.)
- `darwin-x64`: macOS on Intel processors
- `darwin-arm64`: macOS on Apple Silicon (M1/M2/M3)
- `win-x64`: 64-bit Windows
