#!/usr/bin/env node

/**
 * DeltaVision Build Preparation Script
 * 
 * This script prepares the application for packaging by:
 * 1. Ensuring the build directory structure is correct
 * 2. Copying necessary files to the right locations
 * 3. Fixing paths in HTML files
 * 4. Including modal HTML files with correct paths
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
fs.mkdirSync(path.join(buildDir, 'renderer', 'dist'), { recursive: true });

// Copy renderer files
console.log('Copying renderer files...');

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

// Copy modal HTML files with robust error handling and verification
console.log('Copying modal HTML files...');
const modalFiles = [
  'network-status-modal.html',
  'network-url-modal.html',
  'about-modal.html'
];

// Create a function to verify file existence and log detailed errors
function verifyFileExists(filePath, description) {
  try {
    const stats = fs.statSync(filePath);
    console.log(`✓ ${description} exists: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ ERROR: ${description} not found: ${filePath}`);
    console.error(`  Error details: ${error.message}`);
    return false;
  }
}

// Make sure the renderer directory exists before copying
verifyFileExists(rendererSrcDir, 'Renderer source directory');

// Process each modal file with detailed logging
let modalFilesCopied = 0;
let modalFilesFailed = 0;

for (const modalFile of modalFiles) {
  const sourcePath = path.join(rendererSrcDir, modalFile);
  const destPath = path.join(buildDir, 'renderer', modalFile);
  
  console.log(`Processing modal file: ${modalFile}`);
  
  if (verifyFileExists(sourcePath, `Modal file ${modalFile}`)) {
    try {
      // Read the original content
      const originalContent = fs.readFileSync(sourcePath, 'utf8');
      
      // Fix any relative paths in the HTML
      const fixedContent = originalContent
        .replace(/href="dist\//g, 'href="./dist/')
        .replace(/src="dist\//g, 'src="./dist/');
      
      // Write the fixed content
      fs.writeFileSync(destPath, fixedContent);
      console.log(`✓ Successfully copied and fixed paths in ${modalFile}`);
      
      // Verify the file was actually written
      if (verifyFileExists(destPath, `Copied modal file ${modalFile}`)) {
        modalFilesCopied++;
      } else {
        modalFilesFailed++;
        console.error(`✗ CRITICAL ERROR: Failed to verify ${modalFile} after copying!`);
      }
    } catch (error) {
      modalFilesFailed++;
      console.error(`✗ ERROR copying ${modalFile}: ${error.message}`);
    }
  } else {
    modalFilesFailed++;
    console.error(`✗ ERROR: Source modal file ${modalFile} not found!`);
    
    // Create a fallback modal file with basic content if source doesn't exist
    try {
      const fallbackContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
  <title>${modalFile.replace('.html', '')}</title>
  <style>
    body { font-family: sans-serif; background: #282c34; color: #e6e6e6; padding: 20px; }
    .modal-content { text-align: center; }
    button { background: #4a90e2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="modal-content">
    <h2>${modalFile.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
    <p>This is a fallback modal created during build.</p>
    <button onclick="window.close()">Close</button>
  </div>
  <script>
    // Basic close functionality
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.close();
    });
  </script>
</body>
</html>`;
      
      fs.writeFileSync(destPath, fallbackContent);
      console.log(`⚠ Created fallback modal for ${modalFile}`);
      modalFilesCopied++;
    } catch (fallbackError) {
      console.error(`✗ ERROR creating fallback for ${modalFile}: ${fallbackError.message}`);
    }
  }
}

console.log(`Modal files summary: ${modalFilesCopied} copied successfully, ${modalFilesFailed} failed`);

// If any modal files failed, make it obvious in the log
if (modalFilesFailed > 0) {
  console.error('⚠ WARNING: Some modal files could not be copied. The application may not function correctly!');
}

console.log('Build preparation complete!');
