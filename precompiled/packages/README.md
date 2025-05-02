# DeltaVision Precompiled Packages

This directory contains or is used to store precompiled packages for easier deployment in various environments.

## Available Packages

- `deltavision-standalone-1.0.0.zip` (~550MB)

## Creating Packages

These packages can be created using the packaging scripts in the `scripts/` directory:

```bash
# Create standalone package
./scripts/package-standalone.sh
```

## Package Storage

Due to GitHub's file size limitations, precompiled packages may not be included directly in the repository. Instead, they are created on-demand using the scripts provided.

## Package Summary

| Package | Description | Target Environment |
|---------|-------------|-------------------|
| `deltavision-standalone-1.0.0.zip` | Complete standalone package including Node.js binary | Restricted environments without Node.js |

## Deployment Instructions

### Standalone Package

1. **Build or obtain the package**: `./scripts/package-standalone.sh`
2. **Transfer** the zip file to the target system
3. **Extract the package**: `unzip deltavision-standalone-1.0.0.zip`
4. **Run DeltaVision**: `cd deltavision-standalone-1.0.0 && ./start-deltavision.sh /path/to/old/folder /path/to/new/folder`

## Adding New Packages to This Directory

After creating a package, you can store it in this directory for easier distribution:

```bash
# Create standalone package
./scripts/package-standalone.sh

# Copy to packages directory
mkdir -p precompiled/packages/
cp scripts/deltavision-standalone-*.zip precompiled/packages/
