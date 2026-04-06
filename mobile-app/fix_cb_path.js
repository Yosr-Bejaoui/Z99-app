const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/screens/**/*.tsx');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('../components/CreditBadge')) {
    content = content.replace(/'\.\.\/components\/CreditBadge'/g, "'../components/ui/CreditBadge'");
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
