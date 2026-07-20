const fs = require('fs');
const path = require('path');

const searchPaths = [
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\Users\\Acer\\AppData\\Local\\Programs',
  'C:\\Users\\Acer\\AppData\\Local\\GitHubDesktop'
];

function searchDir(dir, filter) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch (e) {
        continue;
      }
      if (stat.isDirectory()) {
        // limit depth to prevent long loops
        if (full.split(path.sep).length < 7) {
          searchDir(full, filter);
        }
      } else if (file.toLowerCase() === filter.toLowerCase()) {
        console.log("Found Git executable at:", full);
      }
    }
  } catch (e) {}
}

console.log("Starting search for git.exe...");
for (const p of searchPaths) {
  if (fs.existsSync(p)) {
    searchDir(p, 'git.exe');
  }
}
console.log("Search finished.");
