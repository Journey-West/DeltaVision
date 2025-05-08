// Code Move Detection Test

// Global variables
const config = {
  enableLogging: true,
  maxRetries: 3,
  timeout: 5000
};

// Utility functions
function logger(message) {
  if (config.enableLogging) {
    console.log(`[LOG]: ${message}`);
  }
}

function errorHandler(error) {
  logger(`Error occurred: ${error.message}`);
  return false;
}

// Main application code
class Application {
  constructor() {
    this.initialized = false;
  }
  
  init() {
    logger("Initializing application...");
    this.initialized = true;
    return true;
  }
  
  run() {
    if (!this.initialized) {
      return errorHandler(new Error("Application not initialized"));
    }
    
    logger("Application running...");
    return true;
  }
  
  shutdown() {
    logger("Shutting down...");
    this.initialized = false;
  }
}

// Helper functions
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

// Application initialization
const app = new Application();
app.init();
app.run();
