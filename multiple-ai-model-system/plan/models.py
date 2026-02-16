from django.db import models
from django.contrib.auth import get_user_model
from datetime import datetime,timezone
User = get_user_model()
# Create your models here.

# PLAN_DURATION=(
#     ('weekly','weekly'),
#     ('monthly','monthly'),
#     ('yearly','yearly'),
#     ('one-time','one-time')
# )

class PlanModel(models.Model):
    name=models.CharField(max_length=100, null=True,blank=True)
    plan_code=models.CharField(max_length=50, unique=True)
    description=models.TextField(blank=True,null=True)
    words_or_credits=models.IntegerField(help_text="how much word will be added in user credits ?")
    amount=models.DecimalField(default=0, max_digits=10, decimal_places=2)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    
    
    def __str__(self):
        return f'{self.name} {self.plan_code}'
  
SUBSCRIPTION_STATUS=(
    ('inactive','inactive'),
    ('active','active'),
    ('expired','expired'),
)

SUBSCRIPTION_DURATION=(
    ('weekly','weekly'),
    ('monthly','monthly'),
    ('yearly','yearly'),
)

class SubscriptionModel(models.Model):
    plan=models.ForeignKey(PlanModel,related_name='plan_subscription',on_delete=models.SET_NULL,null=True)
    user=models.ForeignKey(User,on_delete=models.CASCADE,null=True,related_name='subscriptions')
    price=models.DecimalField(max_digits=10, decimal_places=2)
    credits_words=models.IntegerField()
    used_words=models.IntegerField(default=0)
    duration_type=models.CharField(choices=SUBSCRIPTION_DURATION, max_length=20)
    start_date=models.DateField(db_index=True)
    expire_date=models.DateField(db_index=True)
    status=models.CharField(choices=SUBSCRIPTION_STATUS,max_length=20,null=True,default="active")
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['expire_date', 'status']),
        ]

    @property
    def is_expired(self):
        return self.expire_date < datetime.now(timezone.utc).date()
    
    def __str__(self):
        return f'{self.user} - {self.plan.name if self.plan else "No Plan"} ({self.status})'
    
    
    
    
   



class Revenue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  
    plan = models.ForeignKey('PlanModel', on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=100, null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.amount} on {self.created_at}"
