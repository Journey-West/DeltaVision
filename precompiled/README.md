# DeltaVision Precompiled Binaries and Packages

This directory contains precompiled binaries and ready-to-use packages for DeltaVision, enabling deployment in highly-restricted and air-gapped environments.

## Structure

```
precompiled/
├── node/                # Node.js binaries for different platforms
│   ├── linux-x64/       # Linux 64-bit (most desktop/server Linux distributions)
│   ├── linux-arm64/     # Linux ARM 64-bit (Raspberry Pi, AWS Graviton, etc.)
│   ├── darwin-x64/      # macOS Intel 64-bit
│   ├── darwin-arm64/    # macOS Apple Silicon (M1/M2/M3)
│   └── win-x64/         # Windows 64-bit
├── packages/            # Ready-to-use DeltaVision packages
│   ├── deltavision-docker-offline-1.0.0.zip    # Docker/Podman offline package
│   └── deltavision-standalone-1.0.0.zip        # Zero-installation standalone package
└── README.md            # This file
```

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

The `packages/` directory contains ready-to-use DeltaVision packages for immediate deployment. These packages are included in the Git repository for convenience, allowing users to:

1. Clone the repository
2. Extract the appropriate package
3. Deploy immediately without building or downloading anything

See `packages/README.md` for detailed usage instructions.

## Benefits

Including precompiled binaries and packages offers several advantages:

1. **Faster Deployment**: No need to download or build anything
2. **Cross-Platform Support**: Works across different architectures
3. **Internet Independence**: Complete offline usage
4. **Version Control**: Consistent versioning across all components
5. **Zero Installation**: Deploy in highly-restricted environments

## Supported Platforms

- `linux-x64`: 64-bit Linux (Ubuntu, CentOS, Debian, Fedora, etc.)
- `linux-arm64`: 64-bit ARM Linux (Raspberry Pi 4, AWS Graviton, etc.)
- `darwin-x64`: macOS on Intel processors
- `darwin-arm64`: macOS on Apple Silicon (M1/M2/M3)
- `win-x64`: 64-bit Windows
