
const b1 = require('fs').readFileSync('src/screens/ImageGenScreen.tsx');
const b2 = require('fs').readFileSync('src/screens/BackgroundRemoverScreen.tsx');
let ss1 = b1.toString('utf-8');
let ss2 = b2.toString('utf-8');
const regex = /coinBadgeText\}>([^<]*)</;
console.log('ImageGen', JSON.stringify(ss1.match(regex)[1]));
console.log('BgRemov', JSON.stringify(ss2.match(regex)[1]));

