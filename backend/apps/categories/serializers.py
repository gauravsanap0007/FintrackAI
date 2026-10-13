from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    is_custom = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'category_type',
            'icon',
            'color',
            'is_default',
            'is_custom',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_default', 'created_at', 'updated_at']

    def get_is_custom(self, obj):
        return obj.user is not None

    def validate_name(self, value):
        user = self.context['request'].user
        category_type = self.initial_data.get('category_type') or getattr(self.instance, 'category_type', 'EXPENSE')
        instance = getattr(self, 'instance', None)

        # Check against both system defaults and user's custom categories
        qs = Category.objects.filter(
            name__iexact=value.strip(),
            category_type=category_type
        ).filter(models_q(user=user) | models_q(user__isnull=True))

        if instance:
            qs = qs.exclude(pk=instance.pk)

        if qs.exists():
            raise serializers.ValidationError(f"A category named '{value}' already exists for {category_type.lower()}s.")

        return value.strip()


def models_q(**kwargs):
    from django.db.models import Q
    return Q(**kwargs)
