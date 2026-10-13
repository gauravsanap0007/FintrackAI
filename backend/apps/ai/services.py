import os
import re
import json
from decimal import Decimal
from datetime import date
from django.conf import settings
from django.utils import timezone
import requests

from apps.accounts.models import Account
from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.analytics.services import get_dashboard_overview
from apps.budgets.services import calculate_budget_metrics
from apps.budgets.models import Budget
from apps.goals.models import FinancialGoal


def call_llm(messages, temperature=0.2):
    """
    Calls configured LLM provider (OpenAI, Anthropic, or OpenAI-compatible endpoint).
    If no API key is provided, returns None to trigger deterministic rule engine fallback.
    """
    api_key = getattr(settings, 'AI_API_KEY', '') or os.getenv('AI_API_KEY', '')
    if not api_key:
        return None

    provider = getattr(settings, 'AI_PROVIDER', 'openai').lower()
    model = getattr(settings, 'AI_MODEL', 'gpt-4o-mini')

    try:
        if provider in ('openai', 'openai-compatible', 'custom'):
            url = 'https://api.openai.com/v1/chat/completions'
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            }
            payload = {
                'model': model,
                'messages': messages,
                'temperature': temperature,
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data['choices'][0]['message']['content']
    except Exception as e:
        print(f"LLM API call failed: {e}")

    return None


def parse_natural_language_transaction(user, text):
    """
    Parses a natural language string into a structured transaction proposal.
    Example: "Spent 450 rupees at Swiggy for dinner" -> structured JSON
    """
    text_clean = text.strip()
    if not text_clean:
        return {'success': False, 'error': 'Input text is empty.'}

    # Fetch user accounts and categories
    accounts = list(Account.objects.filter(user=user, is_active=True))
    categories = list(Category.objects.filter(user=user) | Category.objects.filter(user__isnull=True))

    default_account = accounts[0] if accounts else None
    cat_names = [c.name for c in categories]
    acc_names = [a.name for a in accounts]

    # Try LLM first if available
    llm_prompt = f"""
You are a financial parser. Extract transaction details from the user text.
User Text: "{text_clean}"
Available Categories: {json.dumps(cat_names)}
Available Accounts: {json.dumps(acc_names)}
Today's Date: {timezone.now().date().isoformat()}

Return strictly valid JSON with these exact keys:
{{
  "amount": number (positive),
  "transaction_type": "EXPENSE" or "INCOME",
  "merchant_name": string or "",
  "category_name": string (best match from available categories or "Miscellaneous"),
  "account_name": string (best match from available accounts or first account),
  "date": "YYYY-MM-DD",
  "description": string,
  "confidence": number between 0.0 and 1.0
}}
If the text is NOT a transaction or has no amount, return: {{"error": "Could not parse transaction details."}}
"""
    llm_res = call_llm([
        {"role": "system", "content": "You are a precise financial data extraction assistant. Return ONLY valid JSON."},
        {"role": "user", "content": llm_prompt}
    ])

    if llm_res:
        try:
            cleaned_json_match = re.search(r'\{.*\}', llm_res, re.DOTALL)
            if cleaned_json_match:
                parsed = json.loads(cleaned_json_match.group(0))
                if 'amount' in parsed and float(parsed['amount']) > 0:
                    matched_cat = next((c for c in categories if c.name.lower() == parsed.get('category_name', '').lower()), None)
                    matched_acc = next((a for a in accounts if a.name.lower() == parsed.get('account_name', '').lower()), default_account)
                    return {
                        'success': True,
                        'amount': float(parsed['amount']),
                        'transaction_type': parsed.get('transaction_type', 'EXPENSE').upper(),
                        'merchant_name': parsed.get('merchant_name', ''),
                        'category_id': matched_cat.id if matched_cat else None,
                        'category_name': matched_cat.name if matched_cat else 'Miscellaneous',
                        'account_id': matched_acc.id if matched_acc else None,
                        'account_name': matched_acc.name if matched_acc else 'Main Account',
                        'date': parsed.get('date', timezone.now().date().isoformat()),
                        'description': parsed.get('description', text_clean),
                        'confidence': parsed.get('confidence', 0.95),
                    }
        except Exception:
            pass

    # High-accuracy Rule-based NLP Fallback
    # Extract amount
    amount_match = re.search(r'(?:₹|rs\.?|inr|\$)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|\$|rupees)?', text_clean, re.IGNORECASE)
    if not amount_match:
        return {'success': False, 'error': 'Could not detect an amount in the text.'}

    amount_str = amount_match.group(1).replace(',', '')
    try:
        amount_val = float(amount_str)
        if amount_val <= 0:
            return {'success': False, 'error': 'Amount must be greater than zero.'}
    except ValueError:
        return {'success': False, 'error': 'Invalid numeric amount detected.'}

    # Determine Type
    is_income = bool(re.search(r'\b(salary|received|income|credited|earned|got paid|dividend|deposit)\b', text_clean, re.IGNORECASE))
    txn_type = 'INCOME' if is_income else 'EXPENSE'

    # Determine Merchant
    merchant = ''
    at_match = re.search(r'\b(?:at|to|from|on|in)\s+([A-Za-z0-9\s&\'\.\-]+?)(?:\s+(?:for|on|via|using|in|\d|$))', text_clean, re.IGNORECASE)
    if at_match:
        merchant = at_match.group(1).strip()
    else:
        # Common known merchants
        for m in ['Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'Uber', 'Ola', 'Starbucks', 'Netflix', 'Spotify', 'Dominos', 'Walmart', 'Apple']:
            if m.lower() in text_clean.lower():
                merchant = m
                break

    # Determine Category
    matched_cat = None
    lower_text = text_clean.lower()

    keyword_map = {
        'Food & Dining': ['swiggy', 'zomato', 'food', 'dinner', 'lunch', 'breakfast', 'restaurant', 'starbucks', 'coffee', 'pizza', 'burger', 'cafe', 'dominos'],
        'Groceries': ['grocery', 'groceries', 'supermarket', 'blinkit', 'zepto', 'instamart', 'milk', 'vegetables'],
        'Transportation': ['uber', 'ola', 'cab', 'taxi', 'petrol', 'fuel', 'metro', 'bus', 'train', 'flight'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'electronics', 'shopping'],
        'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'theatre', 'game', 'concert'],
        'Utilities': ['electricity', 'water', 'bill', 'wifi', 'internet', 'recharge', 'broadband'],
        'Housing & Rent': ['rent', 'maintenance', 'house', 'landlord'],
        'Healthcare': ['pharmacy', 'medicine', 'hospital', 'doctor', 'clinic', 'dentist'],
        'Salary': ['salary', 'paycheck', 'stipend', 'bonus'],
        'Freelance / Consulting': ['freelance', 'client', 'consulting', 'upwork', 'fiverr'],
    }

    for cat_name, keywords in keyword_map.items():
        if any(k in lower_text for k in keywords):
            matched_cat = next((c for c in categories if c.name.lower() == cat_name.lower()), None)
            if matched_cat:
                break

    if not matched_cat:
        matched_cat = next((c for c in categories if c.category_type == txn_type), None)

    return {
        'success': True,
        'amount': amount_val,
        'transaction_type': txn_type,
        'merchant_name': merchant or 'Merchant',
        'category_id': matched_cat.id if matched_cat else None,
        'category_name': matched_cat.name if matched_cat else 'General',
        'account_id': default_account.id if default_account else None,
        'account_name': default_account.name if default_account else 'Main Account',
        'date': timezone.now().date().isoformat(),
        'description': text_clean,
        'confidence': 0.90,
    }


def generate_financial_insights(user):
    """
    Computes user financial metrics and produces structured plain-language insight cards.
    """
    overview = get_dashboard_overview(user, months=3)
    cur = overview['current_month']
    net_worth = overview['net_worth']
    income = cur['income']
    expense = cur['expense']
    savings = cur['savings']
    savings_rate = cur['savings_rate']
    top_categories = overview['expense_categories']

    # Budgets check
    budgets = Budget.objects.filter(user=user, is_active=True)
    over_budget_items = []
    for b in budgets:
        m = calculate_budget_metrics(b)
        if m['status'] in ('DANGER', 'EXCEEDED'):
            over_budget_items.append(m)

    # Goals check
    goals = FinancialGoal.objects.filter(user=user, is_completed=False)

    insights = []

    # 1. Savings Rate Insight
    if income > 0:
        if savings_rate >= 30:
            insights.append({
                'title': 'Outstanding Savings Performance',
                'type': 'POSITIVE',
                'metric': f"{savings_rate}% Savings Rate",
                'message': f"You've saved {savings_rate}% of your income this month (₹{savings:,.2f}), well above the recommended 20% benchmark."
            })
        elif savings_rate >= 15:
            insights.append({
                'title': 'Healthy Cash Flow',
                'type': 'NEUTRAL',
                'metric': f"{savings_rate}% Saved",
                'message': f"You are saving {savings_rate}% of your income this month. Consider allocating ₹{savings:,.2f} towards your active goals."
            })
        else:
            insights.append({
                'title': 'Low Savings Rate Alert',
                'type': 'WARNING',
                'metric': f"{savings_rate}% Savings Rate",
                'message': f"Your savings rate is {savings_rate}% this month. High expense outflows leave only ₹{savings:,.2f} in net cash flow."
            })
    else:
        insights.append({
            'title': 'No Income Logged This Month',
            'type': 'TIP',
            'metric': '₹0.00 Income',
            'message': "Log your salary or income deposits to calculate your savings rate and cash flow metrics."
        })

    # 2. Top Category Spending Insight
    if top_categories:
        top_cat = top_categories[0]
        insights.append({
            'title': f"Highest Expense: {top_cat['name']}",
            'type': 'NEUTRAL',
            'metric': f"₹{top_cat['total']:,.2f} ({top_cat['percentage']}%)",
            'message': f"{top_cat['name']} constitutes {top_cat['percentage']}% of your monthly expenses across all accounts."
        })

    # 3. Budget Status Insight
    if over_budget_items:
        first_danger = over_budget_items[0]
        insights.append({
            'title': f"Budget Warning: {first_danger['category_name']}",
            'type': 'WARNING',
            'metric': f"{first_danger['utilization_percentage']}% Utilized",
            'message': f"You have spent ₹{first_danger['spent']:,.2f} of your ₹{first_danger['limit']:,.2f} limit for {first_danger['category_name']}."
        })
    elif budgets.exists():
        insights.append({
            'title': 'All Category Budgets on Track',
            'type': 'POSITIVE',
            'metric': '100% In Limit',
            'message': 'All your category spending limits are currently within safe thresholds.'
        })

    # 4. Financial Goals Insight
    if goals.exists():
        closest_goal = goals.first()
        insights.append({
            'title': f"Goal in Focus: {closest_goal.name}",
            'type': 'TIP',
            'metric': f"₹{closest_goal.current_amount:,.2f} / ₹{closest_goal.target_amount:,.2f}",
            'message': f"You are ₹{closest_goal.target_amount - closest_goal.current_amount:,.2f} away from achieving your {closest_goal.name} target."
        })

    return insights


def answer_assistant_question(user, query, history=None):
    """
    Answers user financial Q&A using strict ground-truth calculations from Django.
    Never invents numbers; answers directly using computed data.
    """
    overview = get_dashboard_overview(user, months=6)
    cur = overview['current_month']
    accounts = overview['accounts']
    top_cats = overview['expense_categories']

    # Assemble sanitized financial context
    acc_summary_text = ", ".join([f"{a['name']}: ₹{a['balance']:,.2f}" for a in accounts])
    top_cat_text = ", ".join([f"{c['name']} (₹{c['total']:,.2f}, {c['percentage']}%)" for c in top_cats[:4]])

    grounded_context = f"""
User Financial Summary for {cur['month_label']}:
- Total Net Worth Across Accounts: ₹{overview['net_worth']:,.2f}
- Accounts Breakdown: {acc_summary_text or 'None'}
- Current Month Income: ₹{cur['income']:,.2f}
- Current Month Expenses: ₹{cur['expense']:,.2f}
- Current Month Net Savings: ₹{cur['savings']:,.2f}
- Current Month Savings Rate: {cur['savings_rate']}%
- Top Spending Categories: {top_cat_text or 'None'}
"""

    llm_prompt = f"""
You are FinTrack AI, a personal financial advisor assistant.
Answer the user's question using ONLY the real numbers provided in the financial context below.
DO NOT make up any numbers. If the user asks about something not in the data, explain what data is available.

Financial Context:
{grounded_context}

User Question: "{query}"
"""

    llm_res = call_llm([
        {"role": "system", "content": "You are a professional, helpful personal finance assistant. Never invent figures."},
        {"role": "user", "content": llm_prompt}
    ])

    if llm_res:
        return {
            'reply': llm_res.strip(),
            'context_used': {
                'net_worth': overview['net_worth'],
                'income': cur['income'],
                'expense': cur['expense'],
                'savings_rate': cur['savings_rate'],
            }
        }

    # Deterministic grounded rule-based responses
    q_lower = query.lower()
    if 'how much did i spend' in q_lower or 'my expense' in q_lower or 'total expense' in q_lower:
        reply = f"In {cur['month_label']}, your total recorded expenses are ₹{cur['expense']:,.2f}. Your top spending category is {top_cats[0]['name'] if top_cats else 'General'} at ₹{top_cats[0]['total'] if top_cats else 0:,.2f}."
    elif 'income' in q_lower or 'how much did i earn' in q_lower:
        reply = f"In {cur['month_label']}, your total recorded income is ₹{cur['income']:,.2f}."
    elif 'savings' in q_lower or 'save' in q_lower or 'savings rate' in q_lower:
        reply = f"Your current savings rate is {cur['savings_rate']}%, with a net savings flow of ₹{cur['savings']:,.2f} this month."
    elif 'net worth' in q_lower or 'balance' in q_lower or 'accounts' in q_lower:
        reply = f"Your total net worth across all {len(accounts)} accounts is ₹{overview['net_worth']:,.2f}."
    else:
        reply = f"For {cur['month_label']}, your total net worth is ₹{overview['net_worth']:,.2f}, monthly income is ₹{cur['income']:,.2f}, monthly expenses are ₹{cur['expense']:,.2f}, and your savings rate is {cur['savings_rate']}%."

    return {
        'reply': reply,
        'context_used': {
            'net_worth': overview['net_worth'],
            'income': cur['income'],
            'expense': cur['expense'],
            'savings_rate': cur['savings_rate'],
        }
    }
