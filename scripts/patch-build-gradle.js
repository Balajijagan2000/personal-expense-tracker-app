const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at ${filePath}`);
  process.exit(1);
}

let contents = fs.readFileSync(filePath, 'utf8');

if (!contents.includes('react.bundleInDebug')) {
  // Add the bundleInDebug check in the react { ... } block
  contents = contents.replace(
    'autolinkLibrariesWithApp()',
    `autolinkLibrariesWithApp()

    if (findProperty('react.bundleInDebug') == 'true') {
        debuggableVariants = []
    }`
  );
  fs.writeFileSync(filePath, contents, 'utf8');
  console.log('Successfully patched build.gradle for standalone debug bundling');
} else {
  console.log('build.gradle already contains react.bundleInDebug configuration');
}
