/**
 * Component loader module for server-side rendering of modular HTML components
 */
const fs = require('fs').promises;
const path = require('path');

/**
 * Load a component from the components directory
 * @param {string} componentName - Name of the component file (without .html extension)
 * @returns {Promise<string>} - The component's HTML content
 */
async function loadComponent(componentName) {
    try {
        const componentPath = path.join(__dirname, '../../public/components', `${componentName}.html`);
        console.log(`Loading component: ${componentName} from ${componentPath}`);
        const content = await fs.readFile(componentPath, 'utf8');
        console.log(`Component ${componentName} loaded successfully (${content.length} bytes)`);
        return content;
    } catch (error) {
        console.error(`Error loading component ${componentName}:`, error);
        return `<!-- Component loading error: ${componentName} -->`;
    }
}

/**
 * Replace component placeholders in a template with actual component content
 * @param {string} template - The template containing placeholders
 * @param {Object} components - Object with component name as key and content as value
 * @returns {string} - The processed template with components inserted
 */
function processTemplate(template, components) {
    console.log(`Processing template with ${Object.keys(components).length} components`);
    let result = template;
    
    Object.keys(components).forEach(key => {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        const replacementCount = (result.match(placeholder) || []).length;
        console.log(`Replacing placeholder {{${key}}} (found ${replacementCount} occurrences)`);
        result = result.replace(placeholder, components[key]);
    });
    
    return result;
}

/**
 * Load all components and render the main template
 * @param {string} templatePath - Path to the main template
 * @returns {Promise<string>} - The fully rendered HTML
 */
async function renderTemplate(templatePath) {
    try {
        console.log(`Rendering template from ${templatePath}`);
        
        // Load template
        const template = await fs.readFile(templatePath, 'utf8');
        console.log(`Template loaded successfully (${template.length} bytes)`);
        
        // Load components
        const componentNames = ['header', 'sidebar', 'comparison-section', 'settings-panel', 'hotkeys-panel', 'offline-indicator', 'keywords-panel', 'floating-keywords-button'];
        console.log(`Loading components: ${componentNames.join(', ')}`);
        
        const componentPromises = componentNames.map(name => loadComponent(name));
        const componentContents = await Promise.all(componentPromises);
        
        // Build components object
        const components = {};
        componentNames.forEach((name, index) => {
            components[name] = componentContents[index];
        });
        
        // Process template
        const result = processTemplate(template, components);
        console.log(`Template rendering complete (${result.length} bytes)`);
        return result;
    } catch (error) {
        console.error('Error rendering template:', error);
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>DeltaVision - Error</title>
        </head>
        <body>
            <h1>Template Rendering Error</h1>
            <p>There was an error rendering the application components:</p>
            <pre>${error.message}</pre>
        </body>
        </html>`;
    }
}

module.exports = {
    loadComponent,
    processTemplate,
    renderTemplate
};
