from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta, date
from .models import CreditAccount, CreditTransaction
from .serializers import AdminUserSerializer
from ai_model.models import ChatSession, ChatMessage, AIModelInfo
from plan.models import PlanModel, Revenue, SubscriptionModel
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
                transaction_type='add',
                message='Admin credit addition'
            )
            
            return Response({
                'message': f'Added {amount} credits to user',
                'new_balance': int(credit_account.credits)
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def purchases(self, request, pk=None):
        """Get user's purchase/invoice history"""
        user = self.get_object()
        invoices = InvoiceModel.objects.filter(user=user).order_by('-created_at')
        
        data = []
        for inv in invoices:
            data.append({
                'id': inv.id,
                'plan_name': inv.plan.name if inv.plan else 'N/A',
                'amount': str(inv.amount),
                'status': inv.status,
                'payment_method': inv.payment_method,
                'created_at': inv.created_at.isoformat() if inv.created_at else None,
            })
        
        return Response(data)

    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        """Get user's usage statistics"""
        user = self.get_object()
        
        # Chat sessions count
        chat_sessions = ChatSession.objects.filter(user=user).count()
        
        # Total messages
        total_messages = ChatMessage.objects.filter(session__user=user).count()
        
        # Credit transactions
        try:
            credit_account = CreditAccount.objects.get(user=user)
            transactions = CreditTransaction.objects.filter(
                credit_account=credit_account
            ).order_by('-created_at')[:20]
            
            transaction_data = [{
                'id': t.id,
                'amount': t.amount,
                'type': t.transaction_type,
                'description': t.message or '',
                'created_at': t.created_at.isoformat() if t.created_at else None,
            } for t in transactions]
            
            total_credits_used = CreditTransaction.objects.filter(
                credit_account=credit_account,
                transaction_type='deduct'
            ).aggregate(total=Sum('amount'))['total'] or 0
        except CreditAccount.DoesNotExist:
            transaction_data = []
            total_credits_used = 0
        
        return Response({
            'chat_sessions': chat_sessions,
            'total_messages': total_messages,
            'total_credits_used': abs(total_credits_used),
            'total_token_used': user.total_token_used or 0,
            'transactions': transaction_data,
        })

    @action(detail=True, methods=['post'])
    def set_credits(self, request, pk=None):
        """Set user's credit balance to a specific amount"""
        user = self.get_object()
        amount = request.data.get('amount')
        reason = request.data.get('reason', 'Admin credit adjustment')
        
        # Validate amount
        if amount is None:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = int(amount)
            if amount < 0:
                return Response({'error': 'Amount cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
                
            credit_account, _ = CreditAccount.objects.get_or_create(user=user)
            old_balance = int(credit_account.credits)
            credit_account.credits = amount
            credit_account.save()
            
            # Log the transaction
            diff = amount - old_balance
            if diff != 0:
                CreditTransaction.objects.create(
                    credit_account=credit_account,
                    amount=abs(diff),
                    transaction_type='add' if diff > 0 else 'deduct',
                    message=reason
                )
            
            return Response({
                'message': f'Credits set to {amount}',
                'old_balance': old_balance,
                'new_balance': int(credit_account.credits)
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def assign_plan(self, request, pk=None):
        """Assign a subscription plan to user"""
        user = self.get_object()
        plan_id = request.data.get('plan_id')
        duration_type = request.data.get('duration_type', 'monthly')
        
        if not plan_id:
            return Response({'error': 'Plan ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = PlanModel.objects.get(id=plan_id, is_active=True)
            
            # Calculate dates based on duration
            start = date.today()
            if duration_type == 'weekly':
                expire = start + timedelta(days=7)
            elif duration_type == 'yearly':
                expire = start + timedelta(days=365)
            else:  # monthly
                expire = start + timedelta(days=30)
            
            # Create or update subscription
            subscription, created = SubscriptionModel.objects.update_or_create(
                user=user,
                status='active',
                defaults={
                    'plan': plan,
                    'price': plan.amount,
                    'credits_words': plan.words_or_credits,
                    'used_words': 0,
                    'duration_type': duration_type,
                    'start_date': start,
                    'expire_date': expire,
                    'status': 'active',
                }
            )
            
            # Update user subscribed status
            user.subscribed = True
            user.save()
            
            # Add credits from plan
            credit_account, _ = CreditAccount.objects.get_or_create(user=user)
            credit_account.credits += plan.words_or_credits
            credit_account.save()
            
            CreditTransaction.objects.create(
                credit_account=credit_account,
                amount=plan.words_or_credits,
                transaction_type='add',
                message=f'Plan assigned by admin: {plan.name}'
            )
            
            return Response({
                'message': f'Plan {plan.name} assigned successfully',
                'subscription_id': subscription.id,
                'credits_added': plan.words_or_credits,
                'expires': expire.isoformat()
            })
        except PlanModel.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user's password"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user.password = make_password(new_password)
            user.save()
            return Response({'message': 'Password reset successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def subscription(self, request, pk=None):
        """Get user's current subscription"""
        user = self.get_object()
        
        try:
            sub = SubscriptionModel.objects.filter(user=user, status='active').order_by('-created_at').first()
            if sub:
                return Response({
                    'id': sub.id,
                    'plan_id': sub.plan.id if sub.plan else None,
                    'plan_name': sub.plan.name if sub.plan else 'N/A',
                    'credits_words': sub.credits_words,
                    'used_words': sub.used_words,
                    'duration_type': sub.duration_type,
                    'start_date': sub.start_date.isoformat() if sub.start_date else None,
                    'expire_date': sub.expire_date.isoformat() if sub.expire_date else None,
                    'status': sub.status,
                })
            return Response(None)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def plans(self, request):
        """Get all available plans"""
        plans = PlanModel.objects.filter(is_active=True)
        data = [{
            'id': p.id,
            'name': p.name,
            'plan_code': p.plan_code,
            'description': p.description,
            'words_or_credits': p.words_or_credits,
            'amount': str(p.amount),
        } for p in plans]
        return Response(data)


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
        most_used = ChatSession.objects.values('model__name').annotate(
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
                'most_used': most_used['model__name'] if most_used else 'N/A',
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
            'model__id', 'model__name', 'model__provider', 'model__model_type'
        ).annotate(
            usage_count=Count('id')
        ).order_by('-usage_count')
        
        total_usage = sum(item['usage_count'] for item in model_usage)
        
        result = []
        for item in model_usage:
            percentage = round((item['usage_count'] / total_usage * 100), 1) if total_usage > 0 else 0
            result.append({
                'id': item['model__id'],
                'name': item['model__name'] or 'Unknown',
                'provider': item['model__provider'] or 'Unknown',
                'model_type': item['model__model_type'] or 'chat',
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
            # Get active subscription plan name
            active_sub = user.subscriptions.filter(status='active').select_related('plan').first()
            plan_name = active_sub.plan.name if active_sub and active_sub.plan else ('Subscribed' if user.subscribed else 'Free')
            
            result.append({
                'id': user.id,
                'email': user.email,
                'name': f'{user.first_name} {user.last_name}'.strip() or user.username or user.email.split('@')[0],
                'username': user.username,
                'session_count': user.session_count,
                'total_usage': float(user.total_usage or 0),
                'subscribed': user.subscribed,
                'subscription_plan': plan_name,
            })
        
        return Response(result)
