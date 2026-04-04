import glob
import re

for filepath in glob.glob('src/screens/*.tsx'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for any text inside styling for coinBadgeText that contains credits
    pattern_text = r'<Text style=\{styles\.coinBadgeText\}>[^{]*?(\{credits\?\.credits[^}]+?\})\s*</Text>'
    replacement_text = r'<Text style={styles.coinIcon}>' + chr(0x1FA99) + r'</Text>\n              <Text style={styles.coinBadgeText}>\1</Text>'
    
    new_content = re.sub(pattern_text, replacement_text, content)
    
    if new_content != content:
        # Check if styles.coinIcon already added
        if 'coinIcon:' not in new_content:
            new_content = re.sub(
                r"(coinBadgeText:\s*\{\s*color:\s*'#fff',\s*fontSize:\s*12,\s*fontWeight:\s*'bold',?\s*\})",
                r"\1,\n    coinIcon: { fontSize: 12 }",
                new_content
            )
            # Other form:
            new_content = re.sub(
                r"(coinBadgeText:\s*\{[^}]*color:\s*colors\.warning,\s*fontSize:\s*12,\s*fontWeight:\s*'700'[^}]*\})",
                r"\1,\n    coinIcon: { fontSize: 12 }",
                new_content
            )
        print("Updated text for " + filepath)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Done!")
