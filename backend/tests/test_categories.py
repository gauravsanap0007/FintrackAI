import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.categories.models import Category
from apps.categories.services import seed_default_categories

User = get_user_model()


@pytest.mark.django_db
class TestCategoryManagement:
    def setup_method(self):
        seed_default_categories()
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='usera@example.com', password='Password123!')
        self.user_b = User.objects.create_user(email='userb@example.com', password='Password123!')

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        self.categories_url = '/api/categories/'

    def test_listing_categories_includes_defaults(self):
        res = self.client_a.get(self.categories_url)
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results', res.data)
        assert len(results) >= 18
        # Check that Food & Dining is present
        names = [c['name'] for c in results]
        assert 'Food & Dining' in names
        assert 'Salary' in names

    def test_filter_categories_by_type(self):
        res = self.client_a.get(f"{self.categories_url}?type=EXPENSE")
        assert res.status_code == status.HTTP_200_OK
        results = res.data.get('results', res.data)
        for cat in results:
            assert cat['category_type'] == 'EXPENSE'

    def test_create_custom_category(self):
        payload = {
            'name': 'Gym & Fitness',
            'category_type': 'EXPENSE',
            'icon': 'dumbbell',
            'color': '#10B981'
        }
        res = self.client_a.post(self.categories_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['name'] == 'Gym & Fitness'
        assert res.data['is_custom'] is True
        assert res.data['is_default'] is False

        # Verify User A sees it
        list_a = self.client_a.get(self.categories_url)
        names_a = [c['name'] for c in list_a.data.get('results', list_a.data)]
        assert 'Gym & Fitness' in names_a

        # Verify User B does NOT see User A's custom category
        list_b = self.client_b.get(self.categories_url)
        names_b = [c['name'] for c in list_b.data.get('results', list_b.data)]
        assert 'Gym & Fitness' not in names_b

    def test_cannot_modify_or_delete_default_category(self):
        default_cat = Category.objects.filter(is_default=True).first()
        assert default_cat is not None

        # Attempt to delete default category -> 403 Forbidden
        del_res = self.client_a.delete(f"{self.categories_url}{default_cat.id}/")
        assert del_res.status_code == status.HTTP_403_FORBIDDEN

        # Attempt to modify default category -> 403 Forbidden
        patch_res = self.client_a.patch(
            f"{self.categories_url}{default_cat.id}/",
            {'name': 'Modified Category'},
            format='json'
        )
        assert patch_res.status_code == status.HTTP_403_FORBIDDEN
