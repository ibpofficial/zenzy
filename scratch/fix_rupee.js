const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix pricing strings: •399/svc => ₹399/svc etc.
// The • replaced the ₹ (rupee sign) in data objects
content = content
  .replace(/price: "•/g, 'price: "₹')
  .replace(/pricing: "•/g, 'pricing: "₹')
  // Fix stats counter: ratingVal / 10 should give like 4.8 not 4.8•
  // The • on lines 1613/1618 was appended to the rating value string template
  // e.g. `${(ratingVal / 10).toFixed(1)}•` => `${(ratingVal / 10).toFixed(1)}`
  .replace(/\.toFixed\(1\)}•`/g, '.toFixed(1)}`')
  // The rent preview line 1684: "Zero •" => "Zero "  
  .replace(/Zero •/g, 'Zero ')
  // Line 1737: "Bachelors, families, PGs • <span" - this looks like it uses • as separator
  // which is fine, keep it. The render will show • as separator.
  // Line 1835 and 1839 in FAQ text: keep the • in the FAQ answer strings since those are
  // not visible in JSX directly (they are in object literals)
  // Line 1839: •${siteSettings?.signupBonus...} => ₹${siteSettings?.signupBonus...}
  .replace(/a: `Yes\. To ensure.*?\\n/g, (m) => m) // keep as is
  .replace(/signupBonus \?\? 500} signup/g, 'signupBonus ?? 500} signup');

// Fix the FAQ answer with bullet -> rupee
content = content.replace(
  /`New service professionals receive a •\$/g,
  '`New service professionals receive a ₹$'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Rupee sign fixes applied.');

// Verify
const remaining = content.split('\n').filter(l => /[^\x00-\x7F]/.test(l));
console.log('Remaining non-ASCII lines:', remaining.length);
remaining.slice(0, 10).forEach((l, i) => console.log(`  ${i}: ${l.slice(0, 100)}`));
