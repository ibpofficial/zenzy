const fs = require('fs');
const logPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\6bc219f6-74e9-4913-aa3b-20767fb6995a\\.system_generated\\logs\\transcript.jsonl';
const fileLines = fs.readFileSync(logPath, 'utf8').split('\n');

const line90 = JSON.parse(fileLines[90].trim());
const fileContent = line90.tool_calls[0].args.CodeContent.replace(/\r\n/g, '\n');

// Find all occurrences of '// Profile data listeners'
const lines = fileContent.split('\n');
for (let idx = 0; idx < lines.length; idx++) {
  if (lines[idx].includes('Profile data listeners')) {
    console.log(`Line ${idx - 3}: ${lines[idx - 3]}`);
    console.log(`Line ${idx - 2}: ${lines[idx - 2]}`);
    console.log(`Line ${idx - 1}: ${lines[idx - 1]}`);
    console.log(`Line ${idx}: ${lines[idx]}`);
    console.log(`Line ${idx + 1}: ${lines[idx + 1]}`);
    console.log(`Line ${idx + 2}: ${lines[idx + 2]}`);
  }
}
