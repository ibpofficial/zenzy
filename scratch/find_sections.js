const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('<section') || l.includes('</section>')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
