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
      
      // Just aggressively clear whatever is between > and < inside coinBadgeText if it contains {credits
      let content = orig.replace(/<Text\s+style=\{styles\.coinBadgeText\}>([^<]*\{credits\?\.credits\s*\|\|\s*0(?:[^\}]*\})?)<\/Text>/g, 
        '<Text style={styles.coinBadgeText}>{\"\\u{1FA99}\"} {credits?.credits || 0}</Text>');

      // Fix coinIcon
      content = content.replace(/<Text\s+style=\{styles\.coinIcon\}>[^<]*<\/Text>/g, 
        '<Text style={styles.coinIcon}>{\"\\u{1FA99}\"}</Text>');

      if (orig !== content) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log('Fixed', p);
        count++;
      }
    }
  }
  return count;
}
const total = walk('mobile-app/src');
console.log('Fixed', total, 'files.');
