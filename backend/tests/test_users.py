import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestUserAuth:
    def setup_method(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.refresh_url = '/api/auth/refresh/'
        self.logout_url = '/api/auth/logout/'
        self.me_url = '/api/auth/me/'

    def test_successful_registration(self):
        payload = {
            'email': 'alex@example.com',
            'username': 'alex',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        assert response.data['user']['email'] == 'alex@example.com'

        # Check DB and profile creation
        user = User.objects.get(email='alex@example.com')
        assert hasattr(user, 'profile')
        assert user.profile.currency == 'INR'

    def test_registration_password_mismatch(self):
        payload = {
            'email': 'alex@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.data

    def test_registration_short_password(self):
        payload = {
            'email': 'alex@example.com',
            'password': 'short',
            'password_confirm': 'short',
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_duplicate_email(self):
        User.objects.create_user(email='existing@example.com', password='Password123!')
        payload = {
            'email': 'EXISTING@example.com',
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!',
        }
        response = self.client.post(self.register_url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_successful_login(self):
        User.objects.create_user(email='user@example.com', password='Password123!')
        response = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'Password123!'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data
        assert 'access' in response.data['tokens']
        assert 'refresh' in response.data['tokens']
        assert response.data['user']['email'] == 'user@example.com'

    def test_login_invalid_password(self):
        User.objects.create_user(email='user@example.com', password='Password123!')
        response = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'WrongPassword'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self):
        response = self.client.post(self.login_url, {
            'email': 'nobody@example.com',
            'password': 'Password123!'
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_token_refresh(self):
        user = User.objects.create_user(email='user@example.com', password='Password123!')
        login_res = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'Password123!'
        }, format='json')
        refresh_token = login_res.data['tokens']['refresh']

        refresh_res = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        assert refresh_res.status_code == status.HTTP_200_OK
        assert 'access' in refresh_res.data

    def test_logout_and_token_blacklist(self):
        user = User.objects.create_user(email='user@example.com', password='Password123!')
        login_res = self.client.post(self.login_url, {
            'email': 'user@example.com',
            'password': 'Password123!'
        }, format='json')
        access_token = login_res.data['tokens']['access']
        refresh_token = login_res.data['tokens']['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = self.client.post(self.logout_url, {'refresh': refresh_token}, format='json')
        assert logout_res.status_code == status.HTTP_200_OK

        # Trying to use blacklisted refresh token should fail
        refresh_res = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        assert refresh_res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_profile_access_and_update(self):
        user = User.objects.create_user(email='user@example.com', password='Password123!')
        self.client.force_authenticate(user=user)

        # Get profile
        get_res = self.client.get(self.me_url)
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.data['email'] == 'user@example.com'
        assert get_res.data['profile']['currency'] == 'INR'

        # Patch profile
        patch_res = self.client.patch(self.me_url, {
            'first_name': 'Alexander',
            'currency': 'USD',
            'monthly_income_target': 75000.00
        }, format='json')
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.data['first_name'] == 'Alexander'
        assert patch_res.data['profile']['currency'] == 'USD'
        assert float(patch_res.data['profile']['monthly_income_target']) == 75000.00
