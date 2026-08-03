const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);
const lines = buf.toString('binary').split('\n');

console.log("Current line 950:", lines[949]);

// Replace line 950 with valid TSX comments
lines[949] = '        {/* ═════════════════════════════════════ UNIVERSAL SEARCH BAR ═════════════════════════════════════ */}\r\n        {/* Backdrop dimming effect when focused/suggestions open */}';

const newContent = lines.join('\n');
// Write back using UTF-8 encoding
fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("Saved fixed app/page.tsx successfully.");
