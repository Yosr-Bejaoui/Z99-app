# Stripe Webhook Handler
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import stripe
from django.conf import settings
from accounts.models import CreditAccount, CreditTransaction
from django.db.models import F
from .models import Revenue, PlanModel
from django.contrib.auth import get_user_model
from invoices.models import InvoiceModel
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY
webhook_secret = settings.WEBHOOK_SECRET


@csrf_exempt
def stripe_webhook(request):
    """
    Handle Stripe webhook events for payment processing.
    
    Supported events:
    - checkout.session.completed: Process successful payments
    - payment_intent.succeeded: Log successful payment intents
    - payment_intent.payment_failed: Log failed payments
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        logger.error(f"Stripe webhook: Invalid payload - {str(e)}")
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Stripe webhook: Invalid signature - {str(e)}")
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    # Handle checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        try:
            result = handle_successful_payment(session)
            if not result['success']:
                return JsonResponse({'error': result['error']}, status=result.get('status', 400))
        except Exception as e:
            logger.error(f"Stripe webhook: Error processing payment - {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

    # Handle payment_intent.succeeded
    elif event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        logger.info(f"Payment succeeded: {payment_intent['id']}")

    # Handle payment_intent.payment_failed
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        logger.warning(f"Payment failed: {payment_intent['id']}")

    return JsonResponse({'status': 'success'})


def handle_successful_payment(session):
    """
    Process a successful checkout session.
    
    Expected metadata:
    - user_id: The user who made the payment
    - words/credits: Number of credits to add
    - plan_code: The plan code (optional)
    """
    metadata = session.get('metadata', {})
    user_id = metadata.get('user_id')
    words = metadata.get('words', metadata.get('credits', 0))
    plan_code = metadata.get('plan_code')
    
    # Validate user_id
    if not user_id:
        logger.error("Stripe webhook: Missing user_id in metadata")
        return {'success': False, 'error': 'Missing user_id', 'status': 400}

    # Validate credits
    try:
        words = int(words)
    except (ValueError, TypeError):
        logger.error(f"Stripe webhook: Invalid credits value - {words}")
        return {'success': False, 'error': 'Invalid credits value', 'status': 400}
    
    # Get user
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"Stripe webhook: User not found - {user_id}")
        return {'success': False, 'error': 'User not found', 'status': 404}

    # Get or create credit account
    account, created = CreditAccount.objects.get_or_create(user=user)
    
    # Add credits
    CreditAccount.objects.filter(user_id=user_id).update(
        credits=F('credits') + words
    )
    
    # Create transaction record
    CreditTransaction.objects.create(
        credit_account=account,
        amount=words,
        transaction_type='add',
        message=f'{words} credits added via Stripe payment'
    )
    
    # Get payment ID and plan
    payment_id = session.get('payment_intent')
    plan = PlanModel.objects.filter(plan_code=plan_code).first() if plan_code else None
    amount = plan.amount if plan else (session.get('amount_total', 0) or 0) / 100
    
    # Create revenue record
    Revenue.objects.create(
        user=user,
        plan=plan,
        amount=amount,
        payment_id=payment_id
    )
    
    # Create invoice
    InvoiceModel.objects.create(
        invoice_id=f"INV-{payment_id or datetime.now().timestamp()}",
        user=user,
        plan=plan,
        amount=amount,
        payment_status="paid",
    )
    
    logger.info(f"Payment processed: User {user_id}, Credits {words}")
    return {'success': True}
