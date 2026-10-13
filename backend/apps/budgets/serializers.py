from rest_framework import serializers
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from .models import Budget
from .services import calculate_budget_metrics
from decimal import Decimal


class BudgetSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    metrics = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id',
            'category',
            'category_details',
            'amount',
            'month',
            'is_active',
            'metrics',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_metrics(self, obj):
        return calculate_budget_metrics(obj)

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Budget amount must be greater than zero.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        category = attrs.get('category') or getattr(self.instance, 'category', None)
        month = attrs.get('month') or getattr(self.instance, 'month', None)

        if category and category.user is not None and category.user != user:
            raise serializers.ValidationError({"category": "You do not own this category."})

        # Ensure month is normalized to 1st of the month
        if month:
            attrs['month'] = month.replace(day=1)

        # Check unique together on create/update
        instance = getattr(self, 'instance', None)
        qs = Budget.objects.filter(user=user, category=category, month=attrs.get('month', month))
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A budget for this category and month already exists.")

        return attrs
