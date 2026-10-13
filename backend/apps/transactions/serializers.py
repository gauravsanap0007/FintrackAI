from rest_framework import serializers
from apps.accounts.models import Account
from apps.accounts.serializers import AccountSerializer
from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from .models import Transaction
from decimal import Decimal


class TransactionSerializer(serializers.ModelSerializer):
    account_details = AccountSerializer(source='account', read_only=True)
    category_details = CategorySerializer(source='category', read_only=True)
    transfer_to_account_details = AccountSerializer(source='transfer_to_account', read_only=True)

    account = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        required=True
    )
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True
    )
    transfer_to_account = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = [
            'id',
            'account',
            'account_details',
            'category',
            'category_details',
            'transaction_type',
            'amount',
            'date',
            'description',
            'merchant_name',
            'notes',
            'transfer_to_account',
            'transfer_to_account_details',
            'tags',
            'is_recurring',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("Transaction amount must be greater than zero.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        account = attrs.get('account') or getattr(self.instance, 'account', None)
        transfer_to_account = attrs.get('transfer_to_account') or getattr(self.instance, 'transfer_to_account', None)
        category = attrs.get('category') if 'category' in attrs else getattr(self.instance, 'category', None)
        txn_type = attrs.get('transaction_type') or getattr(self.instance, 'transaction_type', 'EXPENSE')

        # Validate account ownership
        if account and account.user != user:
            raise serializers.ValidationError({"account": "You do not own this account."})

        # Validate category ownership (user's or default)
        if category and category.user is not None and category.user != user:
            raise serializers.ValidationError({"category": "You do not own this category."})

        # Validate transfer rules
        if txn_type == 'TRANSFER':
            if not transfer_to_account:
                raise serializers.ValidationError({"transfer_to_account": "Destination account is required for transfers."})
            if transfer_to_account.user != user:
                raise serializers.ValidationError({"transfer_to_account": "You do not own destination account."})
            if account and transfer_to_account.id == account.id:
                raise serializers.ValidationError({"transfer_to_account": "Cannot transfer to the same account."})

        return attrs
