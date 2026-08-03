const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Print hero section start (around line 847)
console.log('=== HERO SECTION (840-870) ===');
for (let i = 839; i <= 869; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}

// Print search bar area (around line 950-1020)
console.log('\n=== SEARCH BAR (958-980) ===');
for (let i = 957; i <= 979; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
