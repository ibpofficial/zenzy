const ts = require('./node_modules/typescript');
const fs = require('fs');

const fileName = 'app/admin/page.tsx';
const sourceText = fs.readFileSync(fileName, 'utf8');

const program = ts.createProgram([fileName], {
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  checkJs: false,
  noEmit: true,
  skipLibCheck: true,
  noResolve: true,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
});

const sourceFile = program.getSourceFile(fileName);
const diags = program.getSyntacticDiagnostics(sourceFile);

if (diags.length === 0) {
  console.log('✓ No syntax errors found!');
} else {
  const lines = sourceText.split('\n');
  diags.slice(0, 10).forEach(d => {
    const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
    const lineIdx = pos.line;
    const col = pos.character;
    const msg = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
    console.log(`ERROR at line ${lineIdx + 1}, col ${col + 1}: ${msg}`);
    for (let i = Math.max(0, lineIdx - 1); i <= Math.min(lines.length - 1, lineIdx + 1); i++) {
      const marker = i === lineIdx ? '>>>' : '   ';
      console.log(`  ${marker} ${i + 1}: ${lines[i].substring(0, 120)}`);
    }
    console.log();
  });
  console.log(`Total errors: ${diags.length}`);
}
