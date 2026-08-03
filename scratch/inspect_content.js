const fs = require('fs');
const logPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\6bc219f6-74e9-4913-aa3b-20767fb6995a\\.system_generated\\logs\\transcript.jsonl';
const fileLines = fs.readFileSync(logPath, 'utf8').split('\n');

const line90 = JSON.parse(fileLines[90].trim());
const fileContent = line90.tool_calls[0].args.CodeContent;

console.log("File content length:", fileContent.length);
console.log("Contains 'Profile data listeners':", fileContent.includes("Profile data listeners"));
console.log("Contains 'listeners':", fileContent.includes("listeners"));
console.log("Contains 'fetching':", fileContent.includes("fetching"));

// Find lines containing "Profile"
const lines = fileContent.split('\n');
lines.forEach((l, i) => {
  if (l.includes("Profile") || l.includes("profile")) {
    console.log(`Line ${i}: ${l}`);
  }
});
