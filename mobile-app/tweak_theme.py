import re

file_path = 'src/theme/colors.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r"card:\s*'#2f2f2f',", "card: '#2f2f2f',\n  cardBorder: 'rgba(255,255,255,0.07)',", code)
code = re.sub(r"textPrimary:\s*'#ececec',", "textPrimary: '#ececec',", code)
code = re.sub(r"textSecondary:\s*'#b4b4b4',", "textSecondary: '#b4b4b4',", code)
code = re.sub(r"white:\s*'#ffffff',", "white: '#ececec',", code) # replace pure white

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)
