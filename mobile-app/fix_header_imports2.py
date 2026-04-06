import glob

files = [
    'src/screens/ImageTo3DScreen.tsx', 'src/screens/ImageToVideoScreen.tsx',
    'src/screens/VideoEffectsScreen.tsx', 'src/screens/VideoUpscalerScreen.tsx',
    'src/screens/TextToSpeechScreen.tsx', 'src/screens/TextToVideoScreen.tsx'
]

for f in files:
    try:
        with open(f, encoding='utf-8') as file:
            content = file.read()
        
        if 'ScreenHeader } from' not in content:
            if 'import React' in content:
                content = content.replace("import React", "import React\nimport { ScreenHeader } from '../components/ui/ScreenHeader';")
            else:
                content = "import { ScreenHeader } from '../components/ui/ScreenHeader';\n" + content
                
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print('Fixed import in', f)
    except FileNotFoundError:
        print('Skipping', f, 'as it was not found')
