# DeltaVision

A visual file comparison tool for examining differences between directories and files. DeltaVision highlights changes and provides intuitive navigation through file differences.

<img src="public/images/DeltaVision.png" alt="DeltaVision Logo" width="200"/>

## Features

- Compare entire directories of files to identify changes between versions
- Side-by-side visual comparison of file content with highlighting of differences
- Keyboard navigation through changes (Up/Down arrows, J/K)
- User-defined keyword highlighting
- Responsive design for desktop and mobile use
- Line number display for easy reference
- Optional dark/light themes
- Search functionality within files
- Offline-capable operation
- Multiple deployment options for any environment

## Deployment Options

DeltaVision offers multiple deployment options designed to work in virtually any environment:

| Deployment Option | Best For | Requirements | Setup Complexity |
|-------------------|----------|--------------|------------------|
| **Docker/Podman** | Production environments, IT teams | Docker or Podman | Easy |
| **Non-containerized** | Development, testing | Node.js and npm | Medium |
| **Offline Containerized** | Air-gapped environments | Docker or Podman (no internet) | Medium |
| **Standalone** | Highly-restricted environments | Basic Linux/Windows | Simple |

### Which Option Should I Choose?

- **Docker/Podman** (Recommended): Choose this if you have Docker or Podman available. It provides the most isolated and reproducible environment.
  
- **Non-containerized**: Choose this if you can't use containers but can install Node.js on your system.

- **Offline Containerized**: Choose this for air-gapped environments where you have Docker/Podman but no internet.

- **Standalone**: Choose this when you can't install anything (Docker, Podman, or Node.js) on the target system. This option requires zero installation and works "out of the box" with a self-contained Node.js binary.

## Quick Start

### 1. Docker/Podman (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/deltavision.git
cd deltavision

# Start with Docker Compose
cd docker
docker-compose up -d

# Or with Podman
cd docker
podman-compose up -d
```

### 2. Non-containerized

```bash
# Clone the repository
git clone https://github.com/yourusername/deltavision.git
cd deltavision

# Install dependencies
npm install

# Start the application
./scripts/start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
```

### 3. Offline Containerized

```bash
# On a connected system, create the offline package
./scripts/docker-package-offline.sh

# Transfer the package to the air-gapped system and extract
unzip deltavision-docker-offline-1.0.0.zip
cd deltavision-docker-offline-1.0.0

# Configure and start
./scripts/configure-offline.sh
./scripts/verify-offline-dependencies.sh
./start-deltavision-offline.sh
```

### 4. Standalone (No Installation Required)

```bash
# On a connected system, create the standalone package
./scripts/package-standalone.sh

# Transfer the package to the target system and extract
unzip deltavision-standalone-1.0.0.zip
cd deltavision-standalone-1.0.0

# Start DeltaVision
./start-deltavision.sh /path/to/old /path/to/new [keywords.txt]
```

For detailed installation instructions, see [INSTALLATION.md](docs/INSTALLATION.md).

## Usage

Once DeltaVision is running, access it in your web browser:

```
http://localhost:3000
```

### Key Features:

- **File Browser**: Navigate directories to compare files
- **Diff View**: Side-by-side comparison with highlighted changes
- **Search**: Find files or content across directories
- **Keyword Highlighting**: Highlight important terms (like TODO, FIXME)
- **Navigation**: Use arrow keys or J/K to move between differences

## Scripts Reference

DeltaVision includes a comprehensive set of scripts for different environments and use cases:

### Core Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/start-deltavision.sh` | Start non-containerized | When Docker/Podman is unavailable |
| `scripts/help.sh` | Show help for all scripts | When you need guidance |

### Docker/Podman Deployment

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `docker/docker-compose.yml` | Define container services | For Docker/Podman Compose deployment |
| `docker/Dockerfile` | Build DeltaVision image | For custom container builds |

### Offline/Air-gapped Deployment

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/docker-package-offline.sh` | Create offline package | Before transferring to air-gapped system |
| `scripts/start-deltavision-offline.sh` | Start offline containerized | In air-gapped environments |
| `scripts/configure-offline.sh` | Configure offline deployment | After extracting the offline package |
| `scripts/verify-offline-dependencies.sh` | Verify dependencies | Before starting in offline mode |
| `scripts/preflight-check.sh` | Run system checks | Before starting in offline mode |
| `scripts/diagnostic-logger.sh` | Logging utilities | Used by other scripts |
| `scripts/test-offline-setup.sh` | Validate file structure | After extracting or reorganizing |

### Standalone Deployment

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `scripts/package-standalone.sh` | Create standalone package | For deployment in highly-restricted environments |

## Documentation

- [Installation Guide](docs/INSTALLATION.md): Detailed installation instructions
- [Offline Deployment Guide](docs/OFFLINE-README.md): Air-gapped deployment instructions
- [Docker Guide](docker/README.md): Docker-specific setup information
- [Offline Checklist](docs/OFFLINE-CHECKLIST.md): Pre-flight checklist for offline deployments

## File Organization

```
deltavision/
├── docker/             # Container configuration files
├── docs/               # Documentation files
├── logs/               # Log files (created at runtime)
├── npm-packages/       # Offline npm packages (created by packaging scripts)
├── scripts/            # Operational scripts
├── public/             # Frontend assets
│   ├── images/         # Image assets
│   ├── js/             # JavaScript files
│   ├── themes/         # CSS theme files
│   └── vendor/         # Third-party libraries
└── src/                # Source code
    └── server/         # Backend server code
```

## Troubleshooting

If you encounter issues:

1. Check the logs in the `logs/` directory
2. Run verification scripts: 
   - `scripts/verify-offline-dependencies.sh` (for offline deployments)
   - `scripts/verify-standalone.sh` (for standalone deployments)
3. Run the preflight check: `scripts/preflight-check.sh`
4. Use the help system: `scripts/help.sh`

## License

[Specify your license here]
