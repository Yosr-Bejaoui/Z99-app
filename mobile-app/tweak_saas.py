import os, re

files = {
    'GlassCard': 'src/components/GlassCard.tsx',
    'GradientButton': 'src/components/GradientButton.tsx',
    'ChatScreen': 'src/screens/ChatScreen.tsx'
}

with open(files['GlassCard'], 'r', encoding='utf-8') as f:
    glass_code = f.read()

glass_code = re.sub(r'backgroundColor:\s*colors\.surface', "backgroundColor: colors.surface,\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.07)',\n    shadowColor: 'rgba(0,0,0,0.4)',\n    shadowOffset: { width: 0, height: 8 },\n    shadowOpacity: 1,\n    shadowRadius: 20,\n    elevation: 8", glass_code)
with open(files['GlassCard'], 'w', encoding='utf-8') as f:
    f.write(glass_code)

try:
    with open(files['ChatScreen'], 'r', encoding='utf-8') as f:
        chat_code = f.read()

    chat_code = re.sub(r'userMessage:\s*\{[^}]*\}', '''userMessage: {\n    padding: spacing.md, paddingHorizontal: spacing.lg,\n    backgroundColor: colors.userMessage,\n    borderRadius: 18, borderTopLeftRadius: 4,\n    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',\n    marginLeft: spacing.xl,\n  }''', chat_code)
    
    chat_code = re.sub(r'aiMessage:\s*\{[^}]*\}', '''aiMessage: {\n    padding: spacing.md, paddingHorizontal: spacing.lg,\n    backgroundColor: '#1a1a1a',\n    width: '100%',\n    marginRight: 0, marginLeft: 0,\n    borderRadius: 0,\n  }''', chat_code)

    chat_code = re.sub(r'inputContainer:\s*\{[^}]*\}', '''inputContainer: {\n    flexDirection: 'row', alignItems: 'flex-end',\n    padding: spacing.md, paddingHorizontal: spacing.lg,\n    backgroundColor: colors.surface,\n    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',\n    marginBottom: spacing.md, marginHorizontal: spacing.sm,\n  }''', chat_code)

    chat_code = re.sub(r'messageContainer:\s*\{[^}]*\}', '''messageContainer: {\n    flexDirection: 'row',\n    marginVertical: 4,\n  }''', chat_code)

    with open(files['ChatScreen'], 'w', encoding='utf-8') as f:
        f.write(chat_code)
except Exception as e:
    print(e)
