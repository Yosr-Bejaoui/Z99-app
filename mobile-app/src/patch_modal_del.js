const fs = require('fs');
let c = fs.readFileSync('src/screens/CreditsScreen.tsx', 'utf8');

c = c.replace(/\s*const renderTransactionsModal = \(\) => \([\s\S]*?<\/Modal>\n\s*\);/g, '');

c = c.replace(/\s*<TouchableOpacity onPress=\{\(\) => setShowTransactions\(true\)\}>\s*<Text style=\{styles\.viewHistoryText\}>\{t\('credits\.balance\.viewHistory'\)\}<\/Text>\s*<\/TouchableOpacity>/g, '');

c = c.replace(/\s*\{renderTransactionsModal\(\)\}/g, '');

fs.writeFileSync('src/screens/CreditsScreen.tsx', c);
console.log('Successfully patched transactions out of the modal');