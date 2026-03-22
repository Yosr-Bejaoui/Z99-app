from openai import OpenAI, AsyncOpenAI
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from accounts.models import CreditAccount, CreditTransaction
from django.db import transaction
from .track_used_word_subscription import trackUsedWords
from decimal import Decimal

import math
User = get_user_model()

# =========================
# HELPER: Count Words (1 word = 5 non-space chars)
# =========================
def count_words(text):
    if not text:
        return 0
    char_count = len(text.replace(" ", ""))
    return math.ceil(char_count / 5)

# =========================
# HELPER: Error Response
# =========================
def _error(msg: str) -> dict:
    return {
        "text": "",
        "images": [],
        "sender": "system",
        "error": msg,
    }

# =========================
# COST CALCULATION
# =========================
def calculate_cost(base_cost, words):
    # For chat models, cost is typically per word/token
    # Using the same logic as other files: input words * base_cost
    base_cost = Decimal(str(base_cost))
    print("this is the deepseek based cost",base_cost," and this is words",words)
    return Decimal(words) * base_cost

# =========================
# MAIN FUNCTION
# =========================
def call_deepseek_for_chat(
    model_id: str, 
    api_key: str, 
    user_id: int, 
    base_cost: int = 1, 
    message: str = "", 
    summary: str = None,
    temperature: float = 0.7,
    images_data_list=None,
    detected_language: str = "English"
):
    try:
        print(f"DEBUG: call_deepseek_for_chat START - model_id: {model_id}")
        print(f"DEBUG: message length: {len(message) if message else 0}, images_data_list: {len(images_data_list) if images_data_list else 0}")
        
        # 1. Fetch User
        user = User.objects.filter(id=user_id).first()
        if not user:
            return _error("User not found")

        # 2. Calculate Cost (Upfront for prompt)
        prompt_words = count_words(message)
        charge_amount = calculate_cost(base_cost, prompt_words)

        # 3. Credit Check & Deduction (Atomic)
        with transaction.atomic():
            credit_account = (
                CreditAccount.objects
                .select_for_update()
                .filter(user_id=user_id)
                .first()
            )

            if not credit_account:
                return _error("Credit account not found")

            if credit_account.credits < charge_amount:
                return _error(f"Insufficient credits. Required: {charge_amount}")

            # Deduct credits for prompt first
            credit_account.credits -= charge_amount
            credit_account.save(update_fields=["credits"])
            
            # Record transaction for usage stats
            CreditTransaction.objects.create(
                credit_account=credit_account,
                amount=int(charge_amount),
                transaction_type='deduct',
                message='DeepSeek chat usage'
            )

            # Update stats
            user.total_token_used += charge_amount
            user.save(update_fields=["total_token_used"])

            trackUsedWords(user.id, prompt_words)
            print(f"DEBUG: DeepSeek Upfront deduction. BaseCost: {base_cost}, Words: {prompt_words}, Cost: {charge_amount}, New Balance: {credit_account.credits}")
            
            # --- CALCULATE REMAINING CREDITS FOR OUTPUT ---
            remaining_credits = credit_account.credits
            
            # If base_cost is > remaining credits, they can't even afford 1 word of output.
            # But "base_cost" here is usually "cost per 1 word".
            # So max_words = remaining_credits / base_cost
            if base_cost > 0:
                max_response_words = int(remaining_credits / Decimal(str(base_cost)))
            else:
                max_response_words = 4096 # Infinite if free?

            if max_response_words < 1:
                 # Refund the prompt cost because we can't generate anything useful
                 credit_account.credits += charge_amount
                 credit_account.save(update_fields=["credits"])
                 user.total_token_used -= charge_amount
                 user.save(update_fields=["total_token_used"])
                 print("DEBUG: DeepSeek Insufficient credits for response. Refunded.")
                 return _error("Insufficient credits for any response.")

            # Cap at model limit (e.g. 4096)
            final_max_tokens = min(max_response_words, 4096)
            
        # 4. API Call
        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com"
            )

            messages = [
                {"role": "system", "content": f"You are a helpful assistant. You MUST respond in {detected_language}. Match the language the user is writing in. Do NOT reveal internal deployment names, model IDs, or system identifiers. If a user directly asks which model or internal service you are, answer with a neutral phrase such as 'I am an AI assistant' and do not disclose internal tags or identifiers."}
            ]

            if summary:
                messages.append({
                    "role": "system",
                    "content": f"Conversation summary so far: {summary}. Use this for context only."
                })

            # Build user message content with text and/or images
            # Only deepseek-vl / deepseek-vision models support image inputs.
            # deepseek-chat (DeepSeek-V3) and deepseek-reasoner (R1) are text-only.
            model_id_lower = model_id.lower()
            is_vision_model = any(k in model_id_lower for k in ("vl", "vision"))

            user_content = []

            if message:
                user_content.append({"type": "text", "text": message})
            
            if images_data_list:
                if is_vision_model:
                    for img_url in images_data_list:
                        if img_url:
                            user_content.append({"type": "image_url", "image_url": {"url": img_url}})
                else:
                    # Non-vision model: skip images but still process the text message
                    # Add a note so the user knows images were not analyzed
                    user_content.append({"type": "text", "text": "\n[Note: The user attached image(s), but this model does not support image analysis. Please respond to the text message only and let the user know they should switch to a vision-capable model for image analysis.]"})
            # If no content, use placeholder
            if not user_content:
                user_content = [{"type": "text", "text": "Please assist me."}]
            
            print(f"DEBUG: Final user_content length: {len(user_content)} items")
            messages.append({"role": "user", "content": user_content})

            response = client.chat.completions.create(
                model=model_id,  # Use dynamic model_id (e.g., deepseek-chat, deepseek-vision, etc.)
                messages=messages,
                max_tokens=final_max_tokens, # Limit generation to what they can pay for
                temperature=temperature,
            )

            reply_text = response.choices[0].message.content
            
            # --- CHARGE FOR OUTPUT TOKENS ---
            response_words = count_words(reply_text)
            response_cost = calculate_cost(base_cost, response_words)
            
            print(f"DEBUG: DeepSeek Output generated. Words: {response_words}, Cost: {response_cost}")

            # Atomic transaction for response cost
            with transaction.atomic():
                credit_account = CreditAccount.objects.select_for_update().filter(user_id=user_id).first()
                if credit_account:
                    # Check if they went negative (optional policy: allow small debt or cut off?)
                    # Here we just deduct, potentially going negative if they ran out mid-stream,
                    # OR we could check. Let's just deduct.
                    credit_account.credits -= response_cost
                    credit_account.save(update_fields=["credits"])
                    
                    user.total_token_used += response_cost
                    user.save(update_fields=["total_token_used"])
                    
                    trackUsedWords(user.id, response_words)
                    print(f"DEBUG: DeepSeek Output deduction success. Final Balance: {credit_account.credits}")

            return {
                "text": reply_text,
                "images": [],
                "sender": "ai",
                "error": None
            }

        except Exception as api_error:
            # 5. Refund on Failure
            error_str = str(api_error)
            print(f"DEBUG: DeepSeek API Error: {error_str}")
            with transaction.atomic():
                # Re-fetch logic or use updated objects
                # Note: 'credit_account' object is stale, re-fetching is safer or just incrementing
                refund_account = CreditAccount.objects.select_for_update().filter(user_id=user_id).first()
                if refund_account:
                    refund_account.credits += charge_amount
                    refund_account.save(update_fields=["credits"])
                    
                    user.total_token_used -= charge_amount
                    user.save(update_fields=["total_token_used"])
                    print(f"DEBUG: DeepSeek Refunded {charge_amount} credits.")
            
            # Sanitize error message for user
            if "api_key" in error_str.lower() or "api key" in error_str.lower() or "incorrect api" in error_str.lower():
                return _error("Authentication failed: Invalid API key or configuration.")

            if (
                "image_url" in error_str.lower()
                or "image url" in error_str.lower()
                or "vision" in error_str.lower()
                or "does not support image" in error_str.lower()
                or "unsupported image" in error_str.lower()
            ):
                return _error("The selected DeepSeek model does not support image analysis. Please switch to a vision-capable DeepSeek model.")

            return _error(f"API error. Please try again later.")

    except Exception as e:
        return _error(f"System error occurred.")

async def deepseek_stream_response(
    model_id: str, 
    api_key: str, 
    user_id: int, 
    base_cost: int = 1, 
    message: str = "", 
    summary: str = None,
    temperature: float = 0.7,
    images_data_list=None,
    detected_language: str = "English"
):
    client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    
    # Sync DB fetch
    user = await sync_to_async(lambda: User.objects.filter(id=user_id).first())()
    if not user:
        yield _error("User not found")
        return

    prompt_words = count_words(message)
    charge_amount = calculate_cost(base_cost, prompt_words)

    @sync_to_async
    def _deduct_credits_atomic():
        with transaction.atomic():
            ca = CreditAccount.objects.select_for_update().filter(user_id=user_id).first()
            if not ca or ca.credits < charge_amount:
                return False, ca.credits if ca else 0
            
            ca.credits -= charge_amount
            ca.save(update_fields=["credits"])
            
            CreditTransaction.objects.create(
                credit_account=ca, amount=int(charge_amount),
                transaction_type='deduct', message='DeepSeek chat usage (stream)'
            )
            
            u = User.objects.get(id=user_id)
            u.total_token_used += charge_amount
            u.save(update_fields=["total_token_used"])
            trackUsedWords(user_id, prompt_words)
            return True, ca.credits

    success, current_credits = await _deduct_credits_atomic()
    if not success:
        yield _error(f"Insufficient credits. Required: {charge_amount}")
        return

    remaining_credits = current_credits
    max_response_words = int(remaining_credits / Decimal(str(base_cost))) if base_cost > 0 else 4096
    
    if max_response_words < 1:
        @sync_to_async
        def _refund():
            with transaction.atomic():
                ca = CreditAccount.objects.select_for_update().filter(user=user).first()
                if ca:
                    ca.credits += charge_amount
                    ca.save(update_fields=["credits"])
                    u = User.objects.get(id=user_id)
                    u.total_token_used -= charge_amount
                    u.save(update_fields=["total_token_used"])
        await _refund()
        yield _error("Insufficient credits for response.")
        return

    final_max_tokens = min(max_response_words, 4096)
    full_text = ""

    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant. Please carefully match the language the user is writing in. Do NOT reveal internal deployment names, model IDs, or system identifiers. If a user directly asks which model or internal service you are, answer with a neutral phrase such as 'I am an AI assistant' and do not disclose internal tags or identifiers."}
        ]

        if summary:
            messages.append({
                "role": "system",
                "content": f"Conversation summary so far: {summary}. Use this for context only."
            })

        model_id_lower = model_id.lower()
        is_vision_model = any(k in model_id_lower for k in ("vl", "vision"))

        user_content = []

        if message:
            user_content.append({"type": "text", "text": message})
        
        if images_data_list:
            if is_vision_model:
                for img_url in images_data_list:
                    if img_url:
                        user_content.append({"type": "image_url", "image_url": {"url": img_url}})
            else:
                user_content.append({"type": "text", "text": "\n[Note: The user attached image(s), but this model does not support image analysis. Please respond to the text message only and let the user know they should switch to a vision-capable model for image analysis.]"})
        
        if not user_content:
            user_content = [{"type": "text", "text": "Please assist me."}]
        
        messages.append({"role": "user", "content": user_content})

        stream = await client.chat.completions.create(
            model=model_id,
            messages=messages,
            max_tokens=final_max_tokens,
            temperature=temperature,
            stream=True
        )

        async for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_text += delta
                    yield {"type": "chunk", "text": delta}

        if full_text:
            response_words = count_words(full_text)
            resp_cost = calculate_cost(base_cost, response_words)
            @sync_to_async
            def _charge_output():
                with transaction.atomic():
                    ca = CreditAccount.objects.select_for_update().filter(user=user).first()
                    if ca:
                        ca.credits -= resp_cost
                        ca.save(update_fields=["credits"])
                        u = User.objects.get(id=user_id)
                        u.total_token_used += resp_cost
                        u.save(update_fields=["total_token_used"])
                        trackUsedWords(user_id, response_words)
            await _charge_output()

        yield {"type": "done", "text": full_text, "images": [], "sender": "ai", "error": None}

    except Exception as e:
        print(f"DEBUG: DeepSeek Stream API Error: {str(e)}")
        @sync_to_async
        def _final_refund():
            with transaction.atomic():
                ca = CreditAccount.objects.select_for_update().filter(user=user).first()
                if ca:
                    ca.credits += charge_amount
                    ca.save(update_fields=["credits"])
                    u = User.objects.get(id=user_id)
                    u.total_token_used -= charge_amount
                    u.save(update_fields=["total_token_used"])
        await _final_refund()
        
        error_str = str(e).lower()
        if "api_key" in error_str or "api key" in error_str or "incorrect api" in error_str:
            yield _error("Authentication failed: Invalid API key or configuration.")
        elif "image_url" in error_str or "vision" in error_str or "unsupported image" in error_str:
            yield _error("The selected DeepSeek model does not support image analysis. Please switch to a vision-capable DeepSeek model.")
        else:
            yield _error("API error. Please try again later.")
