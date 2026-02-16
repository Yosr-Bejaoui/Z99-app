from django.urls import path,include
from .views import PlanView,TotalRevenueView,VerifyGooglePurchaseView #,SubscriptionView,CreateCheckoutSessionView
from .admin_views import AdminPlanViewSet, AdminSubscriptionViewSet, AdminRevenueView
from rest_framework.routers import DefaultRouter
from .stripe_webhook import stripe_webhook

router=DefaultRouter()
router.register('list',PlanView,basename='plan')
router.register('admin/plans', AdminPlanViewSet, basename='admin-plans')
router.register('admin/subscriptions', AdminSubscriptionViewSet, basename='admin-subscriptions')
# router.register('subscription/list',SubscriptionView,basename='subscription')
urlpatterns = [
    # path('checkout/',CreateCheckoutSessionView.as_view()),
    path('webhook/', stripe_webhook, name='stripe-webhook'),
    path('',include(router.urls)),
    path('revenue/',TotalRevenueView.as_view(),name='revenue'),
    path('checkout/google-pay/',VerifyGooglePurchaseView.as_view()),
    # Admin revenue analytics
    path('admin/revenue/', AdminRevenueView.as_view(), name='admin-revenue'),

]
