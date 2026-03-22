import json
import hmac
import hashlib
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

logger = logging.getLogger(__name__)


def _is_valid_signature(raw_body, signature_header):
    """Validate webhook signature using HMAC-SHA256 and a shared secret."""
    secret = getattr(settings, "AI_WEBHOOK_SECRET", "")
    if not secret or not signature_header:
        return False

    expected = hmac.new(
        secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    provided = signature_header.strip()
    if provided.startswith("sha256="):
        provided = provided.split("=", 1)[1]
    return hmac.compare_digest(expected, provided)

@csrf_exempt
def video_webhook(request):
    if request.method != "POST":
        return JsonResponse({"status": "method not allowed"}, status=405)

    signature = request.headers.get("X-Webhook-Signature", "")
    if not _is_valid_signature(request.body, signature):
        logger.warning("Webhook rejected due to invalid or missing signature")
        return JsonResponse({"status": "invalid signature"}, status=401)

    try:
        event = json.loads(request.body)
        event_type = event.get("type")
        data = event.get("data", {})

        if event_type == "video.completed":
            video_id = data.get("id")
            logger.info("Video completed webhook received for id=%s", video_id)
            # TODO: Fetch video content using video_id if needed
        elif event_type == "video.failed":
            logger.warning("Video failed webhook received")

        return JsonResponse({"status": "received"})
    except Exception:
        logger.exception("Webhook processing error")
        return JsonResponse({"status": "error"}, status=400)
