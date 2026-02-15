from .models import PlanModel, SubscriptionModel
from rest_framework import serializers


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    class Meta:
        model = PlanModel
        fields = "__all__"


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions with detailed user and plan info."""
    user_details = serializers.SerializerMethodField(read_only=True)
    plan_details = serializers.SerializerMethodField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SubscriptionModel
        fields = [
            "id", "plan", "user", "price", "credits_words", "duration_type",
            "used_words", "start_date", "expire_date", "status", 
            "created_at", "updated_at", "user_details", "plan_details", "is_expired"
        ]
        read_only_fields = ["created_at", "updated_at"]
    
    def get_user_details(self, obj):
        """Return user details for the subscription."""
        if not obj.user:
            return None
        return {
            'id': obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email
        }
    
    def get_plan_details(self, obj):
        """Return plan details for the subscription."""
        if not obj.plan:
            return None
        return {
            'id': obj.plan.id,
            'plan_code': obj.plan.plan_code,
            "name": obj.plan.name,
            "words_or_credits": obj.plan.words_or_credits,
            "amount": obj.plan.amount,
        }
    
    def validate(self, attrs):
        """Validate subscription data."""
        start_date = attrs.get('start_date')
        expire_date = attrs.get('expire_date')
        
        if start_date and expire_date and expire_date <= start_date:
            raise serializers.ValidationError(
                {"expire_date": "Expiration date must be after start date."}
            )
        
        return attrs