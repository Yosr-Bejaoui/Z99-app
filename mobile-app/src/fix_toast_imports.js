const fs = require('fs');
const path = require('path');
const screensDir = 'screens';
const files = fs.readdirSync(screensDir);
files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(screensDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/import Toast, \{ showToast \} from \\'..\/components\/Toast\\'\;/g, "import Toast, { showToast } from '../components/Toast';");
        fs.writeFileSync(filePath, content);
    }
});
console.log("Done fixing Toast imports");