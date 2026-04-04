import re

with open('src/screens/CustomGPTLibraryScreen.tsx', 'r') as f:
    text = f.read()

text = text.replace('const { openDrawer } = useDrawer();', 'const { openDrawer, navigateTo } = useDrawer();')

text = text.replace("navigation.navigate('Chat', { initialPrompt: gpt.prompt_template });", "navigateTo('ChatScreen', { initialPrompt: gpt.prompt_template });")

with open('src/screens/CustomGPTLibraryScreen.tsx', 'w') as f:
    f.write(text)
