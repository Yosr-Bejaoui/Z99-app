const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            walk(file, results);
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
let count = 0;

const spaceMap = {
    '4': 'spacing.xs',
    '8': 'spacing.sm',
    '12': 'spacing.md',
    '16': 'spacing.lg',
    '20': 'spacing.lg', // map 20 to lg or xl. Since it's between 16 and 24, let's map to lg to keep it tight, or xl. We'll use 20 -> spacing.xl to be safe? Or spacing.lg. Let's do `spacing.lg`.
    '24': 'spacing.xl',
    '32': 'spacing.xxl',
    '48': 'spacing.xxxl'
};

const keys = [
    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
    'gap', 'rowGap', 'columnGap'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    keys.forEach(key => {
        // e.g. padding: 16, or marginTop: 8 
        // regex: /padding:\s*(4|8|12|16|20|24|32|48)(,\s*|(?=\s*}|\r?\n))/g
        const regex = new RegExp(`\\b${key}:\\s*(4|8|12|16|20|24|32|48)\\b`, 'g');
        content = content.replace(regex, (match, val) => {
            return `${key}: ${spaceMap[val]}`;
        });
    });

    if (content !== original) {
        // Automatically inject `spacing` import if it isn't there, just in case
        if (!content.includes('spacing')) {
            // Find where colors or theme is imported
            if (content.includes("from '../theme'") && !content.includes("spacing")) {
                content = content.replace(/([import { ]*)(.*)( } from '\.\.\/theme')/, (match, p1, p2, p3) => {
                    if(p2.includes('colors')) {
                        return p1 + p2 + ', spacing' + p3;
                    }
                    return match;
                });
            } else if (content.includes("from '../../theme'") && !content.includes("spacing")) {
                content = content.replace(/([import { ]*)(.*)( } from '\.\.\/\.\.\/theme')/, (match, p1, p2, p3) => {
                    if(p2.includes('colors')) {
                        return p1 + p2 + ', spacing' + p3;
                    }
                    return match;
                });
            } else {
                 // Maybe it doesn't use the theme at all, skip inject for now or manually inject.
                 // let's just prepend if not present
                 if(!content.includes("from '../theme'") && !content.includes("from '../../theme'")) {
                     const relativePath = f.split(/[\/\\]/).length > 2 ? "'../../theme'" : "'../theme'";
                     content = `import { spacing } from ${relativePath};\n` + content;
                 }
            }
        }

        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed spacing in:', f);
        count++;
    }
});

console.log(`Fixed ${count} files with spacing issues.`);
