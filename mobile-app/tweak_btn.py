import os, re

file_path = 'src/components/GradientButton.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Update exact CSS block
code = re.sub(r'size_md:\s*\{[^}]*\}', '''size_md: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    shadowColor: '#10a37f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  }''', code)

code = code.replace("activeOpacity={0.7}", "activeOpacity={0.8}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)
