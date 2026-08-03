const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `              </button>\r\n            </div>:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer shrink-0"\r\n                aria-label="Search"\r\n              >\r\n                <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />\r\n              </button>\r\n            </div>`;
const targetStrLF = targetStr.replace(/\r\n/g, '\n');

if (content.includes(targetStr)) {
  content = content.replace(targetStr, `              </button>\r\n            </div>`);
  console.log("Replaced with CRLF matching.");
} else if (content.includes(targetStrLF)) {
  content = content.replace(targetStrLF, `              </button>\n            </div>`);
  console.log("Replaced with LF matching.");
} else {
  // Let's print out lines around the error to inspect if formatting differs
  console.log("Target string not found literally. Performing line-based replacement.");
  const lines = content.split(/\r?\n/);
  // Find lines
  let foundIndex = -1;
  for (let i = 1110; i < 1140; i++) {
    if (lines[i] && lines[i].includes('</div>:scale-[')) {
      foundIndex = i;
      break;
    }
  }
  if (foundIndex !== -1) {
    console.log(`Found corrupt line at index ${foundIndex}: ${lines[foundIndex]}`);
    // We want to delete from foundIndex to foundIndex + 4 (lines 1123 to 1127)
    // lines[foundIndex] is: "            </div>:scale-[1.02]..."
    // lines[foundIndex+1] is: "                aria-label="Search""
    // lines[foundIndex+2] is: "              >"
    // lines[foundIndex+3] is: "                <Search className="..." />"
    // lines[foundIndex+4] is: "              </button>"
    // lines[foundIndex+5] is: "            </div>"
    
    // We should keep the closing "</div>" at lines[foundIndex+5] or just replace lines[foundIndex..foundIndex+4] with nothing or whatever.
    // Let's replace the lines:
    lines.splice(foundIndex, 5); // deletes the extra elements, leaving only the final closing </div>
    content = lines.join('\n');
    console.log("Successfully removed corrupted lines via line array splice.");
  } else {
    console.log("Failed to find the corrupt line in lines 1110 to 1140.");
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File saved.");
