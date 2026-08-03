const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');

// Read raw buffer
const buf = fs.readFileSync(filePath);
const rawBinary = buf.toString('binary');

// Scan all lines as binary, find any line with the invalid char sequences
// The corrupted chars appear as sequences of \xe2\x95\x90 (UTF-8 for ═) or similar box-drawing chars
// but stored as their individual bytes producing garbage: â, \x95, \x90 etc.
// In binary encoding these look like: â (0xe2), then Â (0xc2), then chars like ² etc.

// Let's convert the file cleanly: read as latin1 (binary), find corrupt comment lines,
// replace them, then write back as utf-8.

const lines = rawBinary.split('\n');
let fixCount = 0;

const fixed = lines.map((line, idx) => {
  // A corrupted line typically contains one of these patterns:
  // â followed by non-ASCII sequences that look like box-drawing characters decoded as latin1
  // They appear as sequences starting with: \xe2\x95 ...
  // In latin1 this is: 'â' + chr(0x95) + chr(0x90)
  
  // Check if line contains such patterns:
  // 0xe2 = 'â', 0x95 = '\x95' (in latin1), 0x90 = '\x90'
  const hasCorrupt = line.includes('\xe2\x95\x90') || 
                     line.includes('\xe2\x95') ||
                     line.includes('\xc2\xb7') ||  // middot
                     line.includes('\xe2\x80\xa2'); // bullet
  
  if (hasCorrupt && (line.includes('{/*') || line.includes('*/'))) {
    // This is a JSX comment with corrupt box-drawing chars
    // Extract the actual comment label (ASCII part)
    // Remove all non-ASCII, non-JSX-comment chars
    let cleaned = line
      .replace(/[\x80-\xff]/g, '') // strip all high bytes
      .replace(/\s+/g, ' ')        // collapse whitespace
      .trim();
    
    console.log(`Line ${idx + 1}: Corrupted comment found.`);
    console.log(`  Before: ${JSON.stringify(line.slice(0, 80))}`);
    console.log(`  After:  ${cleaned}`);
    fixCount++;
    return cleaned;
  }
  
  // Also fix inline corrupted text in JSX (non-comment lines with bad chars)
  if (hasCorrupt && !line.includes('{/*')) {
    const cleaned = line.replace(/[\x80-\xff]+/g, '•');
    if (cleaned !== line) {
      console.log(`Line ${idx + 1}: Corrupted inline text fixed.`);
      fixCount++;
      return cleaned;
    }
  }
  
  return line;
});

const result = fixed.join('\n');
fs.writeFileSync(filePath, result, 'utf8');

console.log(`\nFixed ${fixCount} corrupted lines. File saved.`);
