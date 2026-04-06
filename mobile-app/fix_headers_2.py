import glob
import re

files = {
    'ImageTo3DScreen.tsx': 'Image to 3D',
    'ImageToVideoScreen.tsx': 'Image to Video',
    'VideoEffectsScreen.tsx': 'Video Effects',
    'VideoUpscalerScreen.tsx': 'Video Upscaler',
    'TextToSpeechScreen.tsx': 'Text to Speech',
    'TextToVideoScreen.tsx': 'Text to Video'
}

for f, title in files.items():
    with open('src/screens/' + f, encoding='utf-8') as file:
        content = file.read()
    
    if '<ScreenHeader ' not in content:
        content = content.replace('<SafeAreaView style={styles.container}>', f'<SafeAreaView style={{styles.container}}>\n        <ScreenHeader title=\"{title}\" />')
        
    with open('src/screens/' + f, 'w', encoding='utf-8') as file:
        file.write(content)
        print('Fixed Header in', f)
