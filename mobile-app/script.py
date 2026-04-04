import glob
import re

for filepath in glob.glob('src/screens/*.tsx'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern_text = r'<Text style=\{styles\.coinBadgeText\}>[^{]+?(credits\?\.credits[^}]+?)\s*\}</Text>'
    replacement_text = r'<Text style={styles.coinIcon}>' + chr(0x1FA99) + r'</Text>\n              <Text style={styles.coinBadgeText}>{\1}</Text>'
    
    new_content = re.sub(pattern_text, replacement_text, content)
    
    style_badge_pattern = r'coinBadge:\s*\{[^}]*\}'
    style_badge_replacement = '''coinBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  }'''
    new_content = re.sub(style_badge_pattern, style_badge_replacement, new_content, flags=re.MULTILINE)
    
    if new_content != content:
        # Avoid creating duplicates of coinIcon
        if 'coinIcon:' not in new_content:
            new_content = re.sub(
                r"(coinBadgeText:\s*\{\s*color:\s*'#fff',\s*fontSize:\s*12,\s*fontWeight:\s*'bold',?\s*\})",
                r"\1,\n    coinIcon: { fontSize: 12 }",
                new_content
            )
            # Some screens had a more compact form:
            new_content = re.sub(
                r"(coinBadgeText:\s*\{[^}]*color:\s*colors\.warning,\s*fontSize:\s*12,\s*fontWeight:\s*'700'[^}]*\})",
                r"\1,\n  coinIcon: { fontSize: 12 }",
                new_content
            )
        print("Updated " + filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Done!")
