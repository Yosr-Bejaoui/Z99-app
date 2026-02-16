"""
System Configuration Models.
Stores API keys, provider configs, and system settings.
"""
from django.db import models
from django.core.validators import MinValueValidator
from cryptography.fernet import Fernet
from django.conf import settings
import json
import base64
import os


def get_encryption_key():
    """Get or create encryption key for sensitive data."""
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key:
        # Generate a key if not set (should be set in production)
        key = Fernet.generate_key()
    return key


class SystemConfig(models.Model):
    """
    System-wide configuration settings.
    Key-value store with optional encryption for sensitive values.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(blank=True)
    is_encrypted = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, default='general', db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configurations'
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.category}/{self.key}"
    
    def set_value(self, value, encrypt=False):
        """Set the value, optionally encrypting it."""
        if encrypt:
            fernet = Fernet(get_encryption_key())
            encrypted = fernet.encrypt(str(value).encode())
            self.value = base64.b64encode(encrypted).decode()
            self.is_encrypted = True
        else:
            self.value = str(value)
            self.is_encrypted = False
    
    def get_value(self):
        """Get the value, decrypting if necessary."""
        if self.is_encrypted:
            try:
                fernet = Fernet(get_encryption_key())
                encrypted = base64.b64decode(self.value.encode())
                return fernet.decrypt(encrypted).decode()
            except Exception:
                return None
        return self.value
    
    @classmethod
    def get(cls, key, default=None):
        """Get a config value by key."""
        try:
            config = cls.objects.get(key=key, is_active=True)
            return config.get_value()
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set(cls, key, value, encrypt=False, category='general', description=None):
        """Set a config value."""
        config, created = cls.objects.get_or_create(
            key=key,
            defaults={'category': category, 'description': description}
        )
        config.set_value(value, encrypt=encrypt)
        if description:
            config.description = description
        config.save()
        return config


class APIProviderConfig(models.Model):
    """
    Configuration for AI API providers.
    """
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('google', 'Google AI'),
        ('anthropic', 'Anthropic'),
        ('wavespeed', 'WaveSpeed AI'),
        ('leonardo', 'Leonardo AI'),
        ('fal', 'FAL AI'),
        ('deepseek', 'DeepSeek'),
        ('stability', 'Stability AI'),
        ('replicate', 'Replicate'),
    ]
    
    name = models.CharField(max_length=50, choices=PROVIDER_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    api_key = models.TextField(blank=True, help_text="Encrypted API key")
    api_base_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0, help_text="Higher priority = preferred provider")
    rate_limit = models.IntegerField(default=100, validators=[MinValueValidator(1)])
    timeout_seconds = models.IntegerField(default=60)
    extra_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'API Provider Configuration'
        verbose_name_plural = 'API Provider Configurations'
        ordering = ['-priority', 'name']
    
    def __str__(self):
        return f"{self.display_name} ({'Active' if self.is_active else 'Inactive'})"
    
    def set_api_key(self, key):
        """Encrypt and store API key."""
        fernet = Fernet(get_encryption_key())
        encrypted = fernet.encrypt(key.encode())
        self.api_key = base64.b64encode(encrypted).decode()
    
    def get_api_key(self):
        """Decrypt and return API key."""
        if not self.api_key:
            return None
        try:
            fernet = Fernet(get_encryption_key())
            encrypted = base64.b64decode(self.api_key.encode())
            return fernet.decrypt(encrypted).decode()
        except Exception:
            return None
    
    @classmethod
    def get_active_provider(cls, provider_name):
        """Get an active provider by name."""
        try:
            return cls.objects.get(name=provider_name, is_active=True)
        except cls.DoesNotExist:
            return None


class WebhookConfig(models.Model):
    """
    Configuration for webhooks.
    """
    name = models.CharField(max_length=100, unique=True)
    url = models.URLField()
    secret_key = models.TextField(blank=True, help_text="Webhook secret for signature verification")
    events = models.JSONField(default=list, help_text="List of events to trigger this webhook")
    is_active = models.BooleanField(default=True)
    retry_count = models.IntegerField(default=3, validators=[MinValueValidator(0)])
    timeout_seconds = models.IntegerField(default=30)
    headers = models.JSONField(default=dict, blank=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Webhook Configuration'
        verbose_name_plural = 'Webhook Configurations'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def set_secret_key(self, key):
        """Encrypt and store secret key."""
        if key:
            fernet = Fernet(get_encryption_key())
            encrypted = fernet.encrypt(key.encode())
            self.secret_key = base64.b64encode(encrypted).decode()
    
    def get_secret_key(self):
        """Decrypt and return secret key."""
        if not self.secret_key:
            return None
        try:
            fernet = Fernet(get_encryption_key())
            encrypted = base64.b64decode(self.secret_key.encode())
            return fernet.decrypt(encrypted).decode()
        except Exception:
            return None


class SystemLog(models.Model):
    """
    System log entries for audit trail.
    """
    LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, db_index=True)
    category = models.CharField(max_length=50, db_index=True)
    message = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    request_path = models.CharField(max_length=255, blank=True, null=True)
    request_method = models.CharField(max_length=10, blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['level', 'created_at']),
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"[{self.level}] {self.category}: {self.message[:50]}"
    
    @classmethod
    def log(cls, level, category, message, user=None, request=None, **extra):
        """Create a log entry."""
        ip_address = None
        request_path = None
        request_method = None
        
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            request_path = request.path
            request_method = request.method
            if user is None and hasattr(request, 'user') and request.user.is_authenticated:
                user = request.user
        
        return cls.objects.create(
            level=level,
            category=category,
            message=message,
            user=user,
            ip_address=ip_address,
            request_path=request_path,
            request_method=request_method,
            extra_data=extra
        )
