from rest_framework import serializers
from .models import AIModelInfo, ChatMessage, ChatSession


class AIModelSerializer(serializers.ModelSerializer):
    """
    Full serializer for AI models (admin use).
    Includes all fields including sensitive API keys.
    """
    class Meta:
        model = AIModelInfo
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, attrs):
        """Validate that image generating models have a base cost."""
        images_generating_models = attrs.get('images_generating_models', False)
        base_cost = attrs.get('base_cost', None)

        if images_generating_models and (base_cost is None or base_cost <= 0):
            raise serializers.ValidationError(
                {"base_cost": "Base cost must be greater than 0 for image generating models."}
            )
        return attrs


class AIModelLimitedSerializer(serializers.ModelSerializer):
    """Limited serializer for AI models (authenticated users)."""
    class Meta:
        model = AIModelInfo
        fields = ['id', 'name', 'image', 'logo', 'model_id', 'created_at', 'description', 'base_url', 'base_cost', 'model_type', 'provider']
        read_only_fields = ['created_at', 'updated_at']


class AIModelPublicSerializer(serializers.ModelSerializer):
    """Public serializer for AI models without sensitive data like API keys."""
    class Meta:
        model = AIModelInfo
        fields = ['id', 'name', 'image', 'logo', 'model_id', 'description', 'provider', 'model_type', 'base_cost']
        read_only_fields = fields


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for individual chat messages."""
    class Meta:
        model = ChatMessage
        fields = "__all__"


class ChatSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for chat sessions.
    
    Includes nested messages and validates model/session type compatibility.
    """
    messages = ChatMessageSerializer(read_only=True, many=True)

    model = serializers.PrimaryKeyRelatedField(
        queryset=AIModelInfo.objects.all()
    )
    model_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id',
            'model',
            'model_name',
            'user',
            'messages',
            'summary',
            'session_type',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'user',
            'messages',
            'model_name'
        ]

    def validate(self, attrs):
        model = attrs.get('model')          # AIModelInfo instance
        session_type = attrs.get('session_type')

        if not model:
            raise serializers.ValidationError(
                {"model": "Model is required."}
            )

        if not session_type:
            raise serializers.ValidationError(
                {"session_type": "Session type is required."}
            )

        if not self._is_compatible(model.model_type, session_type):
            raise serializers.ValidationError(
                {"error": "Model type and session type must be compatible."}
            )

        return attrs

    def _is_compatible(self, model_type, session_type):
        if model_type == session_type:
            return True

        if model_type == "text_or_image_to_video":
            return session_type in [
                "text_to_video",
                "image_to_video",
                "text_or_image_to_video",
            ]

        return False
    def get_model_name(self, obj):
        return obj.model.name if obj.model else None
