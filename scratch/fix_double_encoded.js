const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);

// The file was written as utf8 but some lines have double-encoded or mojibake bytes.
// Pattern: ÃÂ¢ÃÂÃÂ corresponds to triple-byte sequences like 0xC3 0x82 0xC2 0xA2 0xC3 0x82 0xC2 0x95 etc.
// (UTF-8 encoding of latin1 chars that were themselves UTF-8 box chars)
// We need to strip all high bytes from JSX comment lines that contain them.

const rawBinary = buf.toString('binary');
const lines = rawBinary.split('\n');

let fixCount = 0;
const fixed = lines.map((line, idx) => {
  const hasHighBytes = /[\x80-\xff]/.test(line);
  if (!hasHighBytes) return line;
  
  // For JSX comment lines with garbage high bytes: strip them and extract label
  const isComment = line.includes('{/*') && line.includes('*/}');
  if (isComment) {
    let cleaned = line.replace(/[\x80-\xff]/g, '').replace(/\s+/g, ' ').trim();
    console.log(`Line ${idx + 1} [comment]: ${JSON.stringify(line.slice(0, 60))} => ${cleaned}`);
    fixCount++;
    return cleaned;
  }
  
  // For non-comment lines with isolated high bytes (like "Verified Pro • category"):
  // The bullet/middot chars (•) are U+2022 = E2 80 A2 or just replace with ASCII
  const cleaned = line.replace(/[\xc3][\x82][\xc2][\xa2]/g, '').replace(/[\x80-\xff]+/g, '•');
  if (cleaned !== line) {
    console.log(`Line ${idx + 1} [inline]: fixed high bytes`);
    fixCount++;
    return cleaned;
  }
  
  return line;
});

const result = fixed.join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log(`\nFixed ${fixCount} additional corrupted lines. File saved.`);
