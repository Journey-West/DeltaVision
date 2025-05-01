# Precompiled Node.js Binaries

This directory contains precompiled Node.js binaries for various platforms.
These binaries are used by the standalone packaging script to create self-contained 
DeltaVision packages that require no installation.

## Available Platforms

- `linux-x64`: Linux 64-bit (most desktop/server Linux distributions)
- `linux-arm64`: Linux ARM 64-bit (Raspberry Pi 4, AWS Graviton, etc.)
- `darwin-x64`: macOS Intel 64-bit
- `darwin-arm64`: macOS Apple Silicon (M1/M2/M3)
- `win-x64`: Windows 64-bit

## Adding New Platforms

To add support for additional platforms:

1. Create a new directory for the platform
2. Download the appropriate Node.js binary
3. Extract the binary and place it in the platform directory
4. Make sure the binary is executable

## Updating Node.js Version

To update the Node.js version for all platforms:

```bash
./scripts/prepare-precompiled-binaries.sh [new_version]
```

For example:

```bash
./scripts/prepare-precompiled-binaries.sh 20.0.0
```

## Manual Preparation

If you need to manually prepare a binary:

1. Download the appropriate Node.js binary from https://nodejs.org/dist/
2. Extract the binary
3. Copy the `node` executable to the appropriate platform directory
4. Make the binary executable: `chmod +x node`
