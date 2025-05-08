# DeltaVision Component Documentation

## Table of Contents
1. [Core Application Structure](#core-application-structure)
2. [UI Components](#ui-components)
3. [Server Components](#server-components)
4. [File System Operations](#file-system-operations)
5. [Configuration Management](#configuration-management)
6. [Component Loading System](#component-loading-system)
7. [Technical Implementation Details](#technical-implementation-details)

## Core Application Structure

### Main Server (`src/server/index.js`)
- **Purpose**: Main entry point of the application
- **Key Features**:
  - Express.js web server setup
  - File system watching
  - Command extraction
  - File metadata handling
- **Dependencies**:
  - express: Web server framework
  - chokidar: File system watching
  - fs: File system operations
  - path: Path manipulation
- **Configuration**:
  - Port: 3000 (default)
  - Config file: `folder-config.json`
- **Technical Implementation**:
  - Uses Express.js middleware for request handling
  - Implements async/await for file operations
  - Uses Promises for file system operations
  - Implements event-driven architecture for file watching

## UI Components

### 1. Comparison Section (`public/components/comparison-section.html`)
- **Purpose**: Main file comparison interface
- **Features**:
  - File path display for old and new versions
  - Change statistics (added/removed/moved lines)
  - File metadata display
  - View mode toggle (Diff/New File)
- **Key Elements**:
  - File info panel
  - File statistics container
  - Metadata display
  - View toggle buttons
  - Diff viewer container
- **Technical Implementation**:
  - Uses CSS Grid for layout
  - Implements responsive design
  - Uses SVG icons for visual indicators
  - Implements real-time statistics updates
  - Uses event delegation for performance

### 2. Header (`public/components/header.html`)
- **Purpose**: Main application header
- **Features**:
  - Application title
  - Navigation controls
  - User interface controls
- **Technical Implementation**:
  - Implements toggle switches for diff controls
  - Uses SVG icons for buttons
  - Implements theme switching
  - Uses CSS transitions for smooth animations
  - Implements responsive design
- **Control Elements**:
  - Diff highlighting toggle
  - Move detection toggle
  - Keyword highlighting toggle
  - Diff level selector (line/word/char)
  - Theme toggle
  - Settings button
  - Refresh button
  - Keywords panel toggle

### 3. Sidebar (`public/components/sidebar.html`)
- **Purpose**: File navigation and selection
- **Features**:
  - File tree view
  - File selection interface
  - Navigation controls
- **Technical Implementation**:
  - Uses recursive component structure
  - Implements lazy loading for large directories
  - Uses virtual scrolling for performance
  - Implements file type icons
  - Uses CSS transitions for expand/collapse

### 4. Settings Panel (`public/components/settings-panel.html`)
- **Purpose**: Application configuration interface
- **Features**:
  - Folder path configuration
  - Application settings
  - User preferences
- **Technical Implementation**:
  - Uses form validation
  - Implements real-time settings updates
  - Uses local storage for persistence
  - Implements error handling for invalid paths
  - Uses async file system operations

### 5. Hotkeys Panel (`public/components/hotkeys-panel.html`)
- **Purpose**: Keyboard shortcut reference
- **Features**:
  - List of available shortcuts
  - Shortcut descriptions
  - Usage instructions
- **Technical Implementation**:
  - Uses keyboard event listeners
  - Implements shortcut conflict detection
  - Uses CSS for visual feedback
  - Implements shortcut customization
  - Uses event delegation for performance

### 6. Keywords Panel (`public/components/keywords-panel.html`)
- **Purpose**: Keyword management interface
- **Features**:
  - Keyword list
  - Keyword addition/removal
  - Keyword filtering
- **Technical Implementation**:
  - Uses real-time filtering
  - Implements keyword highlighting
  - Uses local storage for persistence
  - Implements drag-and-drop reordering
  - Uses debouncing for search performance

### 7. Floating Keywords Button (`public/components/floating-keywords-button.html`)
- **Purpose**: Quick access to keywords
- **Features**:
  - Floating action button
  - Quick keyword access
  - Toggle keywords panel
- **Technical Implementation**:
  - Uses CSS transforms for animations
  - Implements touch support
  - Uses z-index management
  - Implements position persistence
  - Uses CSS transitions for smooth animations

### 8. Offline Indicator (`public/components/offline-indicator.html`)
- **Purpose**: Network status indication
- **Features**:
  - Offline status display
  - Connection status updates
  - User notification
- **Technical Implementation**:
  - Uses navigator.onLine API
  - Implements online/offline event listeners
  - Uses CSS animations for status changes
  - Implements automatic reconnection
  - Uses service workers for offline support

### 9. Change Statistics (`public/components/change-statistics.html`)
- **Purpose**: Display file change metrics
- **Features**:
  - Line change statistics
  - File modification details
  - Change visualization
- **Technical Implementation**:
  - Uses SVG for visualizations
  - Implements real-time updates
  - Uses CSS animations for transitions
  - Implements data aggregation
  - Uses canvas for complex visualizations

## Server Components

### Component Loader (`src/server/component-loader.js`)
- **Purpose**: Dynamic component loading system
- **Features**:
  - Asynchronous component loading
  - Template processing
  - Error handling
- **Key Functions**:
  - `loadComponent(componentName)`: Loads a component asynchronously
  - `processTemplate(template, components)`: Processes template with components
  - `renderTemplate(templatePath)`: Renders the complete template
- **Technical Implementation**:
  - Uses async/await for file operations
  - Implements component caching
  - Uses regular expressions for template processing
  - Implements error recovery
  - Uses file system watchers for hot reloading

## File System Operations

### File Watching System
- **Purpose**: Real-time file system monitoring
- **Features**:
  - File change detection
  - Directory monitoring
  - Event handling
- **Events Handled**:
  - File addition
  - File modification
  - File deletion
- **Technical Implementation**:
  - Uses chokidar for file watching
  - Implements debouncing for performance
  - Uses event emitters for notifications
  - Implements recursive directory watching
  - Uses file system polling as fallback

### File Comparison System
- **Purpose**: Compare file versions
- **Features**:
  - Diff generation
  - Change detection
  - Line comparison
  - Metadata comparison
- **Technical Implementation**:
  - Uses diff algorithms for comparison
  - Implements line-level diffing
  - Uses word-level diffing for granularity
  - Implements character-level diffing
  - Uses binary comparison for non-text files

## Configuration Management

### Folder Configuration
- **Purpose**: Manage application paths
- **Features**:
  - Old folder path management
  - New folder path management
  - Keyword file path management
- **Storage**: `folder-config.json`
- **Technical Implementation**:
  - Uses JSON for configuration storage
  - Implements path validation
  - Uses file system checks
  - Implements configuration versioning
  - Uses atomic writes for safety

### Keyword Management
- **Purpose**: Handle keyword-based filtering
- **Features**:
  - Keyword loading
  - Keyword saving
  - Keyword filtering
- **Technical Implementation**:
  - Uses regular expressions for matching
  - Implements keyword normalization
  - Uses caching for performance
  - Implements keyword validation
  - Uses fuzzy matching for suggestions

## Component Loading System

### Template Processing
- **Purpose**: Dynamic HTML generation
- **Features**:
  - Component placeholder replacement
  - Template rendering
  - Error handling
- **Technical Implementation**:
  - Uses template literals
  - Implements placeholder system
  - Uses async component loading
  - Implements error boundaries
  - Uses HTML sanitization

### Component Structure
- **Location**: `public/components/`
- **File Format**: HTML
- **Naming Convention**: `component-name.html`
- **Technical Implementation**:
  - Uses semantic HTML5
  - Implements ARIA attributes
  - Uses CSS modules
  - Implements component isolation
  - Uses HTML validation

### Error Handling
- **Features**:
  - Graceful fallbacks
  - Error logging
  - User-friendly error messages
  - Component loading error recovery
- **Technical Implementation**:
  - Uses try-catch blocks
  - Implements error boundaries
  - Uses error reporting
  - Implements retry mechanisms
  - Uses fallback components

## Technical Implementation Details

### Performance Optimizations
- **Component Loading**:
  - Lazy loading of components
  - Component caching
  - Bundle splitting
  - Tree shaking
  - Code splitting

### Security Measures
- **Input Validation**:
  - Path sanitization
  - HTML escaping
  - XSS prevention
  - CSRF protection
  - Content Security Policy

### State Management
- **Data Flow**:
  - Event-driven architecture
  - Pub/sub pattern
  - State containers
  - Immutable updates
  - State persistence

### Testing Strategy
- **Test Types**:
  - Unit tests
  - Integration tests
  - End-to-end tests
  - Performance tests
  - Security tests

### Build Process
- **Build Steps**:
  - Code compilation
  - Asset optimization
  - Bundle generation
  - Source maps
  - Cache busting

### Deployment
- **Deployment Steps**:
  - Environment configuration
  - Build optimization
  - Asset deployment
  - Cache management
  - Monitoring setup

## Usage Guidelines

### Component Integration
1. Place new components in `public/components/`
2. Register component in `component-loader.js`
3. Use component placeholders in templates

### Configuration
1. Set up folder paths in `folder-config.json`
2. Configure keyword file if needed
3. Adjust application settings as required

### File Comparison
1. Select files in the sidebar
2. View differences in the comparison section
3. Use keywords for filtering
4. Toggle between diff and new file views

## Best Practices

### Component Development
- Keep components modular
- Implement error handling
- Use semantic HTML
- Follow naming conventions

### File System Operations
- Use asynchronous operations
- Implement proper error handling
- Monitor file system events
- Handle edge cases

### Configuration Management
- Validate configuration
- Implement fallbacks
- Save user preferences
- Handle missing configurations

## Build and Deployment Process

### Build System

#### 1. Development Environment
- **Node.js Version**: 18.17.1 (LTS)
- **Package Manager**: npm
- **Development Tools**:
  - nodemon for development
  - React for UI components
  - Express for server
  - chokidar for file watching
  - diff for file comparison

#### 2. Build Scripts
- **Development**:
  ```bash
  npm run dev    # Start development server with hot reload
  ```
- **Production**:
  ```bash
  npm start      # Start production server
  npm run package # Create standalone package
  ```

#### 3. Package Creation Process
- **Script**: `scripts/package-standalone.sh`
- **Steps**:
  1. Environment Setup
     - Version detection
     - Platform detection (linux-x64, darwin-arm64, etc.)
     - Temporary directory creation
  2. Node.js Binary Preparation
     - Check for precompiled binary
     - Download if not available
     - Platform-specific binary selection
  3. Application Packaging
     - Copy application code
     - Exclude unnecessary files
     - Install dependencies
  4. Package Verification
     - File integrity checks
     - Dependency verification
     - Binary validation

#### 4. Build Artifacts
- **Directory Structure**:
  ```
  deltavision-standalone-{version}/
  ├── app/              # Application code
  ├── node/            # Node.js binary
  ├── scripts/         # Utility scripts
  └── docs/            # Documentation
  ```
- **Excluded Files**:
  - node_modules
  - .git
  - .github
  - docker
  - logs
  - scripts
  - npm-packages
  - Archive files (*.zip, *.tar, *.tar.gz)

### Deployment Process

#### 1. Pre-deployment Checks
- **Script**: `scripts/preflight-check.sh`
- **Checks**:
  - System requirements
  - Dependencies
  - File permissions
  - Network connectivity
  - Storage space

#### 2. Installation Methods

##### A. Standalone Package
1. **Extract Package**:
   ```bash
   unzip deltavision-standalone-{version}.zip
   ```
2. **Run Preflight Check**:
   ```bash
   ./scripts/preflight-check.sh
   ```
3. **Start Application**:
   ```bash
   ./scripts/start-deltavision.sh
   ```

##### B. Development Installation
1. **Clone Repository**:
   ```bash
   git clone [repository-url]
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```

#### 3. Configuration
- **File**: `folder-config.json`
- **Settings**:
  - Old folder path
  - New folder path
  - Keyword file path
- **Environment Variables**:
  - PORT (default: 3000)
  - NODE_ENV (development/production)

#### 4. Post-deployment Verification
- **Health Checks**:
  - Server status
  - File system access
  - Component loading
  - API endpoints
- **Logging**:
  - Application logs
  - Error logs
  - Access logs

### Maintenance

#### 1. Updates
- **Version Management**:
  - Semantic versioning
  - Changelog tracking
  - Backward compatibility
- **Update Process**:
  1. Backup configuration
  2. Stop application
  3. Update files
  4. Verify installation
  5. Restart application

#### 2. Monitoring
- **System Metrics**:
  - CPU usage
  - Memory consumption
  - Disk space
  - Network activity
- **Application Metrics**:
  - Response times
  - Error rates
  - File operations
  - Component loading times

#### 3. Troubleshooting
- **Diagnostic Tools**:
  - `scripts/diagnostic-logger.sh`
  - Error logs
  - System logs
- **Common Issues**:
  - File permission problems
  - Network connectivity
  - Resource constraints
  - Configuration errors

### Security Considerations

#### 1. File System Security
- Path validation
- Permission checks
- File access restrictions
- Input sanitization

#### 2. Network Security
- CORS configuration
- Rate limiting
- Request validation
- SSL/TLS support

#### 3. Application Security
- Dependency scanning
- Code signing
- Access control
- Audit logging

### Performance Optimization

#### 1. Build Optimization
- Code minification
- Asset compression
- Tree shaking
- Bundle splitting

#### 2. Runtime Optimization
- Component lazy loading
- File system caching
- Memory management
- Connection pooling

#### 3. Resource Management
- Memory limits
- CPU allocation
- Disk space monitoring
- Network bandwidth control

## Deployment Environments

### 1. Development Environment
- **Requirements**:
  - Node.js 18.17.1 or later
  - npm 8.x or later
  - Git
  - 2GB RAM minimum
  - 1GB free disk space
- **Features**:
  - Hot reloading
  - Debug logging
  - Development tools
  - Source maps
- **Configuration**:
  ```bash
  NODE_ENV=development
  PORT=3000
  DELTAVISION_LOG_LEVEL=debug
  ```

### 2. Production Environment
- **Requirements**:
  - Standalone package or Node.js installation
  - 4GB RAM recommended
  - 2GB free disk space
  - Network access (optional)
- **Features**:
  - Optimized builds
  - Production logging
  - Performance monitoring
  - Error tracking
- **Configuration**:
  ```bash
  NODE_ENV=production
  PORT=3000
  DELTAVISION_LOG_LEVEL=info
  ```

### 3. Air-Gapped Environment
- **Requirements**:
  - Standalone package
  - 4GB RAM recommended
  - 2GB free disk space
  - No network access
- **Features**:
  - Offline operation
  - Local logging
  - File system monitoring
  - Self-contained binaries
- **Configuration**:
  ```bash
  NODE_ENV=production
  PORT=3000
  DELTAVISION_LOG_LEVEL=info
  OFFLINE_MODE=true
  ```

### 4. Containerized Environment
- **Requirements**:
  - Docker or Podman
  - 4GB RAM recommended
  - 2GB free disk space
  - Network access (optional)
- **Features**:
  - Isolated environment
  - Resource limits
  - Volume mounting
  - Network isolation
- **Configuration**:
  ```bash
  NODE_ENV=production
  PORT=3000
  DELTAVISION_LOG_LEVEL=info
  CONTAINER_MODE=true
  ```

## Monitoring and Logging Systems

### 1. Logging System

#### A. Log Levels
- **ERROR** (0): Critical errors requiring immediate attention
- **WARNING** (1): Potential issues that need monitoring
- **INFO** (2): General operational information
- **DEBUG** (3): Detailed debugging information
- **TRACE** (4): Very detailed tracing information

#### B. Log Types
- **Application Logs**:
  - Component loading
  - File operations
  - User actions
  - System events
- **Debug Logs**:
  - Detailed component state
  - Performance metrics
  - Memory usage
  - Network operations
- **Error Logs**:
  - Exception details
  - Stack traces
  - Error context
  - Recovery attempts

#### C. Log Format
```log
[2024-01-20 10:15:30] [INFO] [COMPONENT] Message
[2024-01-20 10:15:31] [ERROR] [SYSTEM] Error message
[2024-01-20 10:15:32] [DEBUG] [NETWORK] Debug information
```

#### D. Log Management
- **Rotation**:
  - Maximum 10 log files
  - Automatic cleanup
  - Size-based rotation
  - Time-based rotation
- **Storage**:
  - `/logs` directory
  - Compressed archives
  - Backup copies
  - Retention policies

### 2. Monitoring System

#### A. System Metrics
- **CPU Monitoring**:
  - Usage percentage
  - Load average
  - Process count
  - Thread count
- **Memory Monitoring**:
  - Total memory
  - Used memory
  - Free memory
  - Swap usage
- **Disk Monitoring**:
  - Space usage
  - I/O operations
  - File system health
  - Directory sizes
- **Network Monitoring**:
  - Bandwidth usage
  - Connection count
  - Latency
  - Error rates

#### B. Application Metrics
- **Performance Metrics**:
  - Response times
  - Request rates
  - Error rates
  - Resource usage
- **Component Metrics**:
  - Load times
  - Render times
  - Update frequency
  - Error counts
- **File System Metrics**:
  - Operation counts
  - Success rates
  - Error rates
  - Cache hit rates

#### C. Health Checks
- **System Health**:
  - Resource availability
  - Service status
  - Component status
  - Dependency status
- **Application Health**:
  - API endpoints
  - Component loading
  - File system access
  - Configuration status

### 3. Diagnostic Tools

#### A. Diagnostic Logger
- **Features**:
  - Multi-level logging
  - Context tracking
  - Performance profiling
  - Error tracking
- **Usage**:
  ```bash
  source scripts/diagnostic-logger.sh
  log_info "COMPONENT" "Message"
  log_error "SYSTEM" "Error message"
  ```

#### B. Performance Profiler
- **Metrics**:
  - Component load times
  - Render times
  - Update frequencies
  - Resource usage
- **Reports**:
  - Performance summaries
  - Bottleneck identification
  - Optimization suggestions
  - Trend analysis

#### C. Error Tracker
- **Features**:
  - Error aggregation
  - Stack trace analysis
  - Context capture
  - Recovery tracking
- **Integration**:
  - Error reporting
  - Alert generation
  - Recovery automation
  - Trend analysis

### 4. Alerting System

#### A. Alert Types
- **Critical Alerts**:
  - System failures
  - Data corruption
  - Security breaches
  - Resource exhaustion
- **Warning Alerts**:
  - High resource usage
  - Performance degradation
  - Error rate increases
  - Configuration issues

#### B. Alert Channels
- **Notification Methods**:
  - Log entries
  - Console output
  - Email notifications
  - System notifications
- **Alert Format**:
  ```
  [ALERT] [CRITICAL] [SYSTEM] Message
  Time: 2024-01-20 10:15:30
  Component: System
  Severity: Critical
  Details: Detailed message
  ```

#### C. Alert Management
- **Configuration**:
  - Alert thresholds
  - Notification rules
  - Escalation paths
  - Response procedures
- **Response**:
  - Alert acknowledgment
  - Incident tracking
  - Resolution tracking
  - Post-mortem analysis 