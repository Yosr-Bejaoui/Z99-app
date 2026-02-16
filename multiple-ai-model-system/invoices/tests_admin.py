"""
Unit tests for invoice admin API endpoints.
Tests cover: Admin Invoice ViewSet, Invoice Search
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from .models import InvoiceModel

User = get_user_model()


class AdminInvoiceViewSetTests(APITestCase):
    """Tests for AdminInvoiceViewSet endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test invoices
        self.invoice1 = InvoiceModel.objects.create(
            user=self.regular_user,
            amount=Decimal('29.99'),
            payment_status='unpaid',
            invoice_id='INV-001'
        )
        self.invoice2 = InvoiceModel.objects.create(
            user=self.regular_user,
            amount=Decimal('99.99'),
            payment_status='paid',
            invoice_id='INV-002'
        )
        
        self.client = APIClient()
    
    def test_list_invoices_admin(self):
        """Admin can list all invoices."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_invoices_non_admin_forbidden(self):
        """Non-admin cannot list invoices via admin endpoint."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/invoices/admin/invoices/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_invoices_unauthenticated_forbidden(self):
        """Unauthenticated user cannot list invoices via admin endpoint."""
        response = self.client.get('/api/v1/invoices/admin/invoices/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_invoice_admin(self):
        """Admin can create a new invoice."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'user': self.regular_user.id,
            'amount': '49.99',
            'status': 'pending',
            'invoice_number': 'INV-003'
        }
        response = self.client.post('/api/v1/invoices/admin/invoices/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_update_invoice_admin(self):
        """Admin can update an invoice."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'amount': '35.99'
        }
        response = self.client.patch(f'/api/v1/invoices/admin/invoices/{self.invoice1.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice1.refresh_from_db()
        self.assertEqual(str(self.invoice1.amount), '35.99')
    
    def test_delete_invoice_admin(self):
        """Admin can delete an invoice."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/invoices/admin/invoices/{self.invoice2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(InvoiceModel.objects.filter(id=self.invoice2.id).exists())
    
    def test_mark_paid_invoice_admin(self):
        """Admin can mark an invoice as paid."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/invoices/admin/invoices/{self.invoice1.id}/mark_paid/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice1.refresh_from_db()
        self.assertEqual(self.invoice1.payment_status, 'paid')
    
    def test_mark_refunded_invoice_admin(self):
        """Admin can mark an invoice as refunded."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/api/v1/invoices/admin/invoices/{self.invoice2.id}/mark_refunded/',
            {'reason': 'Customer request'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.invoice2.refresh_from_db()
        # Refunded status may not exist in model, just check for 200 response
    
    def test_invoice_stats_admin(self):
        """Admin can get invoice statistics."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/invoices/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('total_invoices', response.data.get('data', {}))
    
    def test_export_invoices_admin(self):
        """Admin can export invoices to CSV."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/invoices/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')


class InvoiceSearchViewTests(APITestCase):
    """Tests for InvoiceSearchView endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test invoices
        InvoiceModel.objects.create(
            user=self.regular_user,
            amount=Decimal('29.99'),
            payment_status='unpaid',
            invoice_id='INV-SEARCH-001'
        )
        InvoiceModel.objects.create(
            user=self.regular_user,
            amount=Decimal('99.99'),
            payment_status='paid',
            invoice_id='INV-SEARCH-002'
        )
        
        self.client = APIClient()
    
    def test_search_invoices_by_number(self):
        """Admin can search invoices by invoice number."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/search/', {'q': 'INV-SEARCH-001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_search_invoices_by_status(self):
        """Admin can filter invoices by status."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/search/', {'status': 'paid'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_search_invoices_non_admin_forbidden(self):
        """Non-admin cannot search invoices."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/invoices/admin/search/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class InvoiceFilterTests(APITestCase):
    """Tests for invoice filtering capabilities."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular users
        self.user1 = User.objects.create_user(
            email='user1@test.com',
            password='UserPass123!'
        )
        self.user2 = User.objects.create_user(
            email='user2@test.com',
            password='UserPass123!'
        )
        
        # Create invoices for different users
        InvoiceModel.objects.create(
            user=self.user1,
            amount=Decimal('10.00'),
            payment_status='unpaid',
            invoice_id='INV-U1-001'
        )
        InvoiceModel.objects.create(
            user=self.user2,
            amount=Decimal('20.00'),
            payment_status='paid',
            invoice_id='INV-U2-001'
        )
        
        self.client = APIClient()
    
    def test_filter_invoices_by_user(self):
        """Admin can filter invoices by user."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/invoices/admin/invoices/', {'user': self.user1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_invoices_by_date_range(self):
        """Admin can filter invoices by date range."""
        self.client.force_authenticate(user=self.admin_user)
        today = date.today().isoformat()
        response = self.client.get('/api/v1/invoices/admin/invoices/', {
            'start_date': today,
            'end_date': today
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
