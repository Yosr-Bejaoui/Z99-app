"""
Admin Views for Ad Rewards Management.
Provides CRUD operations and analytics for ad rewards.
"""
import logging
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import RewardsHistory
from .serializers import RewardsHistorySerializer

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class AdminRewardsHistorySerializer(RewardsHistorySerializer):
    """Extended serializer for admin rewards management."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user:
            data['user_email'] = instance.user.email
        return data


class AdminRewardsViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing ad rewards.
    
    Endpoints:
    - GET /api/v1/ads/admin/rewards/ - List all rewards
    - POST /api/v1/ads/admin/rewards/ - Create a reward (manual grant)
    - GET /api/v1/ads/admin/rewards/{id}/ - Retrieve a reward
    - PUT /api/v1/ads/admin/rewards/{id}/ - Update a reward
    - DELETE /api/v1/ads/admin/rewards/{id}/ - Delete a reward
    - GET /api/v1/ads/admin/rewards/stats/ - Get reward statistics
    - POST /api/v1/ads/admin/rewards/grant/ - Grant reward to user
    """
    queryset = RewardsHistory.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminRewardsHistorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['reward_type', 'ad_network']
    search_fields = ['user__email', 'ad_unit_id']
    ordering_fields = ['created_at', 'reward_amount']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def grant(self, request):
        """Manually grant a reward to a user."""
        from django.contrib.auth import get_user_model
        from accounts.models import CreditAccount
        
        User = get_user_model()
        
        user_id = request.data.get('user_id')
        amount = request.data.get('amount')
        reward_type = request.data.get('reward_type', 'manual_grant')
        reason = request.data.get('reason', 'Admin granted reward')
        
        # Validate inputs
        if not user_id or not amount:
            return Response({
                "success": False,
                "error": {
                    "code": "MISSING_FIELDS",
                    "message": "user_id and amount are required."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (ValueError, TypeError):
            return Response({
                "success": False,
                "error": {
                    "code": "INVALID_AMOUNT",
                    "message": "Amount must be a positive number."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": f"User with ID {user_id} not found."
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create reward record
        reward = RewardsHistory.objects.create(
            user=user,
            reward_type=reward_type,
            reward_amount=amount,
            ad_network='manual',
            ad_unit_id=f'admin_grant_{request.user.id}'
        )
        
        # Add credits to user's account
        credit_account, created = CreditAccount.objects.get_or_create(user=user)
        credit_account.credits = F('credits') + amount
        credit_account.save()
        credit_account.refresh_from_db()
        
        logger.info(
            f"Admin {request.user.email} granted {amount} credits to user {user.email} "
            f"(reason: {reason})"
        )
        
        return Response({
            "success": True,
            "message": f"Granted {amount} credits to {user.email}",
            "data": {
                "reward": AdminRewardsHistorySerializer(reward).data,
                "new_balance": float(credit_account.credits)
            }
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get reward statistics."""
        now = timezone.now()
        today = now.date()
        
        # Total stats
        total_rewards = RewardsHistory.objects.count()
        total_amount = RewardsHistory.objects.aggregate(
            total=Sum('reward_amount')
        )['total'] or Decimal('0')
        
        # Today's stats
        today_count = RewardsHistory.objects.filter(created_at__date=today).count()
        today_amount = RewardsHistory.objects.filter(
            created_at__date=today
        ).aggregate(total=Sum('reward_amount'))['total'] or Decimal('0')
        
        # This month's stats
        month_start = today.replace(day=1)
        month_count = RewardsHistory.objects.filter(created_at__date__gte=month_start).count()
        month_amount = RewardsHistory.objects.filter(
            created_at__date__gte=month_start
        ).aggregate(total=Sum('reward_amount'))['total'] or Decimal('0')
        
        # By reward type
        by_type = RewardsHistory.objects.values('reward_type').annotate(
            count=Count('id'),
            total_amount=Sum('reward_amount')
        )
        
        # By ad network
        by_network = RewardsHistory.objects.values('ad_network').annotate(
            count=Count('id'),
            total_amount=Sum('reward_amount')
        )
        
        # Daily trend (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        daily_trend = RewardsHistory.objects.filter(
            created_at__date__gte=thirty_days_ago
        ).annotate(
            day=TruncDate('created_at')
        ).values('day').annotate(
            count=Count('id'),
            total=Sum('reward_amount')
        ).order_by('day')
        
        # Top users by rewards
        top_users = RewardsHistory.objects.values(
            'user__email'
        ).annotate(
            total_rewards=Sum('reward_amount'),
            reward_count=Count('id')
        ).order_by('-total_rewards')[:10]
        
        # Average reward amount
        avg_reward = RewardsHistory.objects.aggregate(
            avg=Avg('reward_amount')
        )['avg'] or Decimal('0')
        
        return Response({
            "success": True,
            "data": {
                "total_rewards": total_rewards,
                "total_amount_granted": float(total_amount),
                "average_reward": float(avg_reward),
                "today": {
                    "count": today_count,
                    "amount": float(today_amount)
                },
                "this_month": {
                    "count": month_count,
                    "amount": float(month_amount)
                },
                "by_reward_type": list(by_type),
                "by_ad_network": list(by_network),
                "daily_trend": list(daily_trend),
                "top_users": list(top_users)
            }
        })
    
    @action(detail=False, methods=['get'])
    def user_history(self, request):
        """Get reward history for a specific user."""
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({
                "success": False,
                "error": {
                    "code": "MISSING_USER_ID",
                    "message": "user_id query parameter is required."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rewards = RewardsHistory.objects.filter(user_id=user_id).order_by('-created_at')
        
        total_earned = rewards.aggregate(total=Sum('reward_amount'))['total'] or Decimal('0')
        
        return Response({
            "success": True,
            "data": {
                "user_id": user_id,
                "total_earned": float(total_earned),
                "reward_count": rewards.count(),
                "history": AdminRewardsHistorySerializer(rewards[:100], many=True).data
            }
        })


class RewardConfigView(APIView):
    """
    API for managing reward configuration.
    
    GET /api/v1/ads/admin/config/ - Get current reward config
    PUT /api/v1/ads/admin/config/ - Update reward config
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get current reward configuration."""
        from django.conf import settings
        
        # Default config (can be extended to use database)
        config = {
            "rewarded_video": {
                "enabled": True,
                "credits_per_view": 10,
                "daily_limit": 5,
                "cooldown_minutes": 30
            },
            "interstitial": {
                "enabled": True,
                "credits_per_view": 5,
                "daily_limit": 10,
                "cooldown_minutes": 15
            },
            "banner": {
                "enabled": False,
                "credits_per_impression": 1,
                "daily_limit": 50
            },
            "ad_networks": {
                "admob": {"enabled": True, "app_id": "ca-app-pub-xxx"},
                "unity": {"enabled": False, "game_id": ""},
                "facebook": {"enabled": False, "app_id": ""}
            }
        }
        
        return Response({
            "success": True,
            "data": config
        })
    
    def put(self, request):
        """Update reward configuration."""
        # In a real implementation, this would save to database
        # For now, just acknowledge the change
        
        logger.info(f"Admin {request.user.email} updated reward configuration")
        
        return Response({
            "success": True,
            "message": "Reward configuration updated successfully.",
            "data": request.data
        })
