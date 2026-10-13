import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction

User = get_user_model()


@pytest.mark.django_db
class TestTransactions:
    def setup_method(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='usera@example.com', password='Password123!')
        self.user_b = User.objects.create_user(email='userb@example.com', password='Password123!')

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        self.acc_a1 = Account.objects.create(user=self.user_a, name='User A Bank', balance=10000.00)
        self.acc_a2 = Account.objects.create(user=self.user_a, name='User A Cash', balance=2000.00)
        self.acc_b = Account.objects.create(user=self.user_b, name='User B Bank', balance=50000.00)

        self.cat_expense = Category.objects.create(name='Dining Out', category_type='EXPENSE', is_default=True)
        self.cat_income = Category.objects.create(name='Salary', category_type='INCOME', is_default=True)

        self.txn_url = '/api/transactions/'

    def test_create_expense_updates_balance(self):
        payload = {
            'account': self.acc_a1.id,
            'category': self.cat_expense.id,
            'transaction_type': 'EXPENSE',
            'amount': '1500.00',
            'date': '2026-08-20',
            'merchant_name': 'Dominos Pizza',
            'description': 'Team lunch'
        }
        res = self.client_a.post(self.txn_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data['amount'] == '1500.00'

        # Check account balance decreased
        self.acc_a1.refresh_from_db()
        assert float(self.acc_a1.balance) == 8500.00

    def test_create_income_updates_balance(self):
        payload = {
            'account': self.acc_a1.id,
            'category': self.cat_income.id,
            'transaction_type': 'INCOME',
            'amount': '45000.00',
            'date': '2026-08-01',
            'description': 'Monthly Paycheck'
        }
        res = self.client_a.post(self.txn_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

        self.acc_a1.refresh_from_db()
        assert float(self.acc_a1.balance) == 55000.00

    def test_create_transfer_updates_both_balances(self):
        payload = {
            'account': self.acc_a1.id,
            'transfer_to_account': self.acc_a2.id,
            'transaction_type': 'TRANSFER',
            'amount': '2000.00',
            'date': '2026-08-15',
            'description': 'ATM Cash Withdrawal'
        }
        res = self.client_a.post(self.txn_url, payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED

        self.acc_a1.refresh_from_db()
        self.acc_a2.refresh_from_db()
        assert float(self.acc_a1.balance) == 8000.00
        assert float(self.acc_a2.balance) == 4000.00

    def test_update_and_delete_transaction_balance_sync(self):
        # Create initial expense
        txn = Transaction.objects.create(
            user=self.user_a,
            account=self.acc_a1,
            category=self.cat_expense,
            transaction_type='EXPENSE',
            amount=1000.00,
            date='2026-08-10'
        )
        self.acc_a1.balance -= 1000.00
        self.acc_a1.save()

        # Update expense from 1000 to 2500
        patch_res = self.client_a.patch(
            f"{self.txn_url}{txn.id}/",
            {'amount': '2500.00'},
            format='json'
        )
        assert patch_res.status_code == status.HTTP_200_OK

        self.acc_a1.refresh_from_db()
        assert float(self.acc_a1.balance) == 7500.00

        # Delete expense -> balance should restore to original 10000.00
        del_res = self.client_a.delete(f"{self.txn_url}{txn.id}/")
        assert del_res.status_code == status.HTTP_204_NO_CONTENT

        self.acc_a1.refresh_from_db()
        assert float(self.acc_a1.balance) == 10000.00

    def test_filter_and_search_transactions(self):
        Transaction.objects.create(
            user=self.user_a, account=self.acc_a1, category=self.cat_expense,
            transaction_type='EXPENSE', amount=500.00, date='2026-08-05',
            merchant_name='Starbucks Coffee', description='Morning espresso'
        )
        Transaction.objects.create(
            user=self.user_a, account=self.acc_a1, category=self.cat_income,
            transaction_type='INCOME', amount=20000.00, date='2026-08-10',
            merchant_name='Client ABC', description='Freelance project'
        )

        # Search by merchant
        res_search = self.client_a.get(f"{self.txn_url}?search=Starbucks")
        assert res_search.status_code == status.HTTP_200_OK
        results = res_search.data.get('results', res_search.data)
        assert len(results) == 1
        assert results[0]['merchant_name'] == 'Starbucks Coffee'

        # Filter by type
        res_type = self.client_a.get(f"{self.txn_url}?type=INCOME")
        assert res_type.status_code == status.HTTP_200_OK
        results = res_type.data.get('results', res_type.data)
        assert len(results) == 1
        assert results[0]['transaction_type'] == 'INCOME'

    def test_cross_user_transaction_isolation(self):
        # User A attempts to create transaction using User B's account -> 400 Bad Request
        payload = {
            'account': self.acc_b.id,
            'transaction_type': 'EXPENSE',
            'amount': '500.00',
            'date': '2026-08-20'
        }
        res_fraud = self.client_a.post(self.txn_url, payload, format='json')
        assert res_fraud.status_code == status.HTTP_400_BAD_REQUEST

        # User B creates a transaction
        txn_b = Transaction.objects.create(
            user=self.user_b, account=self.acc_b,
            transaction_type='EXPENSE', amount=300.00, date='2026-08-20'
        )

        # User A tries to view User B's transaction -> 404 Not Found
        res_view = self.client_a.get(f"{self.txn_url}{txn_b.id}/")
        assert res_view.status_code == status.HTTP_404_NOT_FOUND

        # User A list does not include User B's transaction
        res_list = self.client_a.get(self.txn_url)
        results = res_list.data.get('results', res_list.data)
        for t in results:
            assert t['id'] != txn_b.id
