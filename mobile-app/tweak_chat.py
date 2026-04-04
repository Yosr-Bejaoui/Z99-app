import re

try:
    with open('src/screens/ChatScreen.tsx', 'r', encoding='utf-8') as f:
        chat_code = f.read()

    chat_code = re.sub(r'messageContainer:\s*\{[^}]*\}', '''messageContainer: {\n    flexDirection: 'row',\n    marginVertical: 4, // equals 8px between messages\n  }''', chat_code)

    with open('src/screens/ChatScreen.tsx', 'w', encoding='utf-8') as f:
        f.write(chat_code)
except: pass

