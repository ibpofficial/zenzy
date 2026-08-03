const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\780396e8-c9cd-43a4-8582-8b007d90b7e2\\scratch';

const files = fs.readdirSync(scratchDir);

files.forEach(file => {
  if (file.startsWith('chunk_') && file.endsWith('.tsx')) {
    const content = fs.readFileSync(path.join(scratchDir, file), 'utf8');
    
    // Check for keywords
    if (content.toLowerCase().includes('custom') || content.toLowerCase().includes('rank') || content.toLowerCase().includes('project')) {
      console.log(`File: ${file} matches!`);
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.toLowerCase().includes('custom') || l.toLowerCase().includes('rank') || l.toLowerCase().includes('price')) {
          console.log(`  Line ${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
});
