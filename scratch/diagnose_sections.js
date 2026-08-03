const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// These are the known dedented comment lines that should be properly indented
// AND some need to be converted back to section openings that the corrupt text was part of.
// 
// Original structure was like:
//   <section className="..."> {/* ═══ SECTION TITLE ═══ */}
// The corrupt script stripped everything, leaving just: {/* SECTION TITLE */}
// 
// We need to fix:
// Line 846: {/* HERO SLIDESHOW */}  => just re-indent (the actual <section> is on line 847)
// Line 950: {/* UNIVERSAL SEARCH BAR */} => needs to become the <section> opening tag
// Line 1249: {/* SERVICE CATEGORIES */}  => just re-indent (the actual <section> is on 1250)
// Line 1323: {/* TRENDING PROS */}  => check if section tag follows or is missing
// Line 1461: {/* PREMIUM BOOKING TRUST BANNER */} => check
// Line 1514: {/* PREMIUM SUBSCRIPTION CTA */} => check
// Line 1555: {/* HOW IT WORKS */} => check
// Line 1596: {/* ANIMATED STATS */} => check
// Line 1668: {/* RENT PREVIEW */} => check
// Line 1805: {/* FAQs */} => check
// Line 1912: {/* SUPPORT / HELP DESK BANNER */} => check

// Strategy: 
// For each corrupted comment line, check if the next non-empty line is a <section or element.
// If yes: just re-indent the comment line to 8 spaces (it's inside the main div wrapper).
// For line 950 specifically, the search bar has no <section> following — we need to add one.

const fixes = [];
const commentLineNums = [846, 950, 1249, 1323, 1461, 1514, 1555, 1596, 1668, 1805, 1912];

for (const lineNum of commentLineNums) {
  const idx = lineNum - 1;
  const line = lines[idx];
  // Check if next non-empty line starts with a <section  
  let nextIdx = idx + 1;
  while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
  const nextLine = lines[nextIdx];
  const nextHasSection = nextLine && nextLine.trim().startsWith('<section');
  
  console.log(`Line ${lineNum}: "${line}" | next: "${nextLine.trim().slice(0, 60)}" | hasSection=${nextHasSection}`);
  fixes.push({ lineNum, idx, line, nextHasSection, nextLine });
}
