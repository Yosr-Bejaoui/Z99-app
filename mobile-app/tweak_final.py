import os, re

# Update GlassCard
try:
    with open('src/components/GlassCard.tsx', 'r', encoding='utf-8') as f:
        glass_code = f.read()

    glass_code = re.sub(r'backgroundColor:\s*colors\.card', "backgroundColor: colors.card,\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.07)',\n    shadowColor: 'rgba(0,0,0,0.4)',\n    shadowOffset: { width: 0, height: 8 },\n    shadowOpacity: 1,\n    shadowRadius: 20,\n    elevation: 8", glass_code)
    
    with open('src/components/GlassCard.tsx', 'w', encoding='utf-8') as f:
        f.write(glass_code)
except Exception as e: print(e)

# Update MessageBubble
try:
    with open('src/components/MessageBubble.tsx', 'r', encoding='utf-8') as f:
        msg_code = f.read()

    msg_code = re.sub(r'userBubble:\s*\{[^}]*\}', '''userBubble: {\n    padding: spacing.md, paddingHorizontal: spacing.lg,\n    backgroundColor: colors.userMessage,\n    borderRadius: 18, borderTopLeftRadius: 4,\n    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',\n    marginLeft: spacing.xl,\n  }''', msg_code)
    
    msg_code = re.sub(r'assistantBubble:\s*\{[^}]*\}', '''assistantBubble: {\n    padding: spacing.md, paddingHorizontal: spacing.lg,\n    backgroundColor: '#1a1a1a',\n    width: '100%',\n    marginRight: 0, marginLeft: 0,\n    borderRadius: 0,\n  }''', msg_code)
    
    with open('src/components/MessageBubble.tsx', 'w', encoding='utf-8') as f:
        f.write(msg_code)
except Exception as e: print(e)

print("Applied styling successfully")
