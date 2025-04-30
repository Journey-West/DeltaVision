# DeltaVision Docker Setup

This document explains how to run DeltaVision using Docker, which replaces the need for the `package-offline.sh` script.

## Requirements

- Docker
- Docker Compose (optional, but recommended)

## Quick Start

### Using Docker Compose (Recommended)

1. First, edit the `docker-compose.yml` file to specify your data directories:

   ```yaml
   volumes:
     - /path/to/your/old/folder:/app/data/old
     - /path/to/your/new/folder:/app/data/new
     - ./keywords.txt:/app/keywords.txt
     - ./folder-config.json:/app/folder-config.json
   ```

2. Update your `folder-config.json` to point to these mounted locations:

   ```json
   {
     "oldFolderPath": "/app/data/old",
     "newFolderPath": "/app/data/new",
     "keywordFilePath": "/app/keywords.txt"
   }
   ```

3. Build and start the container:
   ```
   docker-compose up -d
   ```

4. Access DeltaVision at: http://localhost:3000

5. To stop the container:
   ```
   docker-compose down
   ```

### Using Docker Directly

1. Build the Docker image:
   ```
   docker build -t deltavision .
   ```

2. Run the container with your data directories:
   ```
   docker run -p 3000:3000 \
     -v /path/to/your/old/folder:/app/data/old \
     -v /path/to/your/new/folder:/app/data/new \
     -v $(pwd)/keywords.txt:/app/keywords.txt \
     -v $(pwd)/folder-config.json:/app/folder-config.json \
     deltavision
   ```

3. Access DeltaVision at: http://localhost:3000

## Using Your Own Data

You must specify your own data directories by editing the volume mappings in docker-compose.yml or using the correct paths in your docker run command.

The key mappings are:
- Your "old" folder → `/app/data/old` inside the container
- Your "new" folder → `/app/data/new` inside the container

Make sure your `folder-config.json` uses these container paths:

```json
{
  "oldFolderPath": "/app/data/old",
  "newFolderPath": "/app/data/new",
  "keywordFilePath": "/app/keywords.txt"
}
```

## Updating Configurations

If you need to update your folder configurations, you can either:

1. Edit the `folder-config.json` file directly on your host machine, or
2. Use the DeltaVision web interface to configure paths (which will update the mounted config file)

## Troubleshooting

- **Port conflicts**: If port 3000 is already in use on your host machine, change the port mapping in your `docker-compose.yml` or your `docker run` command (e.g., `-p 8080:3000` to use port 8080).
- **File permissions**: Ensure your mounted volumes have the correct read/write permissions.
