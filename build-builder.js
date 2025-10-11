const fs = require('fs');
const path = require('path');

// Ensure dist/builder directory exists (production build location)
const builderDistPath = path.join('dist', 'builder');
if (!fs.existsSync(builderDistPath)) {
  fs.mkdirSync(builderDistPath, { recursive: true });
}

// Build Builder JavaScript by concatenating all modules
function buildBuilderJS() {
  console.log('Building Builder JavaScript bundle...');

  try {
    // Read all builder module files in dependency order
    const moduleFiles = [
      'builder/modules/state.js',
      'builder/modules/fen-utils.js',
      'builder/modules/ui-utils.js',
      'builder/modules/board-editor.js',
      'builder/modules/solution-editor.js',
      'builder/modules/preview.js',
      'builder/modules/persistence.js',
      'builder/modules/lichess-import.js'
    ];

    let modulesJS = '';

    // Process each module file
    for (const file of moduleFiles) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Remove import statements (including multiline imports)
        content = content.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?\s*/g, '');

        // Remove export statements but keep the declarations
        content = content.replace(/^export\s+/gm, '');

        modulesJS += `// ${path.basename(file)}\n${content}\n\n`;
      } else {
        console.warn(`Warning: ${file} not found, skipping...`);
      }
    }

    // Read main builder.js file
    let mainBuilderJS = fs.readFileSync('builder/builder.js', 'utf8');

    // Remove all import statements from main file (including multiline imports)
    mainBuilderJS = mainBuilderJS.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?\s*/g, '');

    // Combine everything
    const bundledJS = `
// Chess Puzzle Builder - Production Bundle
// This file combines all builder modules into a single standalone file

(function() {
  'use strict';

  ${modulesJS}

  // Main builder initialization
  ${mainBuilderJS}

})();
`;

    // Write the bundled file
    fs.writeFileSync(path.join(builderDistPath, 'builder-bundle.js'), bundledJS);
    console.log('✓ Builder JavaScript bundled successfully');

  } catch (error) {
    console.error('Error building Builder JavaScript:', error);
    process.exit(1);
  }
}

// Copy CSS file
function copyBuilderCSS() {
  console.log('Copying Builder CSS...');

  try {
    const cssContent = fs.readFileSync('builder/builder.css', 'utf8');
    fs.writeFileSync(path.join(builderDistPath, 'builder.css'), cssContent);
    console.log('✓ Builder CSS copied successfully');
  } catch (error) {
    console.error('Error copying Builder CSS:', error);
    process.exit(1);
  }
}

// Copy widget dist files to builder/dist
function copyWidgetFiles() {
  console.log('Copying widget dist files to builder/dist...');

  try {
    const widgetFiles = [
      'dist/chess-widget.min.js',
      'dist/chess-widget.min.css'
    ];

    for (const file of widgetFiles) {
      if (fs.existsSync(file)) {
        const filename = path.basename(file);
        fs.copyFileSync(file, path.join(builderDistPath, filename));
      } else {
        console.warn(`Warning: ${file} not found, skipping...`);
      }
    }

    console.log('✓ Widget files copied to builder/dist successfully');
  } catch (error) {
    console.error('Error copying widget files:', error);
    process.exit(1);
  }
}

// Create production index.html
function createProductionHTML() {
  console.log('Creating production index.html...');

  try {
    const devHTML = fs.readFileSync('builder/index.html', 'utf8');

    // Replace paths for production (all files in same directory)
    let prodHTML = devHTML
      // Replace development CSS with production CSS
      .replace(
        /<!-- Development CSS.*?-->\s*<link rel="stylesheet" href="builder\.css">\s*<link rel="stylesheet" href="\/dist\/chess-widget\.min\.css">/s,
        '<link rel="stylesheet" href="builder.css">\n  <link rel="stylesheet" href="chess-widget.min.css">'
      )
      // Replace development JS with production JS
      .replace(
        /<!-- Development JS.*?-->\s*<script src="\/dist\/chess-widget\.min\.js"><\/script>\s*<script type="module" src="builder\.js"><\/script>/s,
        '<script src="chess-widget.min.js"></script>\n  <script src="builder-bundle.js"></script>'
      )
      // Remove production comments
      .replace(/<!-- Production CSS.*?-->/s, '')
      .replace(/<!-- Production JS.*?-->/s, '');

    fs.writeFileSync(path.join(builderDistPath, 'index.html'), prodHTML);
    console.log('✓ Production index.html created successfully');
  } catch (error) {
    console.error('Error creating production HTML:', error);
    process.exit(1);
  }
}

// Copy .nojekyll file
function copyNojekyll() {
  console.log('Copying .nojekyll file...');

  try {
    // Create empty .nojekyll file
    fs.writeFileSync(path.join(builderDistPath, '.nojekyll'), '');
    console.log('✓ .nojekyll file created successfully');
  } catch (error) {
    console.error('Error creating .nojekyll:', error);
    process.exit(1);
  }
}

// Main build function
async function buildBuilder() {
  console.log('Starting Builder production build process...\n');

  try {
    buildBuilderJS();
    copyBuilderCSS();
    copyWidgetFiles();
    createProductionHTML();
    copyNojekyll();

    console.log('\n✓ Builder production build completed successfully!');
    console.log('\nFiles created in dist/builder/:');
    console.log('  - index.html (production HTML)');
    console.log('  - builder-bundle.js (all builder modules bundled)');
    console.log('  - builder.css (builder styles)');
    console.log('  - chess-widget.min.js (widget library)');
    console.log('  - chess-widget.min.css (widget styles)');
    console.log('  - .nojekyll (GitHub Pages config)');
    console.log('\n✅ Builder is now ready for GitHub Pages deployment!');
    console.log('📁 Deploy from: /dist/builder directory');

  } catch (error) {
    console.error('\n✗ Builder build failed:', error);
    process.exit(1);
  }
}

// Run build
buildBuilder();
