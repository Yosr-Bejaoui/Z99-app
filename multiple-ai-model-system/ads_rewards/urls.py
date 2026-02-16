from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views import RewardsHistoryView
from .admin_views import AdminRewardsViewSet, RewardConfigView

router=DefaultRouter()
router.register('rewards',RewardsHistoryView)
router.register('admin/rewards', AdminRewardsViewSet, basename='admin-rewards')

urlpatterns=[
    path('',include(router.urls)),
    path('admin/config/', RewardConfigView.as_view(), name='admin-reward-config'),
]