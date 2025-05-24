/**
 * Theme Debugger
 * 
 * This module provides utilities for debugging theme issues and ensuring
 * all themes implement the required variables consistently.
 */

import { themeInterface } from './themeInterface';
import { themeRegistry } from './index';

/**
 * Check if a theme has all required variables
 * 
 * @param {import('./themeInterface').Theme} theme - The theme to check
 * @returns {Object} Object with missing variables and validation status
 */
export function checkThemeCompleteness(theme) {
  const missingVariables = [];
  const requiredVariables = Object.keys(themeInterface.colors);
  
  requiredVariables.forEach(variable => {
    if (!theme.colors[variable] || theme.colors[variable] === '') {
      missingVariables.push(variable);
    }
  });
  
  return {
    theme: theme.name,
    id: theme.id,
    missing: missingVariables,
    isComplete: missingVariables.length === 0
  };
}

/**
 * Check all registered themes for completeness
 * 
 * @returns {Array<Object>} Array of theme completeness check results
 */
export function checkAllThemes() {
  const themes = themeRegistry.getThemesList();
  return themes.map(theme => checkThemeCompleteness(theme));
}

/**
 * Get a report of all theme issues
 * 
 * @returns {Object} Detailed report of theme issues
 */
export function getThemeReport() {
  const themeChecks = checkAllThemes();
  const incompleteThemes = themeChecks.filter(check => !check.isComplete);
  
  // Find which variables are most commonly missing
  const missingVariableCounts = {};
  incompleteThemes.forEach(theme => {
    theme.missing.forEach(variable => {
      missingVariableCounts[variable] = (missingVariableCounts[variable] || 0) + 1;
    });
  });
  
  // Sort variables by how many themes are missing them
  const sortedMissingVariables = Object.entries(missingVariableCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([variable, count]) => ({ 
      variable, 
      count, 
      percentage: Math.round((count / themeChecks.length) * 100) 
    }));
  
  return {
    totalThemes: themeChecks.length,
    completeThemes: themeChecks.filter(check => check.isComplete).length,
    incompleteThemes: incompleteThemes.length,
    themeDetails: themeChecks,
    missingVariableStats: sortedMissingVariables
  };
}

/**
 * Log theme report to console
 */
export function logThemeReport() {
  const report = getThemeReport();
  
  console.group('Theme Completeness Report');
  console.log(`Total Themes: ${report.totalThemes}`);
  console.log(`Complete Themes: ${report.completeThemes}`);
  console.log(`Incomplete Themes: ${report.incompleteThemes}`);
  
  if (report.incompleteThemes > 0) {
    console.group('Missing Variables Stats');
    report.missingVariableStats.forEach(stat => {
      console.log(`${stat.variable}: Missing in ${stat.count} themes (${stat.percentage}%)`);
    });
    console.groupEnd();
    
    console.group('Theme Details');
    report.themeDetails.forEach(theme => {
      if (!theme.isComplete) {
        console.group(`${theme.theme} (${theme.id})`);
        console.log(`Missing ${theme.missing.length} variables:`);
        theme.missing.forEach(variable => console.log(`- ${variable}`));
        console.groupEnd();
      }
    });
    console.groupEnd();
  }
  
  console.groupEnd();
  
  return report;
}

/**
 * Add a debug button to the UI that shows theme information
 * This should only be used during development
 */
export function addThemeDebugButton() {
  if (typeof document === 'undefined') return;
  
  const button = document.createElement('button');
  button.textContent = 'Theme Debug';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.zIndex = '9999';
  button.style.padding = '8px 12px';
  button.style.backgroundColor = '#4a90e2';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', () => {
    const report = logThemeReport();
    
    // Create a simple UI to show the report
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '10000';
    overlay.style.padding = '20px';
    overlay.style.overflow = 'auto';
    
    const content = document.createElement('div');
    content.style.backgroundColor = '#222';
    content.style.color = '#eee';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.maxWidth = '800px';
    content.style.margin = '0 auto';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '8px 16px';
    closeButton.style.backgroundColor = '#4a90e2';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginTop = '20px';
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Create report content
    const title = document.createElement('h2');
    title.textContent = 'Theme Completeness Report';
    
    const summary = document.createElement('p');
    summary.innerHTML = `
      Total Themes: ${report.totalThemes}<br>
      Complete Themes: ${report.completeThemes}<br>
      Incomplete Themes: ${report.incompleteThemes}
    `;
    
    content.appendChild(title);
    content.appendChild(summary);
    
    if (report.incompleteThemes > 0) {
      const missingTitle = document.createElement('h3');
      missingTitle.textContent = 'Missing Variables Stats';
      content.appendChild(missingTitle);
      
      const missingList = document.createElement('ul');
      report.missingVariableStats.forEach(stat => {
        const item = document.createElement('li');
        item.textContent = `${stat.variable}: Missing in ${stat.count} themes (${stat.percentage}%)`;
        missingList.appendChild(item);
      });
      content.appendChild(missingList);
      
      const themeTitle = document.createElement('h3');
      themeTitle.textContent = 'Incomplete Themes';
      content.appendChild(themeTitle);
      
      report.themeDetails.forEach(theme => {
        if (!theme.isComplete) {
          const themeSection = document.createElement('div');
          themeSection.style.marginBottom = '15px';
          themeSection.style.padding = '10px';
          themeSection.style.backgroundColor = '#333';
          themeSection.style.borderRadius = '4px';
          
          const themeName = document.createElement('h4');
          themeName.textContent = `${theme.theme} (${theme.id})`;
          themeName.style.margin = '0 0 10px 0';
          
          const themeMissing = document.createElement('p');
          themeMissing.textContent = `Missing ${theme.missing.length} variables:`;
          
          const variableList = document.createElement('ul');
          theme.missing.forEach(variable => {
            const item = document.createElement('li');
            item.textContent = variable;
            variableList.appendChild(item);
          });
          
          themeSection.appendChild(themeName);
          themeSection.appendChild(themeMissing);
          themeSection.appendChild(variableList);
          content.appendChild(themeSection);
        }
      });
    }
    
    content.appendChild(closeButton);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
  });
  
  document.body.appendChild(button);
}

// Export a function to initialize the debugger in development mode
export function initThemeDebugger(isDevelopment = false) {
  if (isDevelopment && typeof window !== 'undefined') {
    // Wait for DOM to be ready
    window.addEventListener('DOMContentLoaded', () => {
      addThemeDebugButton();
    });
    
    // Log initial report to console
    console.log('Theme debugger initialized');
    logThemeReport();
  }
}
