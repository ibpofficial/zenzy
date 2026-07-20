const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\780396e8-c9cd-43a4-8582-8b007d90b7e2\\scratch';
const files = fs.readdirSync(scratchDir);

files.forEach(file => {
  if (file.startsWith('chunk_') && file.endsWith('.tsx')) {
    const content = fs.readFileSync(path.join(scratchDir, file), 'utf8');
    if (content.toLowerCase().includes('quotation') || content.toLowerCase().includes('quote')) {
      console.log(`Found in: ${file}`);
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.toLowerCase().includes('quotation') || l.toLowerCase().includes('quote')) {
          console.log(`  Line ${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
});
