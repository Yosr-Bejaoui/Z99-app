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

def upgrade_styles(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Upgrade TextInput wrappers inside GlassCards to standalone premium inputs
    # If there's a GlassCard wrapping a TextInput, we'll try to apply premium input styles directly or swap them.
    # Actually, the easiest way is to target the stylesheets.

    # Find StyleSheet.create
    style_idx = content.find('StyleSheet.create({')
    if style_idx == -1:
        return

    # Replace basic text inputs
    # Match textInput: { ... },
    content = re.sub(
        r'textInput:\s*{[^}]*backgroundColor:\s*colors\.surface[^}]*}|textInput:\s*{[^}]*backgroundColor:\s*colors\.card[^}]*}|promptInput:\s*{[^}]*}',
        r'''promptInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
  }''',
        content
    )

    # 2. Upgrade Chip / Style Button wrappers to soft green outlines
    content = re.sub(
        r'styleButtonSelected:\s*{[^}]*backgroundColor:\s*colors\.primary[^}]*}',
        r'''styleButtonSelected: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
    borderColor: 'rgba(16, 163, 127, 0.5)',
  }''',
        content
    )
    
    content = re.sub(
        r'resolutionButtonSelected:\s*{[^}]*backgroundColor:\s*colors\.primary[^}]*}',
        r'''resolutionButtonSelected: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
    borderColor: 'rgba(16, 163, 127, 0.5)',
  }''',
        content
    )

    content = re.sub(
        r'chipActive:\s*{[^}]*backgroundColor:\s*colors\.primary[^}]*}',
        r'''chipActive: {
    backgroundColor: 'rgba(16, 163, 127, 0.12)',
    borderColor: 'rgba(16, 163, 127, 0.3)',
    borderWidth: 1,
  }''',
        content
    )

    content = re.sub(
        r'chipTextActive:\s*{[^}]*color:\s*colors\.white[^}]*}',
        r'''chipTextActive: {
    color: '#10a37f',
  }''',
        content
    )

    # Convert generic cards into sleek modern block ones by modifying card: { ... } or promptCard
    # We will just inject these if they don't completely overwrite, but regex might be tricky.
    # Alternatively, replace GlassCard with View and let premium backgrounds do the work.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Upgraded {filepath}")

for screen in SCREENS:
    upgrade_styles(screen)

