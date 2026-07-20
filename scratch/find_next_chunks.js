const fs = require('fs');
const path = require('path');

const nextDir = 'c:\\Users\\Acer\\Desktop\\zenzy\\.next';

if (!fs.existsSync(nextDir)) {
  console.log(".next directory not found.");
  process.exit(0);
}

console.log("Searching .next directory...");

function scan(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scan(full);
      } else if (file.endsWith('.js') || file.endsWith('.txt')) {
        // Read file
        if (stat.size > 20000) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('WorkerSlugProfilePage') && content.includes('handleBookingSubmit')) {
            console.log(`Found chunk! Path: ${full}, Size: ${stat.size}, Modified: ${stat.mtime}`);
          }
        }
      }
    }
  } catch (e) {}
}

scan(nextDir);
console.log("Search finished.");
