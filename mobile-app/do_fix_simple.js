const fs = require('fs');
const path = require('path');

function replaceAll(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      count += replaceAll(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let orig = fs.readFileSync(p, 'utf-8');
      
      let s = orig.replace(/<Text\s+style=\{styles\.coinBadgeText\}>.*?<\/Text>/g, 
        '<Text style={styles.coinBadgeText}>{"\\\\u{1FA99}"} {credits?.credits || 0}</Text>');

      s = s.replace(/<Text\s+style=\{styles\.coinIcon\}>.*?<\/Text>/g, 
        '<Text style={styles.coinIcon}>{"\\\\u{1FA99}"}</Text>');

      if (orig !== s) {
        fs.writeFileSync(p, s, 'utf-8');
        console.log('Fixed:', p);
        count++;
      }
    }
  }
  return count;
}
console.log('Total fixed:', replaceAll('src'));
