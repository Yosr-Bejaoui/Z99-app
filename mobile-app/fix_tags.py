import os
import re

SCREENS = [
    'src/screens/ImageGenScreen.tsx',
    'src/screens/VoiceCloningScreen.tsx',
    'src/screens/TextToSpeechScreen.tsx',
    'src/screens/SpeechToTextScreen.tsx',
    'src/screens/TextToVideoScreen.tsx',
    'src/screens/ImageToVideoScreen.tsx',
    'src/screens/ImageUpscalerScreen.tsx',
    'src/screens/BackgroundRemoverScreen.tsx',
    'src/screens/VideoWatermarkRemoverScreen.tsx',
    'src/screens/VideoUpscalerScreen.tsx',
    'src/screens/ImageWatermarkRemoverScreen.tsx',
]

for screen in SCREENS:
    if os.path.exists(screen):
        with open(screen, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix dangling </View> across all screens
        content = re.sub(r'<View style=\{styles\.headerButton\} />\s*</View>\s*(?:</View>\s*)+',
                         r'<View style={styles.headerButton} />\n      </View>\n', content)
        
        # In BackgroundRemoverScreen.tsx, remove styles.title references
        if 'BackgroundRemoverScreen' in screen:
            content = content.replace('<Text style={styles.title}>AI Background Remover</Text>', '')
        
        # Add missing headerButton styles if missing
        if 'headerTitle: {' in content and 'headerButton: {' not in content:
            content = content.replace('headerTitle: {', r'''headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {''')
            
        with open(screen, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {screen}")

