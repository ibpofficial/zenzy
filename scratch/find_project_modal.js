const fs = require('fs');

const file = 'c:\\Users\\Acer\\Desktop\\zenzy\\app\\[slug]\\page.tsx';
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.toLowerCase().includes('project') && (l.toLowerCase().includes('modal') || l.toLowerCase().includes('open') || l.toLowerCase().includes('save'))) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
