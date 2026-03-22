import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIModelBackend.settings')
django.setup()

from ai_model.models import AIModelInfo

models = AIModelInfo.objects.filter(is_active=True)
for m in models:
    print(f"Checking model: {m.name} | {m.model_id} | {m.provider}")
    if m.provider == 'groq' and m.model_type == 'chat':
        print("-> Updating Groq model to vision preview")
        m.name = 'Llama 3.2 90B Vision (Groq)'
        m.model_id = 'llama-3.2-90b-vision-preview'
        m.save()
    elif m.provider == 'google' and m.model_type == 'chat':
        if 'gemini-1.5' not in m.model_id:
             print("-> Updating Google model to gemini-1.5-flash")
             m.name = 'Gemini 1.5 Flash'
             m.model_id = 'gemini-1.5-flash'
             m.save()
    elif m.provider == 'openai' and m.model_type == 'chat':
        if 'gpt-4o' not in m.model_id:
            print("-> Updating OpenAI model to gpt-4o")
            m.name = 'GPT-4o'
            m.model_id = 'gpt-4o'
            m.save()

print("Finished updating models")
