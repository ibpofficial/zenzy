const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const buf = fs.readFileSync(filePath);

console.log("File buffer size:", buf.length);
const index = 44370;
const start = Math.max(0, index - 50);
const end = Math.min(buf.length, index + 50);

console.log(`Hex bytes from ${start} to ${end}:`);
const slice = buf.slice(start, end);
console.log(slice.toString('hex'));

// Let's try parsing as UTF-8 and finding where it fails or what invalid chars are
for (let i = start; i < end; i++) {
  const byte = buf[i];
  console.log(`Index ${i}: 0x${byte.toString(16).toUpperCase()} (${String.fromCharCode(byte)})`);
}
