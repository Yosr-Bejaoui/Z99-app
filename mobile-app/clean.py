import os
import re

def dedup(filepath, props):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    for prop in props:
        # Regex to remove the FIRST instance of the property
        pattern = r'(?m)^\s*' + prop + r':\s*\{[^}]*\},'
        matches = list(re.finditer(pattern, content))
        if len(matches) > 1:
            # remove the latter ones
            for match in matches[1:]:
                content = content[:match.start()] + (' ' * (match.end() - match.start())) + content[match.end():]
                
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

dedup('src/screens/BackgroundRemoverScreen.tsx', ['headerTitle', 'headerButton'])
dedup('src/screens/ImageGenScreen.tsx', ['headerTitle', 'headerButton'])
dedup('src/screens/ImageToVideoScreen.tsx', ['headerTitle'])
dedup('src/screens/TextToVideoScreen.tsx', ['headerTitle'])

with open('src/screens/TextToSpeechScreen.tsx', 'r', encoding='utf-8') as f:
    tts = f.read().replace('styles.resultSubtitle', 'styles.resultTitle')
with open('src/screens/TextToSpeechScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(tts)
    
with open('src/theme/colors.ts', 'r', encoding='utf-8') as f:
    colors = f.read().replace("cardBorder: '#3f3f3f',", "", 1)
with open('src/theme/colors.ts', 'w', encoding='utf-8') as f:
    f.write(colors)

