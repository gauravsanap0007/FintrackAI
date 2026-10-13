from .models import Category

DEFAULT_CATEGORIES = [
    # Expenses
    {"name": "Food & Dining", "category_type": "EXPENSE", "icon": "utensils", "color": "#F97316"},
    {"name": "Groceries", "category_type": "EXPENSE", "icon": "shopping-cart", "color": "#10B981"},
    {"name": "Housing & Rent", "category_type": "EXPENSE", "icon": "home", "color": "#6366F1"},
    {"name": "Utilities", "category_type": "EXPENSE", "icon": "zap", "color": "#EAB308"},
    {"name": "Transportation", "category_type": "EXPENSE", "icon": "car", "color": "#06B6D4"},
    {"name": "Entertainment", "category_type": "EXPENSE", "icon": "film", "color": "#EC4899"},
    {"name": "Shopping", "category_type": "EXPENSE", "icon": "shopping-bag", "color": "#8B5CF6"},
    {"name": "Healthcare", "category_type": "EXPENSE", "icon": "activity", "color": "#EF4444"},
    {"name": "Education", "category_type": "EXPENSE", "icon": "book-open", "color": "#14B8A6"},
    {"name": "Travel", "category_type": "EXPENSE", "icon": "plane", "color": "#3B82F6"},
    {"name": "Investments & Savings", "category_type": "EXPENSE", "icon": "trending-up", "color": "#10B981"},
    {"name": "Miscellaneous", "category_type": "EXPENSE", "icon": "more-horizontal", "color": "#64748B"},

    # Incomes
    {"name": "Salary", "category_type": "INCOME", "icon": "briefcase", "color": "#10B981"},
    {"name": "Freelance / Consulting", "category_type": "INCOME", "icon": "laptop", "color": "#3B82F6"},
    {"name": "Investments Return", "category_type": "INCOME", "icon": "dollar-sign", "color": "#8B5CF6"},
    {"name": "Business Income", "category_type": "INCOME", "icon": "building", "color": "#F59E0B"},
    {"name": "Gifts & Grants", "category_type": "INCOME", "icon": "gift", "color": "#EC4899"},
    {"name": "Other Income", "category_type": "INCOME", "icon": "plus-circle", "color": "#64748B"},
]


def seed_default_categories():
    """Ensure all system-level default categories exist in the database."""
    created_count = 0
    for cat in DEFAULT_CATEGORIES:
        obj, created = Category.objects.get_or_create(
            user=None,
            name=cat["name"],
            category_type=cat["category_type"],
            defaults={
                "icon": cat["icon"],
                "color": cat["color"],
                "is_default": True
            }
        )
        if created:
            created_count += 1
    return created_count
