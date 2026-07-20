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
    // Find console logs step outputs
    if (data.content && data.content.includes('console.log') || data.content && data.content.includes('consoleLogs')) {
      console.log(`Step ${data.step_index}: content length: ${data.content.length}`);
    }
    // Print lines containing console log captures
    if (data.type === 'CAPTURE_BROWSER_CONSOLE_LOGS' || (data.tool_calls && data.tool_calls.some(tc => tc.name.includes('console_logs')))) {
      console.log(`Step ${data.step_index} console logs call:`, data);
    }
  } catch (e) {}
});
