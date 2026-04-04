import glob
import re

for file_path in glob.glob('src/screens/*.tsx'):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and replace coinBadge
    new_content = re.sub(
        r'coinBadge:\s*\{[^}]*\},',
        r'''coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },''',
        content,
        flags=re.MULTILINE
    )
    
    # Also find if it's the last element without comma
    new_content = re.sub(
        r'coinBadge:\s*\{[^}]*\}\s*\n',
        r'''coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },\n''',
        new_content,
        flags=re.MULTILINE
    )

    new_content = re.sub(
        r'coinBadgeText:\s*\{[^}]*\},',
        r'''coinBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },''',
        new_content,
        flags=re.MULTILINE
    )

    new_content = re.sub(
        r'coinBadgeText:\s*\{[^}]*\}\s*\n',
        r'''coinBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }\n''',
        new_content,
        flags=re.MULTILINE
    )
    
    if new_content != content:
        print(f"Updated {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

