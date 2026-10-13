import pytest
from datetime import date
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.budgets.models import Budget
from apps.budgets.services import calculate_budget_metrics
from apps.goals.models import FinancialGoal

User = get_user_model()


@pytest.mark.django_db
class TestBudgetsAndGoals:
    def setup_method(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.user_a = User.objects.create_user(email='usera@example.com', password='Password123!')
        self.user_b = User.objects.create_user(email='userb@example.com', password='Password123!')

        self.client_a.force_authenticate(user=self.user_a)
        self.client_b.force_authenticate(user=self.user_b)

        self.acc_a = Account.objects.create(user=self.user_a, name='HDFC Bank', balance=100000.00)
        self.cat_food = Category.objects.create(name='Food & Dining', category_type='EXPENSE', is_default=True)
        self.cat_shopping = Category.objects.create(name='Shopping', category_type='EXPENSE', is_default=True)

        self.month = date(2026, 8, 1)

    def test_budget_boundary_conditions(self):
        """
        Test the boundary conditions:
        - 0% utilization: SAFE (green)
        - exactly 70%: WARNING (amber)
        - exactly 90%: WARNING (amber)
        - 95%: DANGER (red)
        - over 100%: EXCEEDED (red)
        """
        budget = Budget.objects.create(
            user=self.user_a,
            category=self.cat_food,
            amount=10000.00,
            month=self.month
        )

        # 1. 0% utilization
        m0 = calculate_budget_metrics(budget)
        assert m0['spent'] == 0.00
        assert m0['utilization_percentage'] == 0.0
        assert m0['status'] == 'SAFE'
        assert m0['color_state'] == 'green'

        # 2. Exactly 70% utilization (spend 7,000)
        txn70 = Transaction.objects.create(
            user=self.user_a, account=self.acc_a, category=self.cat_food,
            transaction_type='EXPENSE', amount=7000.00, date='2026-08-10'
        )
        m70 = calculate_budget_metrics(budget)
        assert m70['spent'] == 7000.00
        assert m70['utilization_percentage'] == 70.0
        assert m70['status'] == 'WARNING'
        assert m70['color_state'] == 'amber'

        # 3. Exactly 90% utilization (add 2,000 -> total 9,000)
        txn20 = Transaction.objects.create(
            user=self.user_a, account=self.acc_a, category=self.cat_food,
            transaction_type='EXPENSE', amount=2000.00, date='2026-08-15'
        )
        m90 = calculate_budget_metrics(budget)
        assert m90['spent'] == 9000.00
        assert m90['utilization_percentage'] == 90.0
        assert m90['status'] == 'WARNING'
        assert m90['color_state'] == 'amber'

        # 4. 95% utilization (add 500 -> total 9,500)
        txn05 = Transaction.objects.create(
            user=self.user_a, account=self.acc_a, category=self.cat_food,
            transaction_type='EXPENSE', amount=500.00, date='2026-08-18'
        )
        m95 = calculate_budget_metrics(budget)
        assert m95['spent'] == 9500.00
        assert m95['utilization_percentage'] == 95.0
        assert m95['status'] == 'DANGER'
        assert m95['color_state'] == 'red'

        # 5. Over 100% utilization (add 1,500 -> total 11,000 / 10,000 = 110%)
        txn15 = Transaction.objects.create(
            user=self.user_a, account=self.acc_a, category=self.cat_food,
            transaction_type='EXPENSE', amount=1500.00, date='2026-08-20'
        )
        m110 = calculate_budget_metrics(budget)
        assert m110['spent'] == 11000.00
        assert m110['utilization_percentage'] == 110.0
        assert m110['status'] == 'EXCEEDED'
        assert m110['color_state'] == 'red'
        assert m110['remaining'] == -1000.00

    def test_budget_api_crud_and_isolation(self):
        # Create budget via API
        payload = {
            'category': self.cat_shopping.id,
            'amount': '15000.00',
            'month': '2026-08-01'
        }
        res = self.client_a.post('/api/budgets/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        budget_id = res.data['id']

        # User B cannot view User A's budget
        res_b = self.client_b.get(f'/api/budgets/{budget_id}/')
        assert res_b.status_code == status.HTTP_404_NOT_FOUND

    def test_financial_goals_crud_and_contribute(self):
        # 1. Create a Goal
        payload = {
            'name': 'Emergency Fund',
            'target_amount': '50000.00',
            'current_amount': '10000.00',
            'target_date': '2026-12-31',
            'color': '#10B981'
        }
        res = self.client_a.post('/api/goals/', payload, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        goal_id = res.data['id']
        assert res.data['progress_percentage'] == 20.0
        assert res.data['remaining_amount'] == 40000.00
        assert res.data['is_completed'] is False

        # 2. Contribute towards goal
        contrib_res = self.client_a.post(f'/api/goals/{goal_id}/contribute/', {'amount': '40000.00'}, format='json')
        assert contrib_res.status_code == status.HTTP_200_OK
        assert float(contrib_res.data['current_amount']) == 50000.00
        assert contrib_res.data['progress_percentage'] == 100.0
        assert contrib_res.data['is_completed'] is True

        # 3. User B cannot see User A's goal
        res_b = self.client_b.get(f'/api/goals/{goal_id}/')
        assert res_b.status_code == status.HTTP_404_NOT_FOUND
