"""
Admin Views for Plan Management.
Provides CRUD operations for plans, subscriptions, and revenue analytics.
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

from .models import PlanModel, SubscriptionModel, Revenue
from .serializers import PlanSerializer, SubscriptionSerializer

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class AdminPlanViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing subscription plans.
    
    Endpoints:
    - GET /api/v1/plan/admin/plans/ - List all plans
    - POST /api/v1/plan/admin/plans/ - Create a new plan
    - GET /api/v1/plan/admin/plans/{id}/ - Retrieve a plan
    - PUT /api/v1/plan/admin/plans/{id}/ - Update a plan
    - DELETE /api/v1/plan/admin/plans/{id}/ - Delete a plan
    - POST /api/v1/plan/admin/plans/{id}/activate/ - Activate a plan
    - POST /api/v1/plan/admin/plans/{id}/deactivate/ - Deactivate a plan
    - GET /api/v1/plan/admin/plans/stats/ - Get plan statistics
    """
    queryset = PlanModel.objects.all().order_by('-created_at')
    serializer_class = PlanSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'subscription_duration']
    search_fields = ['name', 'plan_code', 'description']
    ordering_fields = ['created_at', 'amount', 'words_or_credits', 'name']
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Admin {request.user.email} creating new plan: {request.data.get('name')}")
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        logger.info(f"Admin {request.user.email} updating plan {kwargs.get('pk')}")
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        # Check if plan has active subscriptions
        active_subs = SubscriptionModel.objects.filter(plan=plan, status='active').count()
        if active_subs > 0:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "PLAN_HAS_ACTIVE_SUBSCRIPTIONS",
                        "message": f"Cannot delete plan with {active_subs} active subscriptions. Deactivate them first.",
                        "details": {"active_subscriptions": active_subs}
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        logger.info(f"Admin {request.user.email} deleting plan {plan.id}: {plan.name}")
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a plan."""
        plan = self.get_object()
        plan.is_active = True
        plan.save()
        logger.info(f"Admin {request.user.email} activated plan {plan.id}: {plan.name}")
        return Response({
            "success": True,
            "message": f"Plan '{plan.name}' has been activated.",
            "data": PlanSerializer(plan).data
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a plan."""
        plan = self.get_object()
        plan.is_active = False
        plan.save()
        logger.info(f"Admin {request.user.email} deactivated plan {plan.id}: {plan.name}")
        return Response({
            "success": True,
            "message": f"Plan '{plan.name}' has been deactivated.",
            "data": PlanSerializer(plan).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get plan statistics."""
        total_plans = PlanModel.objects.count()
        active_plans = PlanModel.objects.filter(is_active=True).count()
        
        # Get subscription counts per plan
        plan_stats = PlanModel.objects.annotate(
            subscription_count=Count('subscriptionmodel'),
            active_subscription_count=Count(
                'subscriptionmodel',
                filter=F('subscriptionmodel__status')
            ),
            total_revenue=Sum('subscriptionmodel__price')
        ).values('id', 'name', 'subscription_count', 'active_subscription_count', 'total_revenue')
        
        return Response({
            "success": True,
            "data": {
                "total_plans": total_plans,
                "active_plans": active_plans,
                "inactive_plans": total_plans - active_plans,
                "plan_details": list(plan_stats)
            }
        })


class AdminSubscriptionViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing subscriptions.
    
    Endpoints:
    - GET /api/v1/plan/admin/subscriptions/ - List all subscriptions
    - GET /api/v1/plan/admin/subscriptions/{id}/ - Retrieve a subscription
    - POST /api/v1/plan/admin/subscriptions/{id}/cancel/ - Cancel a subscription
    - POST /api/v1/plan/admin/subscriptions/{id}/extend/ - Extend a subscription
    - GET /api/v1/plan/admin/subscriptions/stats/ - Get subscription statistics
    - GET /api/v1/plan/admin/subscriptions/expiring/ - Get expiring subscriptions
    """
    queryset = SubscriptionModel.objects.select_related('user', 'plan').all().order_by('-created_at')
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'duration_type', 'plan']
    search_fields = ['user__email', 'plan__name']
    ordering_fields = ['created_at', 'start_date', 'expire_date', 'price']
    http_method_names = ['get', 'head', 'options']  # No create/update/delete via API
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription."""
        subscription = self.get_object()
        if subscription.status == 'cancelled':
            return Response({
                "success": False,
                "error": {
                    "code": "ALREADY_CANCELLED",
                    "message": "This subscription is already cancelled."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        subscription.status = 'cancelled'
        subscription.save()
        logger.info(f"Admin {request.user.email} cancelled subscription {subscription.id} for user {subscription.user.email}")
        
        return Response({
            "success": True,
            "message": "Subscription cancelled successfully.",
            "data": SubscriptionSerializer(subscription).data
        })
    
    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Extend a subscription by a specified number of days."""
        subscription = self.get_object()
        days = request.data.get('days', 30)
        
        try:
            days = int(days)
            if days <= 0:
                raise ValueError("Days must be positive")
        except (ValueError, TypeError):
            return Response({
                "success": False,
                "error": {
                    "code": "INVALID_DAYS",
                    "message": "Please provide a valid positive number of days."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        subscription.expire_date = subscription.expire_date + timedelta(days=days)
        if subscription.status == 'expired':
            subscription.status = 'active'
        subscription.save()
        
        logger.info(f"Admin {request.user.email} extended subscription {subscription.id} by {days} days")
        
        return Response({
            "success": True,
            "message": f"Subscription extended by {days} days.",
            "data": SubscriptionSerializer(subscription).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get subscription statistics."""
        now = timezone.now()
        
        total = SubscriptionModel.objects.count()
        active = SubscriptionModel.objects.filter(status='active').count()
        expired = SubscriptionModel.objects.filter(status='expired').count()
        cancelled = SubscriptionModel.objects.filter(status='cancelled').count()
        
        # Revenue stats
        total_revenue = SubscriptionModel.objects.aggregate(total=Sum('price'))['total'] or 0
        avg_subscription_value = SubscriptionModel.objects.aggregate(avg=Avg('price'))['avg'] or 0
        
        # Monthly subscription trend (last 6 months)
        six_months_ago = now - timedelta(days=180)
        monthly_trend = SubscriptionModel.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id'),
            revenue=Sum('price')
        ).order_by('month')
        
        return Response({
            "success": True,
            "data": {
                "total_subscriptions": total,
                "active_subscriptions": active,
                "expired_subscriptions": expired,
                "cancelled_subscriptions": cancelled,
                "total_revenue": float(total_revenue),
                "average_subscription_value": float(avg_subscription_value),
                "monthly_trend": list(monthly_trend)
            }
        })
    
    @action(detail=False, methods=['get'])
    def expiring(self, request):
        """Get subscriptions expiring within the next 7 days."""
        days = int(request.query_params.get('days', 7))
        now = timezone.now()
        expiring_soon = SubscriptionModel.objects.filter(
            status='active',
            expire_date__lte=now + timedelta(days=days),
            expire_date__gte=now
        ).select_related('user', 'plan').order_by('expire_date')
        
        return Response({
            "success": True,
            "count": expiring_soon.count(),
            "data": SubscriptionSerializer(expiring_soon, many=True).data
        })


class AdminRevenueView(APIView):
    """
    Admin API for revenue analytics.
    
    GET /api/v1/plan/admin/revenue/ - Get revenue statistics
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get comprehensive revenue statistics."""
        now = timezone.now()
        
        # Total revenue
        total_revenue = Revenue.objects.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        # Revenue by period
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        today_revenue = Revenue.objects.filter(
            date=today,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        week_revenue = Revenue.objects.filter(
            date__gte=week_start,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        month_revenue = Revenue.objects.filter(
            date__gte=month_start,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Daily revenue for the last 30 days
        thirty_days_ago = today - timedelta(days=30)
        daily_revenue = Revenue.objects.filter(
            date__gte=thirty_days_ago,
            status='completed'
        ).annotate(
            day=TruncDate('date')
        ).values('day').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('day')
        
        # Revenue by status
        revenue_by_status = Revenue.objects.values('status').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response({
            "success": True,
            "data": {
                "total_revenue": float(total_revenue),
                "today_revenue": float(today_revenue),
                "week_revenue": float(week_revenue),
                "month_revenue": float(month_revenue),
                "daily_revenue": list(daily_revenue),
                "revenue_by_status": list(revenue_by_status)
            }
        })
