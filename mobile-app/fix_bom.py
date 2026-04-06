import codecs

f = 'src/screens/VideoUpscalerScreen.tsx'
with open(f, 'r', encoding='utf-8') as file:
    content = file.read()

content = content.replace("ï»¿import React\n", "")
content = content.replace("\ufeffimport React\n", "")
content = content.replace("\ufeff", "")

with open(f, 'w', encoding='utf-8') as file:
    file.write(content)
print('Fixed BOM in', f)
