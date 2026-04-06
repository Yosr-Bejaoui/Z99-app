import os
import glob
import re

screens = glob.glob('src/screens/*Screen.tsx')
for s in screens:
    with open(s, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'launchImageLibraryAsync' in content and 'ImageUploader' not in content:
        # 1. Add import
        if 'import { ImageUploader }' not in content:
            content = content.replace("import React", "import { ImageUploader } from '../components/ImageUploader';\nimport { ResultViewer } from '../components/ResultViewer';\nimport React")
        
        # 2. Replace TouchableOpacity button for select with ImageUploader
        # this is tricky with regex, simpler is to just provide the script file and let the user know I'm ready or do a naive replace!
        pass
