from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_the_email(subject,user_email,message,message_type='registration'):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send email for message_type=%s", message_type)
        raise

