from django.urls import path,include
from .views import PlanView,TotalRevenueView,VerifyGooglePurchaseView #,SubscriptionView,CreateCheckoutSessionView
from rest_framework.routers import DefaultRouter
from .stripe_webhook import stripe_webhook

router=DefaultRouter()
router.register('list',PlanView,basename='plan')
# router.register('subscription/list',SubscriptionView,basename='subscription')
urlpatterns = [
    # path('checkout/',CreateCheckoutSessionView.as_view()),
    path('webhook/', stripe_webhook, name='stripe-webhook'),
    path('',include(router.urls)),
    path('revenue/',TotalRevenueView.as_view(),name='revenue'),
    path('checkout/google-pay/',VerifyGooglePurchaseView.as_view()),

]
