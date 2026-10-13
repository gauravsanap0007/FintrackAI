import pytest
from rest_framework.test import APIClient
from rest_framework import status
from apps.categories.services import seed_default_categories


@pytest.mark.django_db
class TestEndToEndAuthAndTransactions:
    def setup_method(self):
        seed_default_categories()
        self.client = APIClient()

    def test_complete_user_flow(self):
        # 1. Register
        reg_payload = {
            'email': 'demouser@example.com',
            'username': 'Demo User',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!'
        }
        reg_res = self.client.post('/api/auth/register/', reg_payload, format='json')
        assert reg_res.status_code == status.HTTP_201_CREATED
        tokens = reg_res.data['tokens']
        assert 'access' in tokens
        access_token = tokens['access']

        # Authenticate client with received access token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # 2. Verify Profile
        me_res = self.client.get('/api/auth/me/')
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['email'] == 'demouser@example.com'

        # 3. Create Bank Account
        acc_payload = {
            'name': 'HDFC Salary Account',
            'account_type': 'BANK',
            'balance': '50000.00',
            'currency': 'INR'
        }
        acc_res = self.client.post('/api/accounts/', acc_payload, format='json')
        assert acc_res.status_code == status.HTTP_201_CREATED
        account_id = acc_res.data['id']

        # 4. Fetch Categories
        cat_res = self.client.get('/api/categories/?type=EXPENSE')
        assert cat_res.status_code == status.HTTP_200_OK
        categories = cat_res.data.get('results', cat_res.data)
        assert len(categories) > 0
        dining_cat_id = next(c['id'] for c in categories if c['name'] == 'Food & Dining')

        # 5. Create Expense Transaction
        txn_payload = {
            'account': account_id,
            'category': dining_cat_id,
            'transaction_type': 'EXPENSE',
            'amount': '1250.00',
            'date': '2026-08-25',
            'merchant_name': 'Swiggy',
            'description': 'Family Dinner'
        }
        txn_res = self.client.post('/api/transactions/', txn_payload, format='json')
        assert txn_res.status_code == status.HTTP_201_CREATED
        txn_id = txn_res.data['id']

        # 6. Verify Account Balance Reduced from 50,000 to 48,750
        acc_check = self.client.get(f'/api/accounts/{account_id}/')
        assert float(acc_check.data['balance']) == 48750.00

        # 7. List Transactions with Search Filter
        search_res = self.client.get('/api/transactions/?search=Swiggy')
        assert search_res.status_code == status.HTTP_200_OK
        results = search_res.data.get('results', search_res.data)
        assert len(results) == 1
        assert results[0]['id'] == txn_id
        assert results[0]['merchant_name'] == 'Swiggy'

        # 8. Update Transaction Amount to 2000.00
        patch_res = self.client.patch(
            f'/api/transactions/{txn_id}/',
            {'amount': '2000.00'},
            format='json'
        )
        assert patch_res.status_code == status.HTTP_200_OK

        # Verify Account Balance Adjusted to 48,000
        acc_check_updated = self.client.get(f'/api/accounts/{account_id}/')
        assert float(acc_check_updated.data['balance']) == 48000.00

        # 9. Delete Transaction
        del_res = self.client.delete(f'/api/transactions/{txn_id}/')
        assert del_res.status_code == status.HTTP_204_NO_CONTENT

        # Verify Account Balance Restored to 50,000
        acc_check_restored = self.client.get(f'/api/accounts/{account_id}/')
        assert float(acc_check_restored.data['balance']) == 50000.00
