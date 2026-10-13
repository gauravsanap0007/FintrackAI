from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Q
from django.utils import timezone
from apps.transactions.models import Transaction
from apps.accounts.models import Account
from apps.categories.models import Category


def get_month_range(year, month):
    """Returns the start and end dates for a given year and month."""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    return start_date, end_date


def get_monthly_trends(user, months_count=6):
    """
    Computes monthly income, expense, net savings, and savings rate for the last N months.
    """
    today = timezone.now().date()
    trends = []

    for i in range(months_count - 1, -1, -1):
        # Calculate year and month for offset i
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1

        start_date, end_date = get_month_range(year, month)
        month_label = start_date.strftime('%b %Y')
        month_key = start_date.strftime('%Y-%m')

        txns = Transaction.objects.filter(user=user, date__gte=start_date, date__lte=end_date)
        inc = txns.filter(transaction_type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        exp = txns.filter(transaction_type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        inc_float = float(inc)
        exp_float = float(exp)
        savings = inc_float - exp_float
        savings_rate = (savings / inc_float * 100.0) if inc_float > 0 else 0.0

        trends.append({
            'month': month_key,
            'label': month_label,
            'income': inc_float,
            'expense': exp_float,
            'savings': savings,
            'savings_rate': round(savings_rate, 1),
        })

    return trends


def get_category_breakdown(user, category_type='EXPENSE', start_date=None, end_date=None):
    """
    Computes spending or income breakdown grouped by category with percentages.
    """
    txns = Transaction.objects.filter(user=user, transaction_type=category_type)
    if start_date:
        txns = txns.filter(date__gte=start_date)
    if end_date:
        txns = txns.filter(date__lte=end_date)

    total_amount = txns.aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    total_float = float(total_amount)

    category_data = (
        txns.values('category__id', 'category__name', 'category__color', 'category__icon')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    results = []
    for item in category_data:
        cat_amount = float(item['total'])
        percentage = (cat_amount / total_float * 100.0) if total_float > 0 else 0.0
        results.append({
            'category_id': item['category__id'],
            'name': item['category__name'] or 'Uncategorized',
            'color': item['category__color'] or '#94A3B8',
            'icon': item['category__icon'] or 'tag',
            'total': cat_amount,
            'percentage': round(percentage, 1),
        })

    return {
        'total': total_float,
        'breakdown': results
    }


def get_dashboard_overview(user, months=6):
    """
    Computes complete real dashboard summary metrics, trends, category distributions, and account balances.
    """
    today = timezone.now().date()
    cur_start, cur_end = get_month_range(today.year, today.month)

    # 1. Accounts Total
    accounts = Account.objects.filter(user=user, is_active=True)
    total_balance = float(accounts.aggregate(t=Sum('balance'))['t'] or 0.00)

    accounts_breakdown = []
    for acc in accounts:
        bal = float(acc.balance)
        pct = (bal / total_balance * 100.0) if total_balance > 0 else 0.0
        accounts_breakdown.append({
            'id': acc.id,
            'name': acc.name,
            'account_type': acc.account_type,
            'account_type_display': acc.get_account_type_display(),
            'balance': bal,
            'color': acc.color,
            'percentage': round(pct, 1),
        })

    # 2. Current Month Income & Expense
    cur_month_txns = Transaction.objects.filter(user=user, date__gte=cur_start, date__lte=cur_end)
    cur_income = float(cur_month_txns.filter(transaction_type='INCOME').aggregate(t=Sum('amount'))['t'] or 0.00)
    cur_expense = float(cur_month_txns.filter(transaction_type='EXPENSE').aggregate(t=Sum('amount'))['t'] or 0.00)
    cur_savings = cur_income - cur_expense
    cur_savings_rate = (cur_savings / cur_income * 100.0) if cur_income > 0 else 0.0

    # 3. Monthly Trends
    trends = get_monthly_trends(user, months_count=months)

    # 4. Category Breakdowns (Current Month & All-time)
    expense_breakdown = get_category_breakdown(user, 'EXPENSE', start_date=cur_start, end_date=cur_end)
    income_breakdown = get_category_breakdown(user, 'INCOME', start_date=cur_start, end_date=cur_end)

    # 5. Profile Targets
    profile = getattr(user, 'profile', None)
    monthly_budget_target = float(profile.monthly_budget_target) if profile else 0.00
    monthly_income_target = float(profile.monthly_income_target) if profile else 0.00
    savings_target_pct = float(profile.savings_target_percentage) if profile else 20.00

    return {
        'net_worth': total_balance,
        'current_month': {
            'month_label': cur_start.strftime('%B %Y'),
            'income': cur_income,
            'expense': cur_expense,
            'savings': cur_savings,
            'savings_rate': round(cur_savings_rate, 1),
            'monthly_budget_target': monthly_budget_target,
            'monthly_income_target': monthly_income_target,
            'savings_target_percentage': savings_target_pct,
        },
        'trends': trends,
        'expense_categories': expense_breakdown['breakdown'],
        'income_categories': income_breakdown['breakdown'],
        'accounts': accounts_breakdown,
    }
