from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Sum
from .models import Transaction
from .serializers import TransactionSerializer
from .services import apply_transaction_to_balance, revert_transaction_from_balance


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(user=user).select_related('account', 'category', 'transfer_to_account')

        # Filter by transaction type
        txn_type = self.request.query_params.get('type')
        if txn_type:
            queryset = queryset.filter(transaction_type=txn_type.upper())

        # Filter by account
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(Q(account_id=account_id) | Q(transfer_to_account_id=account_id))

        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        # Search by description, merchant, notes, tags
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(merchant_name__icontains=search) |
                Q(notes__icontains=search) |
                Q(tags__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get('ordering', '-date')
        return queryset.order_by(ordering, '-created_at')

    def perform_create(self, serializer):
        with transaction.atomic():
            txn = serializer.save(user=self.request.user)
            apply_transaction_to_balance(txn)

    def perform_update(self, serializer):
        with transaction.atomic():
            old_txn = Transaction.objects.select_for_update().get(pk=serializer.instance.pk)
            revert_transaction_from_balance(old_txn)
            new_txn = serializer.save()
            apply_transaction_to_balance(new_txn)

    def perform_destroy(self, instance):
        with transaction.atomic():
            revert_transaction_from_balance(instance)
            instance.delete()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Returns aggregated totals for current filters."""
        qs = self.get_queryset()
        income = qs.filter(transaction_type='INCOME').aggregate(total=Sum('amount'))['total'] or 0.00
        expense = qs.filter(transaction_type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0.00
        net = float(income) - float(expense)

        return Response({
            'total_income': float(income),
            'total_expense': float(expense),
            'net_flow': net,
            'count': qs.count(),
        }, status=status.HTTP_200_OK)
