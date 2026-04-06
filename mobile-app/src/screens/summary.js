const fs = require('fs');
const path = require('path');

const files = [
    'BackgroundRemoverScreen.tsx', 'ImageEditorScreen.tsx', 'ImageGenScreen.tsx', 'ImageTo3DScreen.tsx',
    'ImageToVideoScreen.tsx', 'ImageUpscalerScreen.tsx', 'SpeechToTextScreen.tsx', 'TextToSpeechScreen.tsx',
    'TextToVideoScreen.tsx', 'VideoEffectsScreen.tsx', 'VideoUpscalerScreen.tsx', 'VoiceCloningScreen.tsx'
];

let report = [];

files.forEach(f => {
    let fileReport = [];
    const fullPath = path.join(process.cwd(), f); // Assume we run from screens folder
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 1. Headers
        if (content.includes('<ScreenHeader')) {
            if (content.replace(/\s/g, '').includes('<ScreenHeader/>') || !/<ScreenHeader[^>]*title=/.test(content)) {
                fileReport.push('- Has a broken or missing `title` prop on `<ScreenHeader>`. Change to e.g. `<ScreenHeader title="Screen Name" />`');
            }
        } else {
            fileReport.push('- Missing `<ScreenHeader>` entirely.');
        }
        
        // 2. Coins
        if (content.toLowerCase().includes('coins')) {
            fileReport.push('- Contains hardcoded `"coins"` instead of `"credits"` (e.g. `Alert.alert` or `showToast`).');
        }
        
        // 3. BOM
        if (content.includes('\uFEFF') || content.includes('ï»¿')) {
            fileReport.push('- Contains stray BOM/strange characters (e.g. `ï»¿`).');
        }
        
        // 4. Tags and consts
        if (content.includes('const const ')) {
            fileReport.push('- Has a duplicated `const const` keyword that needs fixing.');
        }
        if (/<\w+[^>]*\}/.test(content) || content.includes('<View}')) {
            fileReport.push('- Has a malformed closing tag syntax like `<View}` instead of `<View>`.');
        }
        
        // 5. Hardcoded URLs
        const urlMatches = content.match(/uri\s*:\s*['"](https?:\/\/[^'"]+)['"]/ig);
        if (urlMatches && urlMatches.length > 0) {
            // Find if there's no state variable conditionally showing this
            fileReport.push(`- Uses hardcoded URL(s) (\`${urlMatches[0]}\`) indiscriminately in place of real state outputs without fallback UI.`);
        }
        
        // 6. SafeAreaView / ScrollView
        if (!content.includes('SafeAreaView')) {
            fileReport.push('- Missing `<SafeAreaView>` wrapper causing layout to break on modern devices.');
        }
        if (!content.includes('ScrollView')) {
            fileReport.push('- Missing `<ScrollView>` for content body, which may cause clipping.');
        }
        
        if (fileReport.length > 0) {
            report.push(`### \`${f}\`\n` + fileReport.join('\n'));
        } else {
            report.push(`### \`${f}\`\n- No major issues detected based on criteria.`);
        }
        
    } catch(e) {
        report.push(`### \`${f}\`\n- Error reading file: ${e.message}`);
    }
});

fs.writeFileSync('C:/Users/user/Desktop/multiple-ai-model-system-20260204T220529Z-1-001/diagnostic.md', report.join('\n\n'));
console.log("Done.");
