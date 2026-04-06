files = [
    'src/screens/ImageTo3DScreen.tsx', 'src/screens/ImageToVideoScreen.tsx',
    'src/screens/VideoEffectsScreen.tsx', 'src/screens/VideoUpscalerScreen.tsx',
    'src/screens/TextToSpeechScreen.tsx', 'src/screens/TextToVideoScreen.tsx'
]

for f in files:
    try:
        with open(f, encoding='utf-8') as file:
            content = file.read()
            
        lines = content.split('\n')
        # clean up multiple import React lines and the erroneous ones.
        filtered_lines = []
        for line in lines:
            if line.strip() == 'import React':
                continue
            filtered_lines.append(line)
        content = '\n'.join(filtered_lines)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Cleaned line in', f)
    except FileNotFoundError:
        pass
