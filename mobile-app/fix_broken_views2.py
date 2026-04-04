import glob
import re

for file_path in glob.glob('src/screens/*.tsx'):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

        new_content2 = re.sub(
            r'(\s*\<View style=\{styles\.headerButton\}\>\s*\<View style=\{styles\.coinBadge\}\>\s*\<Text style=\{styles\.coinBadgeText\}\>.*?\<\/Text\>\s*\<\/View\>\s*\<\/View\>)\s*(?=\<ScrollView|\<KeyboardAvoidingView)',
            r'\1\n      </View>\n      ',
            content, flags=re.DOTALL
        )
        if new_content2 != content:
             print(f'Fixed {file_path}')
             with open(file_path, 'w', encoding='utf-8') as f:
                 f.write(new_content2)

