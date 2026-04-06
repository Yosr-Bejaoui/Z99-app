
const fs = require('fs');
const b2 = fs.readFileSync('src/screens/BackgroundRemoverScreen.tsx', 'utf-8');
console.log('BgRemov uses ScreenHeader?', b2.includes('ScreenHeader'));

