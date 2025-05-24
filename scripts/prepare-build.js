#!/usr/bin/env node

/**
 * DeltaVision Build Preparation Script
 * 
 * This script prepares the application for packaging by:
 * 1. Ensuring the build directory structure is correct
 * 2. Copying necessary files to the right locations
 * 3. Fixing paths in HTML files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const rendererSrcDir = path.join(rootDir, 'src', 'renderer');
const rendererDistDir = path.join(rendererSrcDir, 'dist');

// Create build directory structure
console.log('Creating build directory structure...');
fs.mkdirSync(buildDir, { recursive: true });
fs.mkdirSync(path.join(buildDir, 'renderer'), { recursive: true });

// Copy renderer files
console.log('Copying renderer files...');
fs.mkdirSync(path.join(buildDir, 'renderer', 'dist'), { recursive: true });

// Copy bundle files
if (fs.existsSync(path.join(rendererDistDir, 'bundle.js'))) {
  fs.copyFileSync(
    path.join(rendererDistDir, 'bundle.js'),
    path.join(buildDir, 'renderer', 'dist', 'bundle.js')
  );
}

if (fs.existsSync(path.join(rendererDistDir, 'bundle.css'))) {
  fs.copyFileSync(
    path.join(rendererDistDir, 'bundle.css'),
    path.join(buildDir, 'renderer', 'dist', 'bundle.css')
  );
}

// Create a modified index.html with correct paths
console.log('Creating index.html with correct paths...');
const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
  <title>DeltaVision - Advanced File Comparison</title>
  <link rel="stylesheet" href="./dist/bundle.css">
</head>
<body>
  <div id="app"></div>
  <script src="./dist/bundle.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(buildDir, 'renderer', 'index.html'), indexContent);

console.log('Build preparation complete!');
