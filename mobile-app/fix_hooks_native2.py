import os, re, glob

def fix_usedrawer(file):
    try:
        with open('src/screens/' + file, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'useDrawer' in content and 'useDrawer' not in content[:1500]:
            content = re.sub(r"import \{([\s\S]*?)\} from '\.\./context';", r"import {\1, useDrawer} from '../context';", content, count=1)
            with open('src/screens/' + file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed useDrawer in {file}')
    except Exception as e:
        print(e)
        pass

for f in ['ChatScreen.tsx', 'GPTToolsScreen.tsx', 'ReferralScreen.tsx']:
    fix_usedrawer(f)

try:
    with open('src/screens/ImageGenScreen.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    if 'useTranslation' not in content:
        content = "import { useTranslation } from 'react-i18next';\n" + content
        with open('src/screens/ImageGenScreen.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed useTranslation in ImageGenScreen.tsx')
except Exception as e:
    pass

for file in glob.glob('src/screens/*.tsx'):
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        if '../components/CreditBadge' in content:
            content = content.replace('../components/CreditBadge', '../components/ui/CreditBadge')
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed CreditBadge in {file}')
    except Exception as e:
        pass