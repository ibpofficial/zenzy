const fs = require('fs');
const logPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\6bc219f6-74e9-4913-aa3b-20767fb6995a\\.system_generated\\logs\\transcript.jsonl';
const fileLines = fs.readFileSync(logPath, 'utf8').split('\n');
const line98 = JSON.parse(fileLines[98].trim());
console.log(JSON.stringify(line98, null, 2));
