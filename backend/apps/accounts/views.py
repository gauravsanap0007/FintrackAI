from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strict user data isolation
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        accounts = self.get_queryset().filter(is_active=True)
        total_balance = accounts.aggregate(total=Sum('balance'))['total'] or 0.00
        by_type = {}
        for acc in accounts:
            by_type[acc.account_type] = by_type.get(acc.account_type, 0) + float(acc.balance)

        return Response({
            'total_balance': float(total_balance),
            'account_count': accounts.count(),
            'by_type': by_type
        }, status=status.HTTP_200_OK)
