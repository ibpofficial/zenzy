const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Print all lines around our critical areas
const ranges = [
  [843, 852],   // Hero section open
  [945, 965],   // Search bar section open + first form
  [1243, 1254], // Search bar section close + SERVICE CATEGORIES
];

for (const [start, end] of ranges) {
  console.log(`\n=== Lines ${start}-${end} ===`);
  for (let i = start - 1; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
