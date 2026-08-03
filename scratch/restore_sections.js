const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// All comment lines at col 0 that need fixing
// Most just need re-indenting to 8 spaces
// Line 950 needs its <section> restored

// Let's look at more context around line 950 to understand the section
// The search bar section likely overlapped the hero with negative margin
// Lines after 950: 951=backdrop dimming, 952=showSuggestions, 959=form...
// Lines before 950: 948=</section>, 949=blank...
// The search section should have indentation like: "        " (8 spaces)
// and a className like the rest of the search-bar-section sections in the file

// Since we don't have git, let's look at the original error message context:
// The original build error said line 1247 has </section> before comment
// The search section spans from 950 to 1247 (closing at 1247)
// The section opens right after the hero section closes at 948

// Based on the design (hero then search bar section overlapping):
// The section had: className="relative z-50 max-w-7xl mx-auto w-full px-4 sm:px-8 -mt-10 sm:-mt-14"
// or similar. Let's keep it consistent with neighboring sections.

// FIX STRATEGY:
// 1. Lines that just need re-indent (comment only, section follows):
const reindentLines = [846, 1249, 1323, 1461, 1514, 1555, 1596, 1668, 1805, 1912];

// 2. Line 950 needs full section opening restoration
// Based on the search bar position (it overlaps the hero slideshow), a reasonable className:
const searchBarSectionOpen = `        <section className="relative z-50 max-w-7xl mx-auto w-full px-4 sm:px-8 -mt-10 sm:-mt-14">
          {/* UNIVERSAL SEARCH BAR */}`;

// Apply fixes:
for (const lineNum of reindentLines) {
  const idx = lineNum - 1;
  const currentLine = lines[idx];
  // Just move it to proper indentation (8 spaces inside main div > section level)
  const label = currentLine.trim();
  lines[idx] = '        ' + label;
  console.log(`Re-indented line ${lineNum}: "${lines[idx]}"`);
}

// Fix line 950: replace dedented comment with proper section opening
{
  const idx = 950 - 1;
  lines[idx] = searchBarSectionOpen;
  console.log(`Restored search bar section at line 950`);
}

const result = lines.join('\n');
fs.writeFileSync(filePath, result, 'utf8');
console.log('\nAll fixes applied. File saved.');
