const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 830; i <= 860; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
