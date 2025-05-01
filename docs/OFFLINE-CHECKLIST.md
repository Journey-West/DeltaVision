# DeltaVision Offline Deployment Checklist

This pre-flight checklist helps ensure successful deployment of DeltaVision in air-gapped environments.

## Before Creating the Offline Package

- [ ] Latest code pulled from repository
- [ ] All dependencies installed (`npm install`)
- [ ] Application tested locally
- [ ] Docker/Podman available and functioning
- [ ] Sufficient disk space available (at least 200MB)

## Package Creation

- [ ] Package version specified (`./scripts/docker-package-offline.sh [version]`)
- [ ] All required files verified in the package
- [ ] Docker image successfully built and saved
- [ ] Script execution completed without errors
- [ ] Package file size reasonable (approximately 150-200MB)

## Target Environment Prerequisites

- [ ] Docker or Podman installed
- [ ] Minimum 512MB RAM available
- [ ] User has permissions to run container commands
- [ ] Data directories exist and are accessible
- [ ] No port conflicts on target system (default: 3000)

## Installation Process

- [ ] Package extracted successfully
- [ ] Configuration script executed (`./scripts/configure-offline.sh`)
- [ ] Verification script executed (`./scripts/verify-offline-package.sh`)
- [ ] Docker/Podman image loaded
- [ ] Application started with startup script
- [ ] Web interface accessible at configured port

## Post-Installation Verification

- [ ] Application loads in browser
- [ ] Old and new folders accessible in the UI
- [ ] File comparisons working
- [ ] Theme switching functional
- [ ] Keyword highlighting functional (if configured)
- [ ] No JavaScript console errors

## Common Issues to Check

- [ ] Image loaded correctly (check with `docker images` or `podman images`)
- [ ] Correct folder paths in configuration
- [ ] Container running (check with `docker ps` or `podman ps`)
- [ ] No permission issues with mounted volumes
- [ ] No SELinux blocking access (for Podman users)
- [ ] Firewall allowing access to the configured port

## Data Verification

- [ ] Old folder contains expected files
- [ ] New folder contains expected files
- [ ] Files follow required naming pattern (command__additional_info.txt)
- [ ] First line of each file contains command information in quotes

Use this checklist to systematically verify all aspects of your DeltaVision offline deployment.
