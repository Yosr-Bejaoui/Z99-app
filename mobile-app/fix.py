
with open('src/__tests__/components.test.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

if 'import { spacing } from' not in code and 'import { colors, spacing } from' not in code:
    with open('src/__tests__/components.test.tsx', 'w', encoding='utf-8') as f:
        f.write('import { spacing } from \'../theme\';\n' + code)

