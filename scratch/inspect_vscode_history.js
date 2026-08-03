const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');

if (!fs.existsSync(historyDir)) {
  console.log("VS Code Local History directory not found at:", historyDir);
  process.exit(0);
}

console.log("Searching VS Code Local History at:", historyDir);

function scanDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanDir(full);
      } else {
        // Read file if it looks like a history snapshot (often hex/hash name or JSON)
        // Check size: page.tsx should be around 100KB - 200KB
        if (stat.size > 100000 && stat.size < 250000) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('export default function WorkerSlugProfilePage') && content.includes('const handleBookingSubmit')) {
            console.log(`Found matching snapshot! Path: ${full}, Size: ${stat.size}, Modified: ${stat.mtime}`);
          }
        }
      }
    }
  } catch (e) {}
}

scanDir(historyDir);
console.log("Scan finished.");
