const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\6bc219f6-74e9-4913-aa3b-20767fb6995a\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file not found!");
  process.exit(1);
}

const fileLines = fs.readFileSync(logPath, 'utf8').split('\n');

// Find Line 90 (write_to_file) to load initial content
let fileContent = "";
try {
  const line90 = JSON.parse(fileLines[90].trim());
  for (const tc of line90.tool_calls) {
    if (tc.name === 'write_to_file') {
      fileContent = tc.args.CodeContent;
      console.log("Loaded initial page.tsx content from line 90.");
    }
  }
} catch (e) {
  console.error("Failed to load line 90:", e.message);
  process.exit(1);
}

if (!fileContent) {
  console.error("Initial file content empty!");
  process.exit(1);
}

// Function to apply single replacement
function applySingleReplace(target, replacement, lineIndex) {
  const cleanTarget = target.replace(/\r\n/g, '\n');
  const cleanReplacement = replacement.replace(/\r\n/g, '\n');
  const cleanContent = fileContent.replace(/\r\n/g, '\n');

  if (!cleanContent.includes(cleanTarget)) {
    console.error(`[Line ${lineIndex}] Could not find target text inside file content!`);
    console.log("Target snippet:", cleanTarget.slice(0, 150));
    throw new Error("Target mismatch");
  }
  
  const updatedContent = cleanContent.split(cleanTarget).join(cleanReplacement);
  fileContent = updatedContent;
}

// Playback lines: 98, 123, 131, 135 (single replacements) and 149 (multi replacement)
const linesToApply = [98, 123, 131, 135, 149];

for (const lineIdx of linesToApply) {
  try {
    const data = JSON.parse(fileLines[lineIdx].trim());
    for (const tc of data.tool_calls) {
      if (tc.name === 'replace_file_content') {
        console.log(`Applying replace_file_content from line ${lineIdx}...`);
        applySingleReplace(tc.args.TargetContent, tc.args.ReplacementContent, lineIdx);
      } else if (tc.name === 'multi_replace_file_content') {
        console.log(`Applying multi_replace_file_content from line ${lineIdx}...`);
        for (const chunk of tc.args.ReplacementChunks) {
          applySingleReplace(chunk.TargetContent, chunk.ReplacementContent, lineIdx);
        }
      }
    }
  } catch (e) {
    console.error(`Error applying line ${lineIdx}:`, e.message);
    process.exit(1);
  }
}

const targetPath = 'c:\\Users\\Acer\\Desktop\\zenzy\\app\\[slug]\\page.tsx';
fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log(`Successfully reconstructed app/[slug]/page.tsx at step 149!`);
