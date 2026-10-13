from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)

    class Meta:
        model = Account
        fields = [
            'id',
            'name',
            'account_type',
            'account_type_display',
            'balance',
            'currency',
            'account_number_last4',
            'institution_name',
            'color',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        user = self.context['request'].user
        # Exclude current instance on update
        instance = getattr(self, 'instance', None)
        qs = Account.objects.filter(user=user, name__iexact=value.strip())
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this name already exists.")
        return value.strip()
