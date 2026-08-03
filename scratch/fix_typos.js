const fs = require('fs');
const path = require('path');

const targetPath = 'c:\\Users\\Acer\\Desktop\\zenzy\\app\\[slug]\\page.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Enforce strict isSelf logic
content = content.replace(
  'const isSelf = user?.uid === worker.id;',
  'const isSelf = !!user && !!worker && user.uid === worker.id;'
);

// 2. Add canEdit check in mutate handlers
const handlers = [
  { name: 'handleFileDrop', search: 'const handleFileDrop = async (e: React.DragEvent, type: "avatar" | "cover" | "project") => {\n    e.preventDefault();', replace: 'const handleFileDrop = async (e: React.DragEvent, type: "avatar" | "cover" | "project") => {\n    e.preventDefault();\n    if (!canEdit) return;' },
  { name: 'handleSaveGeneralInfo', search: 'const handleSaveGeneralInfo = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveGeneralInfo = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveProjectShowcase', search: 'const handleSaveProjectShowcase = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveProjectShowcase = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteProject', search: 'const handleDeleteProject = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteProject = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveCareer', search: 'const handleSaveCareer = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveCareer = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteCareer', search: 'const handleDeleteCareer = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteCareer = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveCustomSection', search: 'const handleSaveCustomSection = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveCustomSection = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteCustomSection', search: 'const handleDeleteCustomSection = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteCustomSection = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveQuotation', search: 'const handleSaveQuotation = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveQuotation = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteQuotation', search: 'const handleDeleteQuotation = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteQuotation = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveTeam', search: 'const handleSaveTeam = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveTeam = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteTeam', search: 'const handleDeleteTeam = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteTeam = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handleSaveMkt', search: 'const handleSaveMkt = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker) return;', replace: 'const handleSaveMkt = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!worker || !canEdit) return;' },
  { name: 'handleDeleteMkt', search: 'const handleDeleteMkt = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeleteMkt = async (idx: number) => {\n    if (!worker || !canEdit) return;' },
  { name: 'handlePortfolioChange', search: 'const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    const files = e.target.files;\n    if (!files || !worker) return;', replace: 'const handlePortfolioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    const files = e.target.files;\n    if (!files || !worker || !canEdit) return;' },
  { name: 'handleDeletePortfolioImage', search: 'const handleDeletePortfolioImage = async (idx: number) => {\n    if (!worker) return;', replace: 'const handleDeletePortfolioImage = async (idx: number) => {\n    if (!worker || !canEdit) return;' }
];

for (const h of handlers) {
  if (content.includes(h.search)) {
    content = content.replace(h.search, h.replace);
    console.log(`Applied check to handler: ${h.name}`);
  } else {
    console.warn(`Could not find handler to apply check: ${h.name}`);
  }
}

// 3. Add canEdit check in input onChange functions
content = content.replace(
  'onChange={async (e) => {\n          const file = e.target.files?.[0];',
  'onChange={async (e) => {\n          if (!canEdit) return;\n          const file = e.target.files?.[0];'
);
content = content.replace(
  'onChange={async (e) => {\n          const file = e.target.files?.[0];', // next occurrence (avatar input)
  'onChange={async (e) => {\n          if (!canEdit) return;\n          const file = e.target.files?.[0];'
);
content = content.replace(
  'onChange={async (e) => {\n          const files = e.target.files;\n          if (files) {',
  'onChange={async (e) => {\n          if (!canEdit) return;\n          const files = e.target.files;\n          if (files) {'
);

// 4. Clean up Tailwind typos
const typos = [
  { from: 'text-slate-808', to: 'text-slate-800' },
  { from: 'text-slate-905', to: 'text-slate-900' },
  { from: 'border-slate-205', to: 'border-slate-200' },
  { from: 'text-slate-355', to: 'text-slate-300' },
  { from: 'text-slate-405', to: 'text-slate-400' },
  { from: 'text-slate-750', to: 'text-slate-700' },
  { from: 'text-slate-850', to: 'text-slate-800' },
  { from: 'text-slate-450', to: 'text-slate-500' },
  { from: 'bg-red-655', to: 'bg-red-600' },
  { from: 'text-indigo-650', to: 'text-indigo-600' },
  { from: 'text-indigo-605', to: 'text-indigo-600' },
  { from: 'indigo-505', to: 'indigo-500' },
  { from: 'bg-slate-955', to: 'bg-slate-950' },
  { from: 'bg-red-955', to: 'bg-red-950' },
  { from: 'border-slate-805', to: 'border-slate-800' },
  { from: 'bg-slate-105', to: 'bg-slate-100' }
];

for (const t of typos) {
  const count = (content.split(t.from).length - 1);
  if (count > 0) {
    // replace all occurrences
    content = content.split(t.from).join(t.to);
    console.log(`Replaced typo: ${t.from} -> ${t.to} (${count} occurrences)`);
  }
}

// 5. Update portfolio images grid sizing to match h-44 sm:h-48 rounded-[20px]
content = content.replace(
  'className="h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm relative group bg-slate-100 dark:bg-slate-900 cursor-pointer"',
  'className="h-44 sm:h-48 rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-800/60 shadow-sm relative group bg-slate-100 dark:bg-slate-900 cursor-pointer"'
);
content = content.replace(
  'className="h-28 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 transition duration-200 cursor-pointer bg-black/5 dark:bg-white/5"',
  'className="h-44 sm:h-48 rounded-[20px] border border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 transition duration-200 cursor-pointer bg-black/5 dark:bg-white/5"'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("File modifications complete.");
