const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);
const lines = buf.toString('binary').split('\n');

for (let i = 935; i <= 965; i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
