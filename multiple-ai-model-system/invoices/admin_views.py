"""
Admin Views for Invoice Management.
Provides CRUD operations and analytics for invoices.
"""
import logging
import csv
from io import StringIO
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import InvoiceModel
from .serializers import InvoiceSerializer

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class AdminInvoiceSerializer(InvoiceSerializer):
    """Extended serializer for admin invoice management."""
    
    class Meta(InvoiceSerializer.Meta):
        fields = InvoiceSerializer.Meta.fields + ['user_email'] if hasattr(InvoiceSerializer.Meta, 'fields') else '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user:
            data['user_email'] = instance.user.email
        if instance.plan:
            data['plan_name'] = instance.plan.name
        return data


class AdminInvoiceViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing invoices.
    
    Endpoints:
    - GET /api/v1/invoices/admin/invoices/ - List all invoices
    - GET /api/v1/invoices/admin/invoices/{id}/ - Retrieve an invoice
    - PUT /api/v1/invoices/admin/invoices/{id}/ - Update invoice status
    - GET /api/v1/invoices/admin/invoices/stats/ - Get invoice statistics
    - GET /api/v1/invoices/admin/invoices/export/ - Export invoices to CSV
    - POST /api/v1/invoices/admin/invoices/{id}/mark_paid/ - Mark as paid
    - POST /api/v1/invoices/admin/invoices/{id}/mark_refunded/ - Mark as refunded
    """
    queryset = InvoiceModel.objects.select_related('user', 'plan').all().order_by('-created_at')
    serializer_class = AdminInvoiceSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'plan']
    search_fields = ['invoice_id', 'user__email', 'plan__name']
    ordering_fields = ['created_at', 'amount', 'status']
    http_method_names = ['get', 'put', 'patch', 'head', 'options']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark an invoice as paid."""
        invoice = self.get_object()
        if invoice.status == 'paid':
            return Response({
                "success": False,
                "error": {
                    "code": "ALREADY_PAID",
                    "message": "This invoice is already marked as paid."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invoice.status = 'paid'
        invoice.save()
        logger.info(f"Admin {request.user.email} marked invoice {invoice.invoice_id} as paid")
        
        return Response({
            "success": True,
            "message": "Invoice marked as paid.",
            "data": AdminInvoiceSerializer(invoice).data
        })
    
    @action(detail=True, methods=['post'])
    def mark_refunded(self, request, pk=None):
        """Mark an invoice as refunded."""
        invoice = self.get_object()
        if invoice.status == 'refunded':
            return Response({
                "success": False,
                "error": {
                    "code": "ALREADY_REFUNDED",
                    "message": "This invoice is already marked as refunded."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invoice.status = 'refunded'
        invoice.save()
        logger.info(f"Admin {request.user.email} marked invoice {invoice.invoice_id} as refunded")
        
        return Response({
            "success": True,
            "message": "Invoice marked as refunded.",
            "data": AdminInvoiceSerializer(invoice).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics."""
        now = timezone.now()
        today = now.date()
        
        # Total stats
        total_invoices = InvoiceModel.objects.count()
        total_amount = InvoiceModel.objects.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        # Status breakdown
        status_breakdown = InvoiceModel.objects.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        )
        
        # Today's invoices
        today_count = InvoiceModel.objects.filter(created_at__date=today).count()
        today_amount = InvoiceModel.objects.filter(
            created_at__date=today,
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # This month's invoices
        month_start = today.replace(day=1)
        month_count = InvoiceModel.objects.filter(created_at__date__gte=month_start).count()
        month_amount = InvoiceModel.objects.filter(
            created_at__date__gte=month_start,
            status='paid'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Daily trend (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        daily_trend = InvoiceModel.objects.filter(
            created_at__date__gte=thirty_days_ago
        ).annotate(
            day=TruncDate('created_at')
        ).values('day').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('day')
        
        # Top plans by invoice count
        top_plans = InvoiceModel.objects.filter(plan__isnull=False).values(
            'plan__name'
        ).annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-count')[:5]
        
        return Response({
            "success": True,
            "data": {
                "total_invoices": total_invoices,
                "total_paid_amount": float(total_amount),
                "status_breakdown": list(status_breakdown),
                "today": {
                    "count": today_count,
                    "amount": float(today_amount)
                },
                "this_month": {
                    "count": month_count,
                    "amount": float(month_amount)
                },
                "daily_trend": list(daily_trend),
                "top_plans": list(top_plans)
            }
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export invoices to CSV."""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Invoice ID', 'User Email', 'Plan', 'Amount', 'Words', 
            'Status', 'Created At', 'Updated At'
        ])
        
        # Data
        for invoice in queryset:
            writer.writerow([
                str(invoice.invoice_id),
                invoice.user.email if invoice.user else 'N/A',
                invoice.plan.name if invoice.plan else 'N/A',
                float(invoice.amount),
                invoice.words,
                invoice.status,
                invoice.created_at.isoformat(),
                invoice.updated_at.isoformat()
            ])
        
        # Create response
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="invoices_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        logger.info(f"Admin {request.user.email} exported {queryset.count()} invoices to CSV")
        
        return response


class InvoiceSearchView(APIView):
    """
    Search invoices by various criteria.
    
    GET /api/v1/invoices/admin/search/?q=search_term
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Search invoices."""
        query = request.query_params.get('q', '')
        
        if not query or len(query) < 2:
            return Response({
                "success": False,
                "error": {
                    "code": "QUERY_TOO_SHORT",
                    "message": "Search query must be at least 2 characters."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        invoices = InvoiceModel.objects.filter(
            Q(invoice_id__icontains=query) |
            Q(user__email__icontains=query) |
            Q(plan__name__icontains=query)
        ).select_related('user', 'plan')[:50]
        
        return Response({
            "success": True,
            "count": invoices.count(),
            "data": AdminInvoiceSerializer(invoices, many=True).data
        })
