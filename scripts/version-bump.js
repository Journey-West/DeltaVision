#!/usr/bin/env node

/**
 * DeltaVision Version Bump Script
 * 
 * This script helps with creating new releases by:
 * 1. Updating the version in package.json
 * 2. Creating a git tag
 * 3. Pushing the changes and tag to GitHub
 * 
 * Usage:
 *   node scripts/version-bump.js [major|minor|patch]
 * 
 * Example:
 *   node scripts/version-bump.js patch  # Increments 1.0.0 to 1.0.1
 *   node scripts/version-bump.js minor  # Increments 1.0.0 to 1.1.0
 *   node scripts/version-bump.js major  # Increments 1.0.0 to 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Validate arguments
const validBumpTypes = ['major', 'minor', 'patch'];
const bumpType = process.argv[2];

if (!validBumpTypes.includes(bumpType)) {
  console.error(`Error: Invalid bump type. Use one of: ${validBumpTypes.join(', ')}`);
  process.exit(1);
}

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Updated version from ${currentVersion} to ${newVersion}`);

// Commit changes
try {
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "Bump version to ${newVersion}"`, { stdio: 'inherit' });
  console.log('Committed version change');

  // Create tag
  execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });
  console.log(`Created tag v${newVersion}`);

  // Prompt for push
  console.log('\nTo trigger the automatic release workflow:');
  console.log(`Run: git push origin main && git push origin v${newVersion}`);
} catch (error) {
  console.error('Error during git operations:', error.message);
  process.exit(1);
}
