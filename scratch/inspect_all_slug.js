const fs = require('fs');
const logPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\6bc219f6-74e9-4913-aa3b-20767fb6995a\\.system_generated\\logs\\transcript.jsonl';
const fileLines = fs.readFileSync(logPath, 'utf8').split('\n');

for (let i = 0; i < fileLines.length; i++) {
  const line = fileLines[i].trim();
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.args && tc.args.TargetFile && tc.args.TargetFile.toLowerCase().includes('slug')) {
          console.log(`\n=== Array Line ${i} (Step Index: ${data.step_index}) ===`);
          console.log(`Tool: ${tc.name}`);
          console.log(`Description: ${tc.args.Description || tc.args.Instruction || ''}`);
          if (tc.args.TargetContent) {
            console.log(`Target (len ${tc.args.TargetContent.length}): ${JSON.stringify(tc.args.TargetContent.slice(0, 100))}`);
          }
          if (tc.args.ReplacementContent) {
            console.log(`Replacement (len ${tc.args.ReplacementContent.length}): ${JSON.stringify(tc.args.ReplacementContent.slice(0, 100))}`);
          }
          if (tc.args.ReplacementChunks) {
            console.log(`Chunks count: ${tc.args.ReplacementChunks.length}`);
            for (let cIdx = 0; cIdx < tc.args.ReplacementChunks.length; cIdx++) {
              const ch = tc.args.ReplacementChunks[cIdx];
              console.log(`  Chunk [${cIdx}]: Target: ${JSON.stringify(ch.TargetContent.slice(0, 80))}`);
            }
          }
        }
      }
    }
  } catch (e) {}
}
