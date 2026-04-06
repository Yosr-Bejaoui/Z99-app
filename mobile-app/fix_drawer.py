import os
import re

path = 'src/navigation/DrawerNavigator.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# For safety, just do a regex replace for duplicates
# Removing duplicates of BackgroundRemoverScreen and ImageTo3DScreen cases
text = re.sub(
    r'(case\s+\'BackgroundRemoverScreen\':\s*return\s*<BackgroundRemoverScreen\s*/>;\s*case\s+\'ImageTo3DScreen\':\s*return\s*<ImageTo3DScreen\s*/>;\s*){2,}', 
    r'case \'BackgroundRemoverScreen\':\n          return <BackgroundRemoverScreen />;\n        case \'ImageTo3DScreen\':\n          return <ImageTo3DScreen />;\n',
    text
)

# Try targeted replace if the regex missed the exact whitespace
dup_segment = """        case 'BackgroundRemoverScreen':
          return <BackgroundRemoverScreen />;
        case 'ImageTo3DScreen':
          return <ImageTo3DScreen />;


        case 'BackgroundRemoverScreen':
          return <BackgroundRemoverScreen />;
        case 'ImageTo3DScreen':
          return <ImageTo3DScreen />;"""

replacement = """        case 'BackgroundRemoverScreen':
          return <BackgroundRemoverScreen />;
        case 'ImageTo3DScreen':
          return <ImageTo3DScreen />;"""

text = text.replace(dup_segment, replacement)

# Remove old imports & switch cases
to_remove = [
    'TextRemoverScreen',
    'BackgroundGenScreen',
    'VideoWatermarkRemoverScreen',
    'ImageWatermarkRemoverScreen',
    'ImageToVideoScreen'
]

for name in to_remove:
    # import Remove
    text = re.sub(r'import\s+' + name + r'\s+from\s*[\'\"].*?[\'\"];?\n?', '', text)
    # case Remove
    text = re.sub(r'case\s+[\'\"]' + name + r'[\'\"]:\s*return\s*<' + name + r'\s*/>;?\n?', '', text)
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

# We should also check DrawerContent.tsx as it manages the menus!
path2 = 'src/components/DrawerContent.tsx'
if os.path.exists(path2):
    with open(path2, 'r', encoding='utf-8') as f:
        text2 = f.read()
        
    for name in to_remove:
        # Menus in DrawerContent look like:
        # { icon: '... ', label: '...', route: 'TextRemoverScreen' },
        # We can regex to remove the whole dictionary object that has route: 'Name'
        text2 = re.sub(r'\{\s*icon:\s*[^\}]*route:\s*[\'\"]' + name + r'[\'\"]\s*\},\n?\s*', '', text2)
        
    with open(path2, 'w', encoding='utf-8') as f:
        f.write(text2)

# Also check DrawerNavigator if those menus are defined there instead
# DrawerNavigator might also have those menu items locally!
for name in to_remove:
    text = re.sub(r'\{\s*icon:\s*[^\}]*route:\s*[\'\"]' + name + r'[\'\"]\s*\},\n?\s*', '', text)
    
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Done fixing!')