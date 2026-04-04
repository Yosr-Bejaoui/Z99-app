import os
import re

SCREENS = [
    ('src/screens/ImageGenScreen.tsx', 'Image Generator'),
    ('src/screens/VoiceCloningScreen.tsx', 'Voice Cloning'),
    ('src/screens/TextToSpeechScreen.tsx', 'Text to Speech'),
    ('src/screens/SpeechToTextScreen.tsx', 'Speech to Text'),
    ('src/screens/TextToVideoScreen.tsx', 'Text to Video'),
    ('src/screens/ImageToVideoScreen.tsx', 'Image to Video'),
    ('src/screens/ImageUpscalerScreen.tsx', 'Image Upscaler'),
    ('src/screens/BackgroundRemoverScreen.tsx', 'Background Remover'),
    ('src/screens/VideoWatermarkRemoverScreen.tsx', 'Video Watermark'),
    ('src/screens/VideoUpscalerScreen.tsx', 'Video Upscaler'),
    ('src/screens/ImageWatermarkRemoverScreen.tsx', 'Image Watermark'),
]

header_injection = '''<View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={openDrawer}
          accessibilityRole="button"
          accessibilityLabel="Open Menu"
        >
          <Ionicons name="menu-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <View style={styles.headerButton} />
      </View>'''

def fix_header(filepath, title):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make sure openDrawer is imported and used
    if 'useDrawer' not in content:
        content = content.replace("import { useAuth", "import { useAuth, useDrawer")
        if 'useDrawer' not in content:
             content = content.replace("import { colors", "import { useDrawer } from '../context';\nimport { colors")
             
    if 'const { openDrawer } = useDrawer()' not in content:
        content = re.sub(
            r'(const \w+Screen: React\.FC = \(\) => {)',
            r'\1\n  const { openDrawer } = useDrawer();',
            content
        )
        content = re.sub(
            r'(export default function \w+Screen\(\) {)',
            r'\1\n  const { openDrawer } = useDrawer();',
            content
        )

    # Replace <View style={styles.header}> ... </View> up to its closing tag
    # or <View style={styles.topHeader}>
    # Regex logic: find <View style={styles.header}>, balance tags, or just use a non-greedy up to next </View> if simple
    # Because there might be nested Views, balancing is hard with basic regex.
    # An easier way is targeting exactly known structures or just replacing anything between <View style={styles.header}> and </View> that contains 'headerTitle' or 'backButton'
    
    # We will do a somewhat hacky approach but customized.
    content = re.sub(
        r'<View style=\{styles\.(?:header|topHeader)\}>.*?<Text.*?>(.*?)</Text>.*?</View>',
        header_injection.replace('{title}', title),
        content,
        flags=re.DOTALL | re.IGNORECASE,
        count=1
    )

    # Let's fix the header styles as well
    content = re.sub(
        r'header:\s*\{.*?\},|topHeader:\s*\{.*?\},',
        r'''header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },''',
        content,
        flags=re.DOTALL
    )

    content = re.sub(
        r'headerButton:\s*\{.*?\},|iconButton:\s*\{.*?\},',
        r'''headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },''',
        content,
        flags=re.DOTALL
    )

    content = re.sub(
        r'headerTitle:\s*\{.*?\},|topHeaderTitle:\s*\{.*?\},|title:\s*\{.*?\},',
        r'''headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },''',
        content,
        flags=re.DOTALL
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed header in {filepath}")

for screen, title in SCREENS:
    fix_header(screen, title)
