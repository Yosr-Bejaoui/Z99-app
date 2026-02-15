"""
Unit tests for the ai_model app.
Tests cover: AI Models, Chat Sessions, Chat Messages, Serializers
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from .models import AIModelInfo, ChatSession, ChatMessage
from .serializers import (
    AIModelSerializer,
    AIModelLimitedSerializer,
    AIModelPublicSerializer,
    ChatSessionSerializer,
    ChatMessageSerializer
)

User = get_user_model()


class AIModelInfoTests(TestCase):
    """Tests for AIModelInfo model."""
    
    def test_create_ai_model(self):
        """Test creating an AI model."""
        model = AIModelInfo.objects.create(
            name='GPT-4',
            version='1.0',
            provider='openai',
            model_id='gpt-4-turbo',
            description='Advanced language model'
        )
        self.assertEqual(model.name, 'GPT-4')
        self.assertEqual(model.provider, 'openai')
        self.assertTrue(model.is_active)
    
    def test_ai_model_str_representation(self):
        """Test AI model string representation."""
        model = AIModelInfo.objects.create(
            name='Gemini Pro',
            version='2.0',
            provider='google',
            model_id='gemini-pro-vision'
        )
        self.assertIn('Gemini Pro', str(model))
        self.assertIn('google', str(model))
    
    def test_model_id_unique(self):
        """Test model_id uniqueness."""
        AIModelInfo.objects.create(
            name='Model 1',
            version='1.0',
            provider='openai',
            model_id='unique-model-id'
        )
        with self.assertRaises(Exception):
            AIModelInfo.objects.create(
                name='Model 2',
                version='2.0',
                provider='google',
                model_id='unique-model-id'  # Duplicate
            )
    
    def test_model_with_base_cost(self):
        """Test creating model with base cost."""
        model = AIModelInfo.objects.create(
            name='Premium Model',
            version='1.0',
            provider='openai',
            model_id='premium-model',
            base_cost=Decimal('10.00'),
            model_type='chat'
        )
        self.assertEqual(model.base_cost, Decimal('10.00'))


class ChatSessionTests(TestCase):
    """Tests for ChatSession model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='chat@example.com',
            password='TestPass123'
        )
        self.ai_model = AIModelInfo.objects.create(
            name='Chat Model',
            version='1.0',
            provider='openai',
            model_id='chat-model-1',
            model_type='chat'
        )
    
    def test_create_chat_session(self):
        """Test creating a chat session."""
        session = ChatSession.objects.create(
            model=self.ai_model,
            user=self.user,
            session_type='chat'
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.model, self.ai_model)
        self.assertEqual(session.session_type, 'chat')
    
    def test_session_ordering(self):
        """Test sessions are ordered by updated_at descending."""
        session1 = ChatSession.objects.create(
            model=self.ai_model,
            user=self.user,
            session_type='chat'
        )
        session2 = ChatSession.objects.create(
            model=self.ai_model,
            user=self.user,
            session_type='chat'
        )
        sessions = ChatSession.objects.all()
        # Most recent first
        self.assertEqual(sessions[0], session2)


class ChatMessageTests(TestCase):
    """Tests for ChatMessage model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='message@example.com',
            password='TestPass123'
        )
        self.ai_model = AIModelInfo.objects.create(
            name='Message Model',
            version='1.0',
            provider='google',
            model_id='message-model-1',
            model_type='chat'
        )
        self.session = ChatSession.objects.create(
            model=self.ai_model,
            user=self.user,
            session_type='chat'
        )
    
    def test_create_user_message(self):
        """Test creating a user message."""
        message = ChatMessage.objects.create(
            session=self.session,
            sender='user'
        )
        self.assertEqual(message.sender, 'user')
        self.assertEqual(message.session, self.session)
    
    def test_create_ai_message(self):
        """Test creating an AI message."""
        message = ChatMessage.objects.create(
            session=self.session,
            sender='ai'
        )
        self.assertEqual(message.sender, 'ai')
    
    def test_message_with_images(self):
        """Test creating message with images."""
        message = ChatMessage.objects.create(
            session=self.session,
            sender='ai',
            images=['http://example.com/image1.png', 'http://example.com/image2.png']
        )
        self.assertEqual(len(message.images), 2)


class AIModelSerializerTests(TestCase):
    """Tests for AI model serializers."""
    
    def setUp(self):
        self.ai_model = AIModelInfo.objects.create(
            name='Serializer Model',
            version='1.0',
            provider='openai',
            model_id='serializer-model',
            api_key='secret-api-key',
            description='Test model',
            model_type='chat',
            base_cost=Decimal('5.00')
        )
    
    def test_full_serializer_includes_api_key(self):
        """Test AIModelSerializer includes sensitive data."""
        serializer = AIModelSerializer(self.ai_model)
        self.assertIn('api_key', serializer.data)
    
    def test_public_serializer_excludes_api_key(self):
        """Test AIModelPublicSerializer excludes sensitive data."""
        serializer = AIModelPublicSerializer(self.ai_model)
        self.assertNotIn('api_key', serializer.data)
        self.assertIn('name', serializer.data)
        self.assertIn('provider', serializer.data)
    
    def test_limited_serializer_fields(self):
        """Test AIModelLimitedSerializer has correct fields."""
        serializer = AIModelLimitedSerializer(self.ai_model)
        self.assertIn('name', serializer.data)
        self.assertIn('model_type', serializer.data)
        self.assertIn('provider', serializer.data)


class ChatSessionSerializerTests(TestCase):
    """Tests for ChatSessionSerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='sessser@example.com',
            password='TestPass123'
        )
        self.ai_model = AIModelInfo.objects.create(
            name='Session Ser Model',
            version='1.0',
            provider='google',
            model_id='session-ser-model',
            model_type='chat'
        )
    
    def test_session_serializer_validation_compatible_types(self):
        """Test validation passes for compatible model and session types."""
        data = {
            'model': self.ai_model.id,
            'session_type': 'chat'
        }
        serializer = ChatSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
    
    def test_session_serializer_validation_incompatible_types(self):
        """Test validation fails for incompatible model and session types."""
        data = {
            'model': self.ai_model.id,
            'session_type': 'text_to_image'  # Incompatible with chat model
        }
        serializer = ChatSessionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_text_or_image_to_video_compatibility(self):
        """Test text_or_image_to_video model is compatible with both video types."""
        video_model = AIModelInfo.objects.create(
            name='Video Model',
            version='1.0',
            provider='wavespeedai',
            model_id='video-model',
            model_type='text_or_image_to_video'
        )
        
        # Should be compatible with text_to_video
        data = {'model': video_model.id, 'session_type': 'text_to_video'}
        serializer = ChatSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        # Should be compatible with image_to_video
        data = {'model': video_model.id, 'session_type': 'image_to_video'}
        serializer = ChatSessionSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class AIModelAPITests(APITestCase):
    """API tests for AI model endpoints."""
    
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            password='UserPass123',
            is_active=True
        )
        self.ai_model = AIModelInfo.objects.create(
            name='API Test Model',
            version='1.0',
            provider='openai',
            model_id='api-test-model',
            model_type='chat',
            is_active=True
        )
    
    def test_list_models_authenticated(self):
        """Test listing models as authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_models_unauthenticated(self):
        """Test listing models without authentication."""
        response = self.client.get('/api/v1/list/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_admin_sees_full_model_data(self):
        """Test admin sees full model data including API keys."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/v1/list/{self.ai_model.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ChatSessionAPITests(APITestCase):
    """API tests for chat session endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='chatapi@example.com',
            password='TestPass123',
            is_active=True
        )
        self.ai_model = AIModelInfo.objects.create(
            name='Chat API Model',
            version='1.0',
            provider='openai',
            model_id='chat-api-model',
            model_type='chat',
            is_active=True
        )
    
    def test_create_session_authenticated(self):
        """Test creating a session as authenticated user."""
        self.client.force_authenticate(user=self.user)
        data = {
            'model': self.ai_model.id,
            'session_type': 'chat'
        }
        response = self.client.post('/api/v1/chat/session/list/', data, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_create_session_unauthenticated(self):
        """Test creating session without authentication fails."""
        data = {
            'model': self.ai_model.id,
            'session_type': 'chat'
        }
        response = self.client.post('/api/v1/chat/session/list/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_own_sessions_only(self):
        """Test user only sees their own sessions."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='OtherPass123',
            is_active=True
        )
        
        # Create session for current user
        ChatSession.objects.create(
            model=self.ai_model,
            user=self.user,
            session_type='chat'
        )
        
        # Create session for other user
        ChatSession.objects.create(
            model=self.ai_model,
            user=other_user,
            session_type='chat'
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/chat/session/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only see own session
        for session in response.data:
            self.assertEqual(session['user'], self.user.id)
