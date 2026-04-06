const fs = require('fs');
const path = require('path');

const files_to_fix = [
    'ImageEditorScreen.tsx', 'ImageGenScreen.tsx', 'ImageTo3DScreen.tsx',
    'ImageToVideoScreen.tsx', 'ImageUpscalerScreen.tsx', 'VideoEffectsScreen.tsx',
    'VideoUpscalerScreen.tsx', 'SpeechToTextScreen.tsx', 'TextToSpeechScreen.tsx',
    'TextToVideoScreen.tsx', 'VoiceCloningScreen.tsx', 'BackgroundRemoverScreen.tsx'
];

function removeHeaderView(content) {
    const target = 'style={styles.header}';
    let startIndex = 0;
    while (true) {
        startIndex = content.indexOf(target, startIndex);
        if (startIndex === -1) break;

        // find backwards the `<View` that encloses `style={styles.header}`
        let openTagStart = content.lastIndexOf('<View', startIndex);
        if (openTagStart === -1) {
            startIndex += target.length; 
            continue;
        }
        
        let depth = 1;
        let currentIndex = content.indexOf('>', startIndex) + 1;

        while (depth > 0 && currentIndex < content.length) {
            let nextOpen = content.indexOf('<View', currentIndex);
            let nextClose = content.indexOf('</View>', currentIndex);
            
            // Handle self-closing too if needed (unlikely for <View>)
            let nextSelfClose = content.indexOf('/>', currentIndex);
            // We ignore self-closing View since typical views are `<View></View>`.
            // React native views are sometimes `<View />` but styles.header usually wraps something.
            
            if (nextClose === -1) break; // Error
            
            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth++;
                currentIndex = nextOpen + 5;
            } else {
                depth--;
                currentIndex = nextClose + 7;
            }
        }
        
        if (depth === 0) {
            // Remove the whole block
            content = content.substring(0, openTagStart) + content.substring(currentIndex);
            // reset startIndex as content length changed
            startIndex = openTagStart;
        } else {
            startIndex += target.length;
        }
    }
    return content;
}

for (let filename of files_to_fix) {
    let filePath = path.join(__dirname, 'src', 'screens', filename);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. title
    let title_raw = filename.replace('Screen.tsx', '');
    let title = title_raw.replace(/([a-z])([A-Z])/g, '$1 $2');

    // 2. Remove header block recursively properly
    content = removeHeaderView(content);

    // 3. Transform root view to SafeAreaView
    content = content.replace(/import\s*\{(.*?)\}\s*from\s*['"]react-native['"];?/, (match, p1) => {
        if (p1.includes('SafeAreaView')) return match;
        return `import { ${p1.trim()}, SafeAreaView } from 'react-native';`;
    });

    if (!content.includes('import { ScreenHeader }')) {
        content = content.replace(/(import .*?\n)/, `$1import { ScreenHeader } from '../components/ui/ScreenHeader';\n`);
    }

    // drop `const insets = useSafeAreaInsets();`
    content = content.replace(/const\s+insets\s*=\s*useSafeAreaInsets\(\);?[\r\n]*/g, '');

    // The container might be `<View style={styles.container}>` or `<View style={[styles.container, { paddingTop: insets.top }]}>`
    content = content.replace(/<View\s+style=\{\s*styles\.container\s*\}>/, `<SafeAreaView style={styles.container}>\n      <ScreenHeader title="${title}" />`);
    content = content.replace(/<View\s+style=\{\[\s*styles\.container\s*,\s*[^\]]+\]\}>/, `<SafeAreaView style={styles.container}>\n      <ScreenHeader title="${title}" />`);

    // The end tag for the outer container `</SafeAreaView>`
    // Since we know the outer view was renamed to `<SafeAreaView>`, we should rename its matching `</View>`.
    let lastView = content.lastIndexOf('</View>');
    if (lastView !== -1) {
        content = content.substring(0, lastView) + '</SafeAreaView>' + content.substring(lastView + 7);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filename}`);
}
