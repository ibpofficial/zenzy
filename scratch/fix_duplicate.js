const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/worker/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We split by lines to do a precise deletion.
const lines = content.split(/\r?\n/);
console.log('Original lines count:', lines.length);

// We want to verify line 2108 (1-indexed, so index 2107) and line 2306 (index 2305).
// Let's print them out first.
console.log('Line 2108:', lines[2107]);
console.log('Line 2306:', lines[2305]);
console.log('Line 2308:', lines[2307]);

// Check if we have the duplicate block.
if (lines[2107].includes(')}') && lines[2305].includes(')}') && lines[2307].includes('{/* TAB: PROFILE MANAGEMENT */}')) {
  console.log('Detected correct line markers. Deleting duplicate block (lines 2109 to 2307)...');
  // lines are 0-indexed. lines[2108] is line 2109. lines[2306] is line 2307.
  // We remove lines from index 2108 to 2306 inclusive (which is 199 lines).
  lines.splice(2108, 2306 - 2108 + 1);
  
  const updatedContent = lines.join('\n');
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log('Duplicate block removed successfully. New lines count:', lines.length);
} else {
  console.log('Line markers do not match. Doing text-based replacement check.');
}
