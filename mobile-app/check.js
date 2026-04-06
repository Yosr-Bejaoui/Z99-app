
const fs = require('fs');
const b = fs.readFileSync('src/screens/GPTToolsScreen.tsx', 'utf-8');
const lines = b.split('\n');
const idx = lines.findIndex(l => l.includes('coinIcon:'));
console.log(lines.slice(idx-2, idx+5).join('\n'));

