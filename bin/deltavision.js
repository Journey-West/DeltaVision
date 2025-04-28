#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

// Default config paths
const configPath = path.resolve(process.cwd(), 'folder-config.json');
const keywordsPath = path.resolve(process.cwd(), 'keywords.txt');

// Parse CLI args
const args = require('yargs')
  .option('old', { type: 'string', describe: 'Path to old folder', demandOption: true })
  .option('new', { type: 'string', describe: 'Path to new folder', demandOption: true })
  .option('keywords', { type: 'string', describe: 'Path to keywords file', default: keywordsPath })
  .help()
  .argv;

// Update folder-config.json
const fs = require('fs');
const config = {
  oldFolderPath: path.resolve(process.cwd(), args.old),
  newFolderPath: path.resolve(process.cwd(), args.new),
  keywordFilePath: path.resolve(process.cwd(), args.keywords)
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Config written to ${configPath}`);

// Spawn the server
const serverProc = spawn('node', [path.resolve(__dirname, '../src/server/index.js')], { stdio: 'inherit' });

serverProc.on('close', code => {
  process.exit(code);
});
