import glob
import re

for file_path in glob.glob('src/screens/*.tsx'):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Search for missing </View> between coinBadge and ScrollView
    new_content = re.sub(r'(\s*)\<View style=\{styles\.coinBadge\}\>\s*\<Text style=\{styles\.coinBadgeText\}\>.*?\<\/Text\>\s*\<\/View\>\s*\<\/View\>\r?\n(\s*)\<ScrollView',
                         r'\1<View style={styles.coinBadge}>\n\1  <Text style={styles.coinBadgeText}>?? {credits?.credits || 0}</Text>\n\1</View>\n      </View>\n\n      </View>\n\2<ScrollView',
                         content, flags=re.DOTALL)
    
    if new_content != content:
        # Also clean up the missing brace just in case. 
        # Actually I just need to match <View style={styles.headerButton}> \n ... coin badge \n </View> \n <ScrollView
        new_content2 = re.sub(
            r'(\s*\<View style=\{styles\.headerButton\}\>\s*\<View style=\{styles\.coinBadge\}\>\s*\<Text style=\{styles\.coinBadgeText\}\>.*?\<\/Text\>\s*\<\/View\>\s*\<\/View\>)\s*(?=\<ScrollView)',
            r'\1\n      </View>\n      ',
            content, flags=re.DOTALL
        )
        if new_content2 != content:
             print(f'Fixed {file_path}')
             with open(file_path, 'w', encoding='utf-8') as f:
                 f.write(new_content2)

