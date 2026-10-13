from rest_framework import serializers
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from .models import FinancialGoal
from decimal import Decimal


class FinancialGoalSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    progress_percentage = serializers.SerializerMethodField(read_only=True)
    remaining_amount = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FinancialGoal
        fields = [
            'id',
            'name',
            'target_amount',
            'current_amount',
            'target_date',
            'category',
            'category_details',
            'color',
            'icon',
            'is_completed',
            'notes',
            'progress_percentage',
            'remaining_amount',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_progress_percentage(self, obj):
        target = float(obj.target_amount)
        current = float(obj.current_amount)
        if target <= 0:
            return 0.0
        pct = (current / target) * 100.0
        return round(pct, 1)

    def get_remaining_amount(self, obj):
        target = float(obj.target_amount)
        current = float(obj.current_amount)
        return max(0.0, target - current)

    def validate_target_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Target amount must be greater than zero.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        category = attrs.get('category')
        if category and category.user is not None and category.user != user:
            raise serializers.ValidationError({"category": "You do not own this category."})
        return attrs


class GoalContributeSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal('0.01'))
