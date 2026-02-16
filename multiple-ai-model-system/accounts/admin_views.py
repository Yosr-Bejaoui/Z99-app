from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import CreditAccount, CreditTransaction
from .serializers import AdminUserSerializer
from ai_model.models import ChatSession, ChatMessage, AIModelInfo
from plan.models import PlanModel, Revenue
from invoices.models import InvoiceModel

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Only allow admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint for user management
    """
    queryset = User.objects.all().select_related('creditaccount').order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Status filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Staff filter
        is_staff = self.request.query_params.get('is_staff')
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        # Subscribed filter
        subscribed = self.request.query_params.get('subscribed')
        if subscribed is not None:
            queryset = queryset.filter(subscribed=subscribed.lower() == 'true')
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-date_joined')
        queryset = queryset.order_by(ordering)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'id': user.id,
            'is_active': user.is_active,
            'message': f"User {'activated' if user.is_active else 'deactivated'} successfully"
        })
    
    @action(detail=True, methods=['post'])
    def toggle_staff(self, request, pk=None):
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save()
        return Response({
            'id': user.id,
            'is_staff': user.is_staff,
            'message': f"User {'promoted to' if user.is_staff else 'removed from'} staff"
        })
    
    @action(detail=True, methods=['post'])
    def add_credits(self, request, pk=None):
        user = self.get_object()
        amount = request.data.get('amount', 0)
        
        try:
            amount = int(amount)
            credit_account, _ = CreditAccount.objects.get_or_create(user=user)
            credit_account.credits += amount
            credit_account.save()
            
            CreditTransaction.objects.create(
                credit_account=credit_account,
                amount=amount,
                transaction_type='credit',
                description='Admin credit addition'
            )
            
            return Response({
                'message': f'Added {amount} credits to user',
                'new_balance': credit_account.credits
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    """
    Dashboard statistics for admin panel
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # User stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_today = User.objects.filter(date_joined__date=today).count()
        new_this_week = User.objects.filter(date_joined__date__gte=week_ago).count()
        new_last_week = User.objects.filter(
            date_joined__date__gte=week_ago - timedelta(days=7),
            date_joined__date__lt=week_ago
        ).count()
        
        user_growth = 0
        if new_last_week > 0:
            user_growth = round(((new_this_week - new_last_week) / new_last_week) * 100, 1)
        
        # Subscription stats
        subscribed_users = User.objects.filter(subscribed=True).count()
        total_revenue = Revenue.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        this_month_revenue = Revenue.objects.filter(
            created_at__date__gte=month_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        last_month_revenue = Revenue.objects.filter(
            created_at__date__gte=month_ago - timedelta(days=30),
            created_at__date__lt=month_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = round(((this_month_revenue - last_month_revenue) / last_month_revenue) * 100, 1)
        
        # Usage stats
        total_sessions = ChatSession.objects.count()
        total_messages = ChatMessage.objects.count()
        sessions_today = ChatSession.objects.filter(created_at__date=today).count()
        
        # Model stats
        total_models = AIModelInfo.objects.count()
        active_models = AIModelInfo.objects.filter(is_active=True).count()
        
        # Most used model
        most_used = ChatSession.objects.values('ai_model__name').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
                'new_today': new_today,
                'new_this_week': new_this_week,
                'growth_percentage': user_growth,
            },
            'subscriptions': {
                'total_active': subscribed_users,
                'revenue_this_month': float(this_month_revenue),
                'revenue_total': float(total_revenue),
                'revenue_growth': revenue_growth,
            },
            'usage': {
                'total_sessions': total_sessions,
                'total_messages': total_messages,
                'sessions_today': sessions_today,
            },
            'models': {
                'total': total_models,
                'active': active_models,
                'most_used': most_used['ai_model__name'] if most_used else 'N/A',
            }
        })


class UsageAnalyticsView(APIView):
    """
    Usage analytics over time
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Sessions per day
        sessions_data = ChatSession.objects.filter(
            created_at__date__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Messages per day
        messages_data = ChatMessage.objects.filter(
            created_at__date__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Create combined data
        result = []
        sessions_dict = {str(item['date']): item['count'] for item in sessions_data}
        messages_dict = {str(item['date']): item['count'] for item in messages_data}
        
        current_date = start_date
        while current_date <= timezone.now().date():
            date_str = str(current_date)
            result.append({
                'date': date_str,
                'sessions': sessions_dict.get(date_str, 0),
                'messages': messages_dict.get(date_str, 0),
            })
            current_date += timedelta(days=1)
        
        return Response(result)


class RevenueAnalyticsView(APIView):
    """
    Revenue analytics over time
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        revenue_data = Revenue.objects.filter(
            created_at__date__gte=start_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            amount=Sum('amount')
        ).order_by('date')
        
        # Create complete data with zeros for missing days
        result = []
        revenue_dict = {str(item['date']): float(item['amount']) for item in revenue_data}
        
        current_date = start_date
        while current_date <= timezone.now().date():
            date_str = str(current_date)
            result.append({
                'date': date_str,
                'amount': revenue_dict.get(date_str, 0),
            })
            current_date += timedelta(days=1)
        
        return Response(result)


class UserGrowthAnalyticsView(APIView):
    """
    User growth analytics
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # New users per day
        new_users_data = User.objects.filter(
            date_joined__date__gte=start_date
        ).annotate(
            date=TruncDate('date_joined')
        ).values('date').annotate(
            new_users=Count('id')
        ).order_by('date')
        
        # Create data with cumulative total
        result = []
        new_users_dict = {str(item['date']): item['new_users'] for item in new_users_data}
        
        # Get total users before start date
        total_before = User.objects.filter(date_joined__date__lt=start_date).count()
        running_total = total_before
        
        current_date = start_date
        while current_date <= timezone.now().date():
            date_str = str(current_date)
            new_users = new_users_dict.get(date_str, 0)
            running_total += new_users
            
            result.append({
                'date': date_str,
                'new_users': new_users,
                'total_users': running_total,
            })
            current_date += timedelta(days=1)
        
        return Response(result)


class ModelUsageStatsView(APIView):
    """
    Model usage statistics
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get usage count per model
        model_usage = ChatSession.objects.values(
            'ai_model__id', 'ai_model__name', 'ai_model__provider', 'ai_model__model_type'
        ).annotate(
            usage_count=Count('id')
        ).order_by('-usage_count')
        
        total_usage = sum(item['usage_count'] for item in model_usage)
        
        result = []
        for item in model_usage:
            percentage = round((item['usage_count'] / total_usage * 100), 1) if total_usage > 0 else 0
            result.append({
                'id': item['ai_model__id'],
                'name': item['ai_model__name'] or 'Unknown',
                'provider': item['ai_model__provider'] or 'Unknown',
                'model_type': item['ai_model__model_type'] or 'chat',
                'usage_count': item['usage_count'],
                'percentage': percentage,
            })
        
        return Response(result)


class TopUsersView(APIView):
    """
    Get top users by usage
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        # Get users with most sessions
        top_users = User.objects.annotate(
            session_count=Count('chatsession'),
            total_usage=Sum('total_token_used')
        ).order_by('-session_count')[:limit]
        
        result = []
        for user in top_users:
            result.append({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'session_count': user.session_count,
                'total_usage': float(user.total_usage or 0),
                'subscribed': user.subscribed,
            })
        
        return Response(result)
