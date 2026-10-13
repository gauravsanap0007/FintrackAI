import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Account

User = get_user_model()


@pytest.mark.django_db
class TestAccountIsolation:
    def setup_method(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='usera@example.com', password='Password123!')
        self.user_b = User.objects.create_user(email='userb@example.com', password='Password123!')

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        self.accounts_url = '/api/accounts/'

    def test_account_creation_and_listing(self):
        payload = {
            'name': 'HDFC Salary',
            'account_type': 'BANK',
            'balance': 50000.00,
            'currency': 'INR',
            'account_number_last4': '1234',
            'institution_name': 'HDFC Bank'
        }
        res = self.client_a.post(self.accounts_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['name'] == 'HDFC Salary'
        assert float(res.data['balance']) == 50000.00

        # Verify DB object has user_a assigned automatically
        account = Account.objects.get(id=res.data['id'])
        assert account.user == self.user_a

    def test_cross_user_account_isolation(self):
        # Create an account for User A
        acc_a = Account.objects.create(
            user=self.user_a,
            name='User A Secret Account',
            account_type='BANK',
            balance=100000.00
        )

        # Create an account for User B
        acc_b = Account.objects.create(
            user=self.user_b,
            name='User B Account',
            account_type='CASH',
            balance=5000.00
        )

        # 1. User B lists accounts -> must NOT see User A's account
        res_b_list = self.client_b.get(self.accounts_url)
        assert res_b_list.status_code == status.HTTP_200_OK
        results = res_b_list.data.get('results', res_b_list.data)
        assert len(results) == 1
        assert results[0]['name'] == 'User B Account'

        # 2. User B tries to retrieve User A's account directly -> 404 NOT FOUND
        res_b_get_a = self.client_b.get(f"{self.accounts_url}{acc_a.id}/")
        assert res_b_get_a.status_code == status.HTTP_404_NOT_FOUND

        # 3. User B tries to update User A's account -> 404 NOT FOUND
        res_b_put_a = self.client_b.put(
            f"{self.accounts_url}{acc_a.id}/",
            {'name': 'Hacked Account', 'account_type': 'BANK', 'balance': 0},
            format='json'
        )
        assert res_b_put_a.status_code == status.HTTP_404_NOT_FOUND

        # 4. User B tries to delete User A's account -> 404 NOT FOUND
        res_b_del_a = self.client_b.delete(f"{self.accounts_url}{acc_a.id}/")
        assert res_b_del_a.status_code == status.HTTP_404_NOT_FOUND

        # Verify User A's account still exists intact
        acc_a.refresh_from_db()
        assert acc_a.name == 'User A Secret Account'
        assert float(acc_a.balance) == 100000.00

    def test_account_summary_isolated(self):
        Account.objects.create(user=self.user_a, name='Bank 1', balance=1000.00, account_type='BANK')
        Account.objects.create(user=self.user_a, name='Cash 1', balance=500.00, account_type='CASH')
        Account.objects.create(user=self.user_b, name='Bank 2', balance=50000.00, account_type='BANK')

        res_a = self.client_a.get(f"{self.accounts_url}summary/")
        assert res_a.status_code == status.HTTP_200_OK
        assert res_a.data['total_balance'] == 1500.00
        assert res_a.data['account_count'] == 2

        res_b = self.client_b.get(f"{self.accounts_url}summary/")
        assert res_b.status_code == status.HTTP_200_OK
        assert res_b.data['total_balance'] == 50000.00
        assert res_b.data['account_count'] == 1
