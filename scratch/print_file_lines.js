const fs = require('fs');
const path = require('path');

const chunkFile = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\780396e8-c9cd-43a4-8582-8b007d90b7e2\\scratch\\chunk_1601-2400.tsx';

if (fs.existsSync(chunkFile)) {
  const content = fs.readFileSync(chunkFile, 'utf8');
  const lines = content.split('\n');
  console.log('Lines 1 to 100:');
  for (let i = 0; i < Math.min(100, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log('File does not exist:', chunkFile);
}
