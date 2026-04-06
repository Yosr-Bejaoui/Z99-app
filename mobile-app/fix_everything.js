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

// Maps
const spaceMap = {
    '4': 'spacing.xs',
    '8': 'spacing.sm',
    '12': 'spacing.md',
    '16': 'spacing.lg',
    '20': 'spacing.lg',
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

    // --- 1, 2, 3: DrawerNavigator Issues ---
    if (f.includes('DrawerNavigator.tsx')) {
        const toRemove = ['TextRemoverScreen', 'BackgroundGenScreen', 'VideoWatermarkRemoverScreen', 'ImageWatermarkRemoverScreen', 'ImageToVideoScreen'];
        toRemove.forEach(rm => {
           content = content.replace(new RegExp(`import ${rm} from '\\.\\./screens/${rm}';\\n`, 'g'), '');
           content = content.replace(new RegExp(`\\s*case '${rm}':\\s*return <${rm} />;`, 'g'), '');
        });
        
        // Remove duplicate cases 'BackgroundRemoverScreen', 'ImageTo3DScreen'
        ['BackgroundRemoverScreen', 'ImageTo3DScreen'].forEach(name => {
             const pattern = `case '${name}':\\s*return <${name} />;`;
             const regex = new RegExp(pattern, 'g');
             const matches = content.match(regex);
             if (matches && matches.length > 1) {
                 const firstIndex = content.indexOf(matches[0]);
                 const duplicateIndex = content.indexOf(matches[1], firstIndex + matches[0].length);
                 if (duplicateIndex !== -1) {
                     content = content.substring(0, duplicateIndex) + content.substring(duplicateIndex + matches[1].length);
                 }
             }
        });
        
        // Add ImageEditorScreen import and case
        if (!content.includes('ImageEditorScreen')) {
            content = content.replace(/(import HistoryScreen from '\.\.\/screens\/HistoryScreen';)/, "import ImageEditorScreen from '../screens/ImageEditorScreen';\n$1");
            content = content.replace(/(case 'HistoryScreen':)/, "case 'ImageEditorScreen':\n        return <ImageEditorScreen />;\n      $1");
        }
    }

    // --- 4, 5, 6, 7: Color Issues ---
    content = content.replace(/colors\.(textPrimary|textSecondary|background|surface)\s*\|\|\s*['"]#fff['"]/g, 'colors.$1');
    content = content.replace(/colors\.(textPrimary|textSecondary|background|surface)\s*\|\|\s*['"]#ffffff['"]/g, 'colors.$1');
    content = content.replace(/backgroundColor:\s*['"]#1a1a1a['"]/g, 'backgroundColor: colors.surface');
    content = content.replace(/backgroundColor=['"]#1a1a1a['"]/g, 'backgroundColor={colors.surface}');
    content = content.replace(/color=['"]#fff['"]/g, 'color={colors.white}');
    content = content.replace(/color=['"]#ffffff['"]/g, 'color={colors.white}');
    content = content.replace(/color=['"]#000['"]/g, 'color={colors.black}');
    content = content.replace(/color=['"]#000000['"]/g, 'color={colors.black}');
    content = content.replace(/color:\s*['"]#000['"]/g, 'color: colors.black');
    content = content.replace(/color:\s*['"]#000000['"]/g, 'color: colors.black');

    // --- 8: ScreenHeader fallback colors ---
    if (f.includes('ScreenHeader.tsx')) {
        content = content.replace(/backgroundColor:\s*'rgba\(255,255,255,0\.1\)'/g, 'backgroundColor: colors.cardBorder');
        content = content.replace(/borderRadius:\s*borderRadius\.full\s*\|\|\s*16,/g, 'borderRadius: borderRadius.md,');
    }

    // --- 9, 10, 11: Spacing ---
    keys.forEach(key => {
        const regex = new RegExp(`\\b${key}:\\s*(4|8|12|16|20|24|32|48)(,\s*|(?=\\s*}|\\r?\\n))`, 'g');
        content = content.replace(regex, (match, val, ending) => {
            return `${key}: ${spaceMap[val]}${ending}`;
        });
    });

    if (content !== original) {
        if (!content.includes('spacing') && content.includes('themes')) {
            content = content.replace(/([import { ]*)(.*?)( } from '\.\.\/theme')/, (match, p1, p2, p3) => {
                if(!p2.includes('spacing')) return p1 + p2 + ', spacing' + p3;
                return match;
            });
            content = content.replace(/([import { ]*)(.*?)( } from '\.\.\/\.\.\/theme')/, (match, p1, p2, p3) => {
                if(!p2.includes('spacing')) return p1 + p2 + ', spacing' + p3;
                return match;
            });
        }
    }

    // --- 12, 13, 14, 15: Branding "Z99" ---
    if (content.includes('Z99')) {
        content = content.replace(/"Z99"|'Z99'|(?<=>)Z99(?=<)/g, 'BRAND_NAME');
        if (!content.includes('BRAND_NAME')) {
           // wait... if we replaced it, it includes it now. But we should check imports.
        }
        if (content.includes('BRAND_NAME')) {
            if (content.includes('from \'../theme\'') || content.includes('from \'../../theme\'')) {
                content = content.replace(/([import { \n]*)(.*?)( } from '\.\.\/theme')/, (match, p1, p2, p3) => {
                    if(!p2.includes('BRAND_NAME')) return p1 + p2 + ', BRAND_NAME' + p3;
                    return match;
                });
                content = content.replace(/([import { \n]*)(.*?)( } from '\.\.\/\.\.\/theme')/, (match, p1, p2, p3) => {
                    if(!p2.includes('BRAND_NAME')) return p1 + p2 + ', BRAND_NAME' + p3;
                    return match;
                });
            } else {
                const depth = f.split(/[\/\\]/).length - 2; // src/screens/X.tsx -> 3 parts -> depth 1 -> ../theme
                const rel = depth === 2 ? "'../../theme'" : "'../theme'";
                content = `import { BRAND_NAME } from ${rel};\n` + content;
            }
        }
    }

    // --- 16, 17, 18, 19: Coin Badges ---
    // Fix emojis and hardcoded "20 Coin" etc.
    content = content.replace(/<Text style=\{styles\.coinIcon\}>🪙<\/Text>/g, '<Text style={styles.coinIcon}>{"\\uD83E\\uDE99"}</Text>');
    content = content.replace(/>\s*🪙\s*(\d+)\s*(Coin|Coins|coin|coins|Credit|Credits)?\s*<\/Text>/g, '>{"\\uD83E\\uDE99"} $1 Credits</Text>');
    content = content.replace(/badge="🪙\s*(\d+)\s*(Coin|Coins|coin|coins|Credit|Credits)?"/g, 'badge={"\\uD83E\\uDE99 $1 Credits"}');

    if (content !== original) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed', f);
    }
});

// Also add BRAND_NAME exported properly in theme
let themeStr = fs.readFileSync('src/theme/index.ts', 'utf8');
if (!themeStr.includes('BRAND_NAME')) {
    themeStr += '\nexport const BRAND_NAME = "AI Model";\n';
    fs.writeFileSync('src/theme/index.ts', themeStr, 'utf8');
}
