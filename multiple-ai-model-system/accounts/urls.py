from .views import RegisterView, ActivateAccountView, LoginView,LogoutView,CreditTransactionHistoryView,GoogleLoginAPIView,ForgotPasswordView,ResetView,ProfileView,CreditAccountView,CreateAdminView,ChangePasswordView
from .admin_views import (
    AdminUserViewSet, DashboardStatsView, UsageAnalyticsView,
    RevenueAnalyticsView, UserGrowthAnalyticsView, ModelUsageStatsView, TopUsersView
)
from .system_views import (
    SystemConfigViewSet, APIProviderConfigViewSet, WebhookConfigViewSet, SystemLogViewSet
)
from django.urls import path,include
from rest_framework.routers import DefaultRouter

router=DefaultRouter()
router.register('profile',ProfileView,basename='profile')
router.register('admin/users', AdminUserViewSet, basename='admin-users')
router.register('admin/config', SystemConfigViewSet, basename='admin-config')
router.register('admin/providers', APIProviderConfigViewSet, basename='admin-providers')
router.register('admin/webhooks', WebhookConfigViewSet, basename='admin-webhooks')
router.register('admin/logs', SystemLogViewSet, basename='admin-logs')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('activate/', ActivateAccountView.as_view(), name='activate'),
    path('login/', LoginView.as_view(), name='login'),
    path('google/login/',GoogleLoginAPIView.as_view(),name='google-login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('transactions/', CreditTransactionHistoryView.as_view(), name='transaction-history'),
    path('forgot-password/',ForgotPasswordView.as_view(),name="forgot-password"),
    path('reset-password/',ResetView.as_view(),name='reset-password'),
    path('credit-account/',CreditAccountView.as_view(),name='credit-account'),
    path('change-password/',ChangePasswordView.as_view(),name='change-password'),
    path('admin/create/', CreateAdminView.as_view(), name='create-admin'),
    # Analytics endpoints for admin dashboard
    path('analytics/dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('analytics/usage/', UsageAnalyticsView.as_view(), name='usage-analytics'),
    path('analytics/revenue/', RevenueAnalyticsView.as_view(), name='revenue-analytics'),
    path('analytics/user-growth/', UserGrowthAnalyticsView.as_view(), name='user-growth-analytics'),
    path('analytics/model-usage/', ModelUsageStatsView.as_view(), name='model-usage-stats'),
    path('analytics/top-users/', TopUsersView.as_view(), name='top-users'),
    path('',include(router.urls)),
    
]