// Code Move Detection Test - Reorganized Version

// Helper functions - Moved from the bottom to the top
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, retries = config.maxRetries) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    await delay(1000);
    return retry(fn, retries - 1);
  }
}

// Global variables
const config = {
  enableLogging: true,
  maxRetries: 3,
  timeout: 5000,
  newSetting: 'added'
};

// Main application code
class Application {
  constructor() {
    this.initialized = false;
    this.version = '1.0.1'; // Added new property
  }
  
  // shutdown method moved up before run
  shutdown() {
    logger("Shutting down application...");
    this.initialized = false;
    return true;
  }
  
  run() {
    if (!this.initialized) {
      return errorHandler(new Error("Application not initialized"));
    }
    
    logger("Application running...");
    return true;
  }
  
  init() {
    logger("Initializing application...");
    this.initialized = true;
    return true;
  }
}

// Utility functions - Moved from top to bottom
function logger(message) {
  if (config.enableLogging) {
    console.log(`[LOG]: ${message} - ${new Date().toISOString()}`);
  }
}

function errorHandler(error) {
  logger(`Error occurred: ${error.message}`);
  return false;
}

// Added a new utility function
function validateConfig(config) {
  if (!config.timeout || config.timeout < 1000) {
    throw new Error('Invalid timeout configuration');
  }
  return true;
}

// Application initialization
const app = new Application();
validateConfig(config);
app.init();
app.run();
