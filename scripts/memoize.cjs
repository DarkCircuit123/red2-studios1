const fs = require('fs');
const path = require('path');

function recursiveFiles(dir, ext, arr = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      recursiveFiles(full, ext, arr);
    } else if (item.isFile() && full.endsWith(ext)) {
      arr.push(full);
    }
  }
  return arr;
}

const files = recursiveFiles(path.join(__dirname, '../src/components'), '.tsx');
let count = 0;
files.forEach((file) => {
  let text = fs.readFileSync(file, 'utf8');
  const match = text.match(/export default function (\w+)/);
  if (!match) return;
  const name = match[1];
  console.log('processing', file, name);

  let modified = false;
  // add import React if missing
  if (!/import\s+React\b/.test(text)) {
    text = `import React from 'react';\n` + text;
    modified = true;
  }

  // replace definition
  const defRe = new RegExp(`export default function ${name}`);
  if (defRe.test(text)) {
    text = text.replace(defRe, `function ${name}`);
    modified = true;
  }

  // append memo export if not already present
  const memoRe = new RegExp(`React\.memo\\(${name}\\)`);
  if (!memoRe.test(text)) {
    text += `\nexport default React.memo(${name});\n`;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, text);
    count++;
  }
});

console.log(`updated ${count} files`);
