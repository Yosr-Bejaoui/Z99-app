import os

files = [
    "screens/BackgroundGenScreen.tsx",
    "screens/BackgroundRemoverScreen.tsx",
    "screens/ImageGenScreen.tsx",
    "screens/ImageTranslatorScreen.tsx",
    "screens/ImageUpscalerScreen.tsx",
    "screens/ImageWatermarkRemoverScreen.tsx"
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    # Replace duplicate const { credits } = useCredits();
    content = content.replace("  const { credits } = useCredits();\n", "")
    
    # Import GradientButton if missing
    if "GradientButton" in content and "import GradientButton" not in content:
        content = content.replace("import GlassCard from '../components/GlassCard';", "import GlassCard from '../components/GlassCard';\nimport GradientButton from '../components/GradientButton';")
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
