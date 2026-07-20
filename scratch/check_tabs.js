const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/worker/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

const tabMatches = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('activeTab ===') && line.includes('&& (')) {
    tabMatches.push({ lineNum: i + 1, text: line.trim() });
  }
}

console.log('Detected activeTab blocks:');
tabMatches.forEach(t => console.log(`Line ${t.lineNum}: ${t.text}`));

// Let's analyze nesting and trace brace matching for each tab block.
// A tab block opens with `{activeTab === "..." && (`
// It should close with `)}` (or `            )}` or similar).
// Let's print lines that look like closing tags.
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim() === ')}' || line.trim() === '})' || line.trim() === '}') {
    // console.log(`Line ${i + 1}: ${line}`);
  }
}
