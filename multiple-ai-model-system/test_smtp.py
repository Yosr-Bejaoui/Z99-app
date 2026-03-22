import os
import django
from django.conf import settings
from django.core.mail import send_mail
import ssl

# Monkeypatch SSL to bypass local certificate verification for SMTP
_old_create_default_context = ssl.create_default_context
def _create_unverified_context_for_smtp(*args, **kwargs):
    context = _old_create_default_context(*args, **kwargs)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    return context
ssl.create_default_context = _create_unverified_context_for_smtp

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIModelBackend.settings')
django.setup()

print("Testing email dispatch with unverified SSL context...")
try:
    res = send_mail(
        subject='Test Email',
        message='This is a test email to verify SMTP settings',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.EMAIL_HOST_USER], # Send to self
        fail_silently=False,
    )
    print(f"Result: {res}")
except Exception as e:
    print(f"SMTP Error: {e}")
