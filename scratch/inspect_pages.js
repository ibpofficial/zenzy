const fs = require('fs');
const path = require('path');

function getPages(dir, result = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      getPages(full, result);
    } else if (file === 'page.tsx') {
      result.push(full);
    }
  }
  return result;
}

const appDir = path.join(__dirname, '../app');
const pages = getPages(appDir);

console.log("Found page.tsx files:");
pages.forEach(p => {
  const rel = path.relative(appDir, p);
  const content = fs.readFileSync(p, 'utf8');
  const isClient = content.includes('"use client"') || content.includes("'use client'");
  console.log(`- app/${rel}: ${isClient ? 'Client Component' : 'Server Component'}`);
});
