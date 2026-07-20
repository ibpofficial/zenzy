const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/worker/dashboard/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let currentTab = null;
let braceCount = 0;
let parenCount = 0;
let inJSXExpression = false; // inside {...}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Check if a new tab starts
  if (line.includes('activeTab ===') && line.includes('&& (')) {
    if (currentTab) {
      console.log(`ERROR: Found new tab start at line ${lineNum} while still inside tab "${currentTab.name}" (opened at line ${currentTab.lineNum})`);
      console.log(`Current braceCount: ${braceCount}, parenCount: ${parenCount}`);
    }
    const match = line.match(/activeTab === "([^"]+)"/);
    const tabName = match ? match[1] : 'unknown';
    currentTab = { name: tabName, lineNum };
    braceCount = 1; // since it starts with {
    parenCount = 1; // since it starts with (
    // Skip checking this line character by character to avoid double counting the start { and (
    continue;
  }

  if (currentTab) {
    // We scan character by character to keep track of braces and parens
    // Avoid scanning comments if possible, but let's keep it simple first
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      } else if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
      }

      if (braceCount === 0 && parenCount === 0) {
        console.log(`Tab "${currentTab.name}" closed cleanly at line ${lineNum}`);
        currentTab = null;
        break;
      }
    }
  }
}

if (currentTab) {
  console.log(`ERROR: Tab "${currentTab.name}" (opened at line ${currentTab.lineNum}) never closed! End of file reached. braceCount: ${braceCount}, parenCount: ${parenCount}`);
}
