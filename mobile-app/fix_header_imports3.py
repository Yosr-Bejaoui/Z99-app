import glob

files = [
    'src/screens/ImageTo3DScreen.tsx', 'src/screens/ImageToVideoScreen.tsx',
    'src/screens/VideoEffectsScreen.tsx', 'src/screens/VideoUpscalerScreen.tsx',
    'src/screens/TextToSpeechScreen.tsx', 'src/screens/TextToVideoScreen.tsx'
]

for f in files:
    try:
        with open('mobile-app/' + f, encoding='utf-8') as file:
            content = file.read()
            
        content = content.replace("import React\nimport { ScreenHeader } from '../components/ui/ScreenHeader';,", "import React,")
        
        with open('mobile-app/' + f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Fixed import in', f)
    except FileNotFoundError:
        print('Skipping', f, 'as it was not found')
