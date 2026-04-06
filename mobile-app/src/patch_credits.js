const fs = require('fs');

let c = fs.readFileSync('src/screens/CreditsScreen.tsx', 'utf8');

c = c.replace(/const renderTransactionsModal = \(\) => \([\s\S]*?\);\n\s*return \(\n/, 'return (\n');

c = c.replace(/\{\s*renderTransactionsModal\(\)\s*\}/, `
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('credits.transactions.title')}</Text>
          <View style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <Text style={styles.noTransactions}>{t('credits.transactions.empty')}</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[styles.txIcon, { backgroundColor: \`\${getTransactionColor(tx.type)}20\` }]}>
                    <Ionicons name={getTransactionIcon(tx.type)} size={20} color={getTransactionColor(tx.type)} />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txDescription}>{tx.description}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: getTransactionColor(tx.type) }]}>
                    {tx.type === 'debit' ? '-' : '+'}{tx.amount}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
`);
fs.writeFileSync('src/screens/CreditsScreen.tsx', c);
console.log('Done');