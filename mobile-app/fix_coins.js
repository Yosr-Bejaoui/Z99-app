const fs = require('fs');

const screens = [
  'src/screens/VideoUpscalerScreen.tsx',
  'src/screens/VoiceCloningScreen.tsx',
  'src/screens/SpeechToTextScreen.tsx',
];

screens.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/<Text style=\{styles\.coinIcon\}>🪙<\/Text>/g, '<Text style={styles.coinIcon}>{\\"\\\\uD83E\\\\uDE99\\"}</Text>');
  
  content = content.replace(/>\s*🪙\s*(\d+)\s*(Coin|Coins|coin|coins|Credit|Credits)?\s*<\/Text>/g, '>{\\"\\\\uD83E\\\\uDE99\\"} \ Credits</Text>');
  
  content = content.replace(/badge="🪙\s*(\d+)\s*(Coin|Coins|coin|coins|Credit|Credits)?"/g, 'badge={\\"\\\\uD83E\\\\uDE99 \ Credits\\"}');
  
  content = content.replace(/badge=\{"🪙\s*(\d+)\s*(Coin|Coins|coin|coins)?\"\}/g, 'badge={\\"\\\\uD83E\\\\uDE99 \ Credits\\"}');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed coins in ' + file);
});