import os, re
count = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            
            # 4. Fallback '#fff' in colors
            content = re.sub(r'colors\.textPrimary\s*\|\|\s*[\'"]#fff[\'"]', 'colors.textPrimary', content)
            content = re.sub(r'colors\.textSecondary\s*\|\|\s*[\'"]#fff[\'"]', 'colors.textSecondary', content)
            content = re.sub(r'colors\.background\s*\|\|\s*[\'"]#fff[\'"]', 'colors.background', content)
            
            # 5. Hardcoded #1a1a1a backgrounds -> colors.surface
            content = re.sub(r'backgroundColor:\s*[\'"]#1a1a1a[\'"]', 'backgroundColor: colors.surface', content)
            
            # 6. Hardcoded #fff in icons -> colors.white or colors.textPrimary 
            # Note: We probably shouldn't replace *all* #fff since some icons need to be white on colored buttons. 
            # So I will do it specifically later or more carefully. Let's do it carefully.

            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Fixed {path}')
                count += 1

print(f'Fixed {count} files.')