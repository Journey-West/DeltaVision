# DeltaVision Website

This directory contains the source files for the DeltaVision project website, hosted on GitHub Pages at https://journey-west.github.io/DeltaVision/.

## Directory Structure

- `index.html` - Main website HTML
- `styles.css` - Website styles
- `images/` - Screenshots and other images
- `generate-screenshots.html` - Tool for generating application screenshots

## Updating the Website

### General Updates

1. Make changes to the HTML, CSS, or image files in this directory
2. Commit and push the changes to the `gh-pages` branch
3. GitHub will automatically rebuild and deploy the website

### Adding Screenshots

1. Open `generate-screenshots.html` in a web browser
2. Use the mockups to create screenshots of the application interface
3. Save the screenshots to the `images/` directory with the appropriate filenames
4. Commit and push the changes to the `gh-pages` branch

### Content Guidelines

- Keep the website focused on the core features of DeltaVision
- Highlight the offline capabilities of the application
- Ensure all documentation is consistent with the main branch README
- Use clear, concise language that focuses on user benefits

## Local Testing

To test the website locally before pushing changes:

1. Navigate to the `docs` directory
2. Start a local web server:
   ```
   python -m http.server 8000
   ```
3. Open a browser and go to `http://localhost:8000`

## Deployment

The website is automatically deployed from the `gh-pages` branch. The deployment is configured to serve from the `/docs` directory in the repository settings.
