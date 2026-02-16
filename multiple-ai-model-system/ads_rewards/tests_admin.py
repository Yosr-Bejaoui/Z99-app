"""
Unit tests for ads_rewards admin API endpoints.
Tests cover: Admin Rewards ViewSet, Reward Configuration
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from .models import RewardsHistory

User = get_user_model()


class AdminRewardsViewSetTests(APITestCase):
    """Tests for AdminRewardsViewSet endpoints."""
    
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
        
        # Create test reward entries
        self.reward1 = RewardsHistory.objects.create(
            user=self.regular_user,
            reward=10
        )
        
        self.client = APIClient()
    
    def test_list_rewards_admin(self):
        """Admin can list all rewards."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_rewards_non_admin_forbidden(self):
        """Non-admin cannot list rewards via admin endpoint."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_rewards_unauthenticated_forbidden(self):
        """Unauthenticated user cannot list rewards via admin endpoint."""
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_grant_reward_admin(self):
        """Admin can manually grant credits to a user."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'user_id': self.regular_user.id,
            'credits': 100,
            'reason': 'Bonus reward for testing'
        }
        response = self.client.post('/api/v1/ads_rewards/admin/rewards/grant/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_grant_reward_invalid_user(self):
        """Admin cannot grant credits to non-existent user."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'user_id': 99999,  # Non-existent user
            'credits': 100,
            'reason': 'Test'
        }
        response = self.client.post('/api/v1/ads_rewards/admin/rewards/grant/', data)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])
    
    def test_grant_reward_non_admin_forbidden(self):
        """Non-admin cannot grant credits."""
        self.client.force_authenticate(user=self.regular_user)
        data = {
            'user_id': self.regular_user.id,
            'credits': 100,
            'reason': 'Test'
        }
        response = self.client.post('/api/v1/ads_rewards/admin/rewards/grant/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_rewards_stats_admin(self):
        """Admin can get reward statistics."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('total_rewards', response.data.get('data', {}))
    
    def test_user_reward_history_admin(self):
        """Admin can get a user's reward history."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/v1/ads_rewards/admin/rewards/user_history/?user_id={self.regular_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_user_reward_history_missing_user_id(self):
        """Admin must provide user_id for reward history."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/user_history/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RewardConfigViewTests(APITestCase):
    """Tests for RewardConfigView endpoints."""
    
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
        
        self.client = APIClient()
    
    def test_get_reward_config_admin(self):
        """Admin can get reward configuration."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/config/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_update_reward_config_admin(self):
        """Admin can update reward configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'credits_per_video_ad': 15,
            'daily_limit': 20
        }
        response = self.client.put('/api/v1/ads_rewards/admin/config/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_get_reward_config_non_admin_forbidden(self):
        """Non-admin cannot get reward configuration."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/ads_rewards/admin/config/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_reward_config_non_admin_forbidden(self):
        """Non-admin cannot update reward configuration."""
        self.client.force_authenticate(user=self.regular_user)
        data = {
            'credits_per_video_ad': 50
        }
        response = self.client.put('/api/v1/ads_rewards/admin/config/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RewardFilterTests(APITestCase):
    """Tests for reward filtering capabilities."""
    
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
        
        # Create rewards for different users
        RewardsHistory.objects.create(
            user=self.user1,
            reward=10
        )
        RewardsHistory.objects.create(
            user=self.user2,
            reward=20
        )
        
        self.client = APIClient()
    
    def test_filter_rewards_by_user(self):
        """Admin can filter rewards by user."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/', {'user': self.user1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_rewards_by_ad_type(self):
        """Admin can filter rewards by ad type."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/', {'ad_type': 'video'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_rewards_by_date_range(self):
        """Admin can filter rewards by date range."""
        self.client.force_authenticate(user=self.admin_user)
        today = date.today().isoformat()
        response = self.client.get('/api/v1/ads_rewards/admin/rewards/', {
            'start_date': today,
            'end_date': today
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class WatchedAdsTests(APITestCase):
    """Tests for watched ads tracking."""
    
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
        
        self.client = APIClient()
    
    def test_record_watched_ad(self):
        """User can record watching an ad."""
        self.client.force_authenticate(user=self.regular_user)
        data = {
            'ad_type': 'video',
            'ad_network': 'admob',
            'ad_id': 'ca-app-pub-12345'
        }
        response = self.client.post('/api/v1/ads_rewards/watch/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_get_user_ad_stats(self):
        """User can get their ad watching statistics."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/ads_rewards/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
