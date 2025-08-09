// copy-msi.js
const fs = require('fs');
const path = require('path');

const msiDir = path.join(__dirname, 'src-tauri', 'target', 'release', 'bundle', 'msi');
const releasesDir = path.join(__dirname, 'releases');

// Ensure releases directory exists
if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir);
}

// Find MSI files
const msiFiles = fs.readdirSync(msiDir).filter(f => f.endsWith('.msi'));
if (msiFiles.length === 0) {
    console.error('No MSI files found in', msiDir);
    process.exit(1);
}

// Use the latest MSI file (by modified time)
const latestMsi = msiFiles
    .map(f => ({
        name: f,
        time: fs.statSync(path.join(msiDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time)[0].name;

const src = path.join(msiDir, latestMsi);
const dest = path.join(releasesDir, latestMsi);

fs.copyFileSync(src, dest);
console.log(`Copied ${latestMsi} to releases/`);