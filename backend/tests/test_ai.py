import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction

User = get_user_model()


@pytest.mark.django_db
class TestAIFeatures:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='aiperson@example.com', password='Password123!')
        self.client.force_authenticate(user=self.user)

        self.account = Account.objects.create(user=self.user, name='HDFC Bank', balance=60000.00)
        self.cat_food = Category.objects.create(name='Food & Dining', category_type='EXPENSE', is_default=True)
        self.cat_salary = Category.objects.create(name='Salary', category_type='INCOME', is_default=True)

        today_str = timezone.now().date().isoformat()
        Transaction.objects.create(
            user=self.user, account=self.account, category=self.cat_salary,
            transaction_type='INCOME', amount=75000.00, date=today_str
        )
        Transaction.objects.create(
            user=self.user, account=self.account, category=self.cat_food,
            transaction_type='EXPENSE', amount=15000.00, date=today_str
        )

    def test_parse_valid_expense_text(self):
        payload = {'text': 'Spent ₹450 at Swiggy for lunch with team'}
        res = self.client.post('/api/ai/parse-transaction/', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        data = res.data
        assert data['success'] is True
        assert data['amount'] == 450.00
        assert data['transaction_type'] == 'EXPENSE'
        assert data['category_name'] == 'Food & Dining'

    def test_parse_valid_income_text(self):
        payload = {'text': 'Received freelance payment of ₹25000 from client'}
        res = self.client.post('/api/ai/parse-transaction/', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        data = res.data
        assert data['success'] is True
        assert data['amount'] == 25000.00
        assert data['transaction_type'] == 'INCOME'

    def test_parse_failure_path_triggers_graceful_fallback(self):
        """AI must fail safely when input contains no extractable financial details."""
        payload = {'text': 'Just had a random thought about the weather today.'}
        res = self.client.post('/api/ai/parse-transaction/', payload, format='json')
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert res.data['success'] is False
        assert 'error' in res.data

    def test_financial_insights_grounded(self):
        res = self.client.get('/api/ai/insights/')
        assert res.status_code == status.HTTP_200_OK
        insights = res.data['insights']
        assert len(insights) >= 2
        types = [i['type'] for i in insights]
        assert 'POSITIVE' in types or 'NEUTRAL' in types

    def test_assistant_chat_answers_grounded_question(self):
        payload = {'query': 'How much did I spend this month?'}
        res = self.client.post('/api/ai/chat/', payload, format='json')
        assert res.status_code == status.HTTP_200_OK
        reply = res.data['reply']
        assert '15,000' in reply or '15000' in reply
        assert res.data['context_used']['expense'] == 15000.00
