import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "AIModelBackend.settings")
django.setup()

from ai_model.models import AIModelInfo

models = AIModelInfo.objects.filter(provider="groq")
count = models.update(api_key="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")
print(f"Updated {count} Groq models with new API key.")
