const fs = require('fs');
const path = require('path');

const dirs = [
  'C:\\Users\\Acer\\AppData\\Roaming\\Antigravity IDE\\User\\History',
  'C:\\Users\\Acer\\AppData\\Roaming\\Code\\User\\History'
];

dirs.forEach(historyDir => {
  if (!fs.existsSync(historyDir)) {
    console.log(`History directory does not exist: ${historyDir}`);
    return;
  }
  console.log(`Scanning: ${historyDir}`);
  const subdirs = fs.readdirSync(historyDir);

  for (const subdir of subdirs) {
    const entriesPath = path.join(historyDir, subdir, 'entries.json');
    if (fs.existsSync(entriesPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
        const res = data.resource || '';
        if (res.includes('page.tsx') || res.includes('page') || res.includes('slug')) {
          console.log(`  Subdir: ${subdir} -> resource: ${res}`);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
});
