from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum
from apps.transactions.models import Transaction


def get_budget_month_range(month_date):
    """Given a date (e.g. 2026-08-01), returns start and end of that month."""
    start_date = date(month_date.year, month_date.month, 1)
    if month_date.month == 12:
        end_date = date(month_date.year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(month_date.year, month_date.month + 1, 1) - timedelta(days=1)
    return start_date, end_date


def calculate_budget_metrics(budget):
    """
    Computes spent amount, remaining amount, utilization percentage, and status state:
    - SAFE (Green): < 70%
    - WARNING (Amber): 70% to 90%
    - DANGER (Red): > 90% up to 100%
    - EXCEEDED (Red): > 100%
    """
    start_date, end_date = get_budget_month_range(budget.month)
    spent = Transaction.objects.filter(
        user=budget.user,
        category=budget.category,
        transaction_type='EXPENSE',
        date__gte=start_date,
        date__lte=end_date
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    spent_float = float(spent)
    limit_float = float(budget.amount)
    remaining_float = limit_float - spent_float

    utilization_pct = (spent_float / limit_float * 100.0) if limit_float > 0 else 0.0

    if utilization_pct > 100.0:
        status_state = 'EXCEEDED'
        color_state = 'red'
    elif utilization_pct > 90.0:
        status_state = 'DANGER'
        color_state = 'red'
    elif utilization_pct >= 70.0:
        status_state = 'WARNING'
        color_state = 'amber'
    else:
        status_state = 'SAFE'
        color_state = 'green'

    return {
        'budget_id': budget.id,
        'category_id': budget.category_id,
        'category_name': budget.category.name,
        'category_color': budget.category.color,
        'category_icon': budget.category.icon,
        'month': budget.month.strftime('%Y-%m-01'),
        'limit': limit_float,
        'spent': spent_float,
        'remaining': remaining_float,
        'utilization_percentage': round(utilization_pct, 1),
        'status': status_state,
        'color_state': color_state,
    }
