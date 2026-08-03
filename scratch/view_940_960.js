const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== LINES 940-960 ===');
for (let i = 939; i <= 959; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
