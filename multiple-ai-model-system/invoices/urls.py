from django.urls import path,include
from .views import InvoiceView
from .admin_views import AdminInvoiceViewSet, InvoiceSearchView
from rest_framework.routers import DefaultRouter
router=DefaultRouter()
router.register('list',InvoiceView)
router.register('admin/invoices', AdminInvoiceViewSet, basename='admin-invoices')

urlpatterns = [
    path('',include(router.urls)),
    path('admin/search/', InvoiceSearchView.as_view(), name='admin-invoice-search'),
]
