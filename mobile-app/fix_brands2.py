import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace literal BRAND_NAME inside tags
    new_content = re.sub(
        r'>BRAND_NAME<',
        r'>{t(\'app.name\')}<',
        new_content
    )

    new_content = re.sub(
        r'(?:©|Â©)\s*2026\s*Z99\.',
        r'© 2026 {t(\'app.name\')}.',
        new_content
    )

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Modified {file_path}")

process_file('src/navigation/DrawerNavigator.tsx')
process_file('src/screens/LandingScreen.tsx')
process_file('src/screens/SplashScreen.tsx')
