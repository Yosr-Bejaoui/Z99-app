const fs = require('fs');
const path = require('path');

function walk(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      count += walk(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let orig = fs.readFileSync(p, 'utf-8');
      
      let content = orig.replace(/<Text\s+style=\{styles\.coinBadgeText\}>.*?<\/Text>/gs, 
        '<Text style={styles.coinBadgeText}>{\"\\uD83E\\uDE99\"} {credits?.credits || 0}</Text>');

      content = content.replace(/<Text\s+style=\{styles\.coinIcon\}>.*?<\/Text>/gs, 
        '<Text style={styles.coinIcon}>{\"\\uD83E\\uDE99\"}</Text>');

      if (orig !== content) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log('Fixed', p);
        count++;
      }
    }
  }
  return count;
}
const total = walk('src');
console.log('Fixed', total, 'files.');
