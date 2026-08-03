const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);
const rawBinary = buf.toString('binary');
const lines = rawBinary.split('\n');

// Print lines 1245-1255 (0-indexed: 1244-1254)
for (let i = 1244; i <= 1254; i++) {
  const line = lines[i];
  const hasHighBytes = /[\x80-\xff]/.test(line);
  console.log(`Line ${i + 1} (hasHighBytes=${hasHighBytes}): ${JSON.stringify(line.slice(0, 120))}`);
}
