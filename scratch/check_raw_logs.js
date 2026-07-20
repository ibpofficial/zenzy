const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\780396e8-c9cd-43a4-8582-8b007d90b7e2\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.step_index === 7 || data.step_index === 9 || data.step_index === 21) {
      console.log(`Step ${data.step_index}: content length: ${data.content ? data.content.length : 0}`);
      if (data.content && data.content.includes('truncated')) {
        console.log(`  Step ${data.step_index} contains 'truncated' marker!`);
      }
    }
  } catch (e) {}
});
