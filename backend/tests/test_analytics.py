import pytest
from datetime import date
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction

User = get_user_model()


@pytest.mark.django_db
class TestAnalyticsEngine:
    def setup_method(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='usera@example.com', password='Password123!')
        self.user_b = User.objects.create_user(email='userb@example.com', password='Password123!')

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        # User A Accounts
        self.acc_a1 = Account.objects.create(user=self.user_a, name='HDFC Bank', balance=50000.00, account_type='BANK')
        self.acc_a2 = Account.objects.create(user=self.user_a, name='Cash Wallet', balance=5000.00, account_type='CASH')

        # User B Accounts
        self.acc_b = Account.objects.create(user=self.user_b, name='User B Swiss Bank', balance=1000000.00, account_type='BANK')

        # Categories
        self.cat_food = Category.objects.create(name='Food & Dining', category_type='EXPENSE', is_default=True, color='#F97316')
        self.cat_rent = Category.objects.create(name='Rent', category_type='EXPENSE', is_default=True, color='#6366F1')
        self.cat_salary = Category.objects.create(name='Salary', category_type='INCOME', is_default=True, color='#10B981')

        # User A Transactions this month
        today = timezone.now().date()
        this_month_str = today.strftime('%Y-%m-10')

        Transaction.objects.create(
            user=self.user_a, account=self.acc_a1, category=self.cat_salary,
            transaction_type='INCOME', amount=80000.00, date=this_month_str
        )
        Transaction.objects.create(
            user=self.user_a, account=self.acc_a1, category=self.cat_food,
            transaction_type='EXPENSE', amount=10000.00, date=this_month_str
        )
        Transaction.objects.create(
            user=self.user_a, account=self.acc_a1, category=self.cat_rent,
            transaction_type='EXPENSE', amount=30000.00, date=this_month_str
        )

        # User B Transactions
        Transaction.objects.create(
            user=self.user_b, account=self.acc_b, category=self.cat_salary,
            transaction_type='INCOME', amount=500000.00, date=this_month_str
        )

    def test_dashboard_overview_metrics(self):
        res = self.client_a.get('/api/analytics/overview/')
        assert res.status_code == status.HTTP_200_OK
        data = res.data

        # 1. Net worth = 50,000 + 5,000 = 55,000
        assert data['net_worth'] == 55000.00

        # 2. Current Month: Income = 80,000, Expense = 40,000, Savings = 40,000, Savings Rate = 50.0%
        cur = data['current_month']
        assert cur['income'] == 80000.00
        assert cur['expense'] == 40000.00
        assert cur['savings'] == 40000.00
        assert cur['savings_rate'] == 50.0

        # 3. Expense categories breakdown
        exp_cats = data['expense_categories']
        assert len(exp_cats) == 2
        rent_cat = next(c for c in exp_cats if c['name'] == 'Rent')
        food_cat = next(c for c in exp_cats if c['name'] == 'Food & Dining')
        assert rent_cat['total'] == 30000.00
        assert rent_cat['percentage'] == 75.0
        assert food_cat['total'] == 10000.00
        assert food_cat['percentage'] == 25.0

        # 4. User B data must NOT be present
        assert data['net_worth'] != 1055000.00
        assert cur['income'] != 580000.00

    def test_monthly_trends_api(self):
        res = self.client_a.get('/api/analytics/monthly-trends/?months=6')
        assert res.status_code == status.HTTP_200_OK
        trends = res.data['trends']
        assert len(trends) == 6

        # Latest month in trends should match current month numbers
        latest = trends[-1]
        assert latest['income'] == 80000.00
        assert latest['expense'] == 40000.00
        assert latest['savings'] == 40000.00
        assert latest['savings_rate'] == 50.0

    def test_category_breakdown_api(self):
        res = self.client_a.get('/api/analytics/category-breakdown/?type=EXPENSE')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['total'] == 40000.00
        assert len(res.data['breakdown']) == 2
