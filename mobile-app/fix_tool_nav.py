import re

with open('src/screens/GPTToolsScreen.tsx', 'r') as f:
    text = f.read()

text = text.replace('const { openDrawer } = useDrawer();', 'const { openDrawer, navigateTo } = useDrawer();')

text = text.replace("navigation.navigate('Chat', { initialPrompt: tool.prompt_template });", "navigateTo('ChatScreen', { initialPrompt: tool.prompt_template });")

with open('src/screens/GPTToolsScreen.tsx', 'w') as f:
    f.write(text)
