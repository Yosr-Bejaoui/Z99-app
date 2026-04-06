const fs = require('fs');
let c = fs.readFileSync('src/screens/CreditsScreen.tsx', 'utf8');

const startIdx = c.indexOf('  const renderTransactionsModal');
const endMarker = '</Modal>';
let endIdx = c.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  // find the next closing parenthesis after </Modal>
  let afterModal = c.indexOf(';', endIdx);
  if (afterModal !== -1) {
    c = c.slice(0, startIdx) + c.slice(afterModal + 1);
  }
}

// Remove the View History button
const viewHistoryStart = c.indexOf('<TouchableOpacity onPress={() => setShowTransactions(true)}>');
if (viewHistoryStart !== -1) {
    const viewHistoryEnd = c.indexOf('</TouchableOpacity>', viewHistoryStart) + '</TouchableOpacity>'.length;
    c = c.slice(0, viewHistoryStart) + c.slice(viewHistoryEnd);
}

// Remove {renderTransactionsModal()} call
c = c.replace(/\{renderTransactionsModal\(\)\}/g, '');

// Clean up import if unused - just to be safe
c = c.replace(/const \[showTransactions, setShowTransactions\] = useState\(false\);\n/g, '');

fs.writeFileSync('src/screens/CreditsScreen.tsx', c);
console.log('Done cleaning up transactions modal');