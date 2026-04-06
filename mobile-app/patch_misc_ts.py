import os, re
count = 0
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            new_content = content
            new_content = re.sub(r'^\s*\{\s*width\s*\}\s*=\s*Dimensions\.get', 'const { width } = Dimensions.get', new_content, flags=re.MULTILINE)
            new_content = new_content.replace('showToast(getErrorMessage(err, "error"););', 'showToast(getErrorMessage(err, "error"));')
            new_content = new_content.replace('showToast(getErrorMessage(err, "error");', 'showToast(getErrorMessage(err, "error"));')
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                count += 1
                print(f'Fixed {path}')
print(f'Done replacing in {count} files.')
