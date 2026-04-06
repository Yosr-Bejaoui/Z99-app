import os
import re

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'rb') as fp:
                b = fp.read()
            
            s = b.decode('utf-8', errors='ignore')
            orig = s
            s = re.sub(
                r'<Text\s+style=\{styles\.coinBadgeText\}>.*?</Text>',
                r'<Text style={styles.coinBadgeText}>{"\uD83E\uDE99"} {credits?.credits || 0}</Text>',
                s,
                flags=re.DOTALL
            )
            s = re.sub(
                r'<Text\s+style=\{styles\.coinIcon\}>.*?</Text>',
                r'<Text style={styles.coinIcon}>{"\uD83E\uDE99"}</Text>',
                s,
                flags=re.DOTALL
            )
            
            if orig != s:
                with open(path, 'wb') as fp:
                    fp.write(s.encode('utf-8'))
                print('Fixed', path)
