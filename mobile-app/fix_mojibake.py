import glob
import re

for file_path in glob.glob('src/screens/*.tsx'):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace('🪙', '??')

    style_replacement = '''coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexShrink: 0,
  }'''

    new_content = re.sub(
        r'coinBadge:\s*\{[^}]*\},',
        style_replacement + ',',
        new_content,
        flags=re.MULTILINE
    )
    new_content = re.sub(
        r'coinBadge:\s*\{[^}]*\}\s*\n',
        style_replacement + '\n',
        new_content,
        flags=re.MULTILINE
    )
    
    if new_content != content:
        print(f"Fixed {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

