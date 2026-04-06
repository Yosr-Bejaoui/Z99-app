const fs = require('fs');
const glob = fs.readdirSync('src/screens').filter(f => f.endsWith('.tsx')).map(f => 'src/screens/' + f);

const spacingMap = {
  '2': 'spacing.xs',
  '4': 'spacing.xs',
  '5': 'spacing.xs',
  '6': 'spacing.xs',
  '8': 'spacing.sm',
  '10': 'spacing.md',
  '12': 'spacing.md',
  '14': 'spacing.md',
  '15': 'spacing.lg',
  '16': 'spacing.lg',
  '18': 'spacing.lg',
  '20': 'spacing.lg',
  '22': 'spacing.lg',
  '24': 'spacing.xl',
  '25': 'spacing.xl',
  '30': 'spacing.xxl',
  '32': 'spacing.xxl',
  '35': 'spacing.xxl',
  '40': 'spacing.xxxl',
  '45': 'spacing.xxxl',
  '48': 'spacing.xxxl',
  '50': 'spacing.xxxl'
};

let totalReplacements = 0;

for (const file of glob) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/(paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|padding|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|margin):\s*(-?\d+)/g, (match, prop, val) => {
        // Only replace valid non-negative values from map
        if (!val.startsWith('-') && spacingMap[val]) {
            totalReplacements++;
            let mapped = spacingMap[val];
            return `${prop}: ${mapped}`;
        }
        return match;
    });

    if (content !== original) {
        // Ensure spacing is imported
        if (!content.includes('spacing.')) {
            // we replaced it so `spacing` is now in content
            content = content + ""; // No-op, just keeping block structured
        }
        
        let needsImport = content.includes('spacing.') && !content.includes('spacing,') && !content.includes(', spacing') && !content.includes('{ spacing }');
        if (needsImport) {
            if (content.includes("from '../theme/colors'")) {
                content = content.replace(/import\s+\{([^}]+)\}\s+from\s+'\.\.\/theme\/colors'/, (match, p1) => {
                    return `import { ${p1.trim()}, spacing } from '../theme/colors'`;
                });
            } else if (content.includes("from '../theme'")) {
                content = content.replace(/import\s+\{([^}]+)\}\s+from\s+'\.\.\/theme'/, (match, p1) => {
                    return `import { ${p1.trim()}, spacing } from '../theme'`;
                });
            } else {
                content = `import { spacing } from '../theme/tokens';\n` + content;
            }
        }
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
    }
}
console.log(`Total replaced: ${totalReplacements}`);
