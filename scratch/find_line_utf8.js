const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);

let line = 1;
let lineStartOffset = 0;
for (let i = 0; i < buf.length; i++) {
  if (i === 44370) {
    console.log(`Byte offset 44370 is on line ${line}`);
    // Print the line content as binary / hex and decoded if possible
    let lineEndOffset = buf.indexOf(10, i); // newline is 10
    if (lineEndOffset === -1) lineEndOffset = buf.length;
    const lineBuf = buf.slice(lineStartOffset, lineEndOffset);
    console.log("Line hex:", lineBuf.toString('hex'));
    console.log("Line raw text:", lineBuf.toString('binary'));
    break;
  }
  if (buf[i] === 10) {
    line++;
    lineStartOffset = i + 1;
  }
}
