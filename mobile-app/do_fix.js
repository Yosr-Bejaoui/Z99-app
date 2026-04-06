const fs = require('fs');
const path = require('path');

function doReplace(dir) {
  let c = 0;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      c += doReplace(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let orig = fs.readFileSync(p, 'utf-8');
      
      const regex1 = /<Text\s+style=\{styles\.coinBadgeText\}>([^<]*\{credits\?\.credits\s*\|\|\s*0(?:[^\}]*\})?)<\/Text>/g;
      const target1 = '<Text style={styles.coinBadgeText}>{"\\\\u{1FA99}"} {credits?.credits || 0}</Text>';

      const regex2 = /<Text\s+style=\{styles\.coinIcon\}>[^<]*<\/Text>/g;
      const target2 = '<Text style={styles.coinIcon}>{"\\\\u{1FA99}"}</Text>';

      let content = orig.replace(regex1, target1).replace(regex2, target2);

      if (orig !== content) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log('Fixed', p);
        c++;
      }
    }
  }
  return c;
}

console.log('Total fixed:', doReplace('src'));
