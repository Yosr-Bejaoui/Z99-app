const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/screens/**/*.tsx');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import CreditBadge from \'../components/CreditBadge\';,')) {
    content = content.replace('import React\nimport CreditBadge from \'../components/CreditBadge\';,', 'import React,');
    let lines = content.split('\n');
    lines.splice(1, 0, 'import CreditBadge from \'../components/CreditBadge\';');
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Fixed', file);
  }
}
