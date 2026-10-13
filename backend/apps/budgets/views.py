from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Budget
from .serializers import BudgetSerializer
from .services import calculate_budget_metrics


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Budget.objects.filter(user=user).select_related('category')

        # Filter by month (YYYY-MM or YYYY-MM-DD)
        month_param = self.request.query_params.get('month')
        if month_param:
            if len(month_param) == 7:  # YYYY-MM
                month_param += '-01'
            queryset = queryset.filter(month=month_param)

        return queryset.order_by('category__name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Returns aggregate budget vs actual spending summary for a month."""
        month_param = request.query_params.get('month')
        if not month_param:
            today = timezone.now().date()
            month_param = today.strftime('%Y-%m-01')
        elif len(month_param) == 7:
            month_param += '-01'

        budgets = self.get_queryset().filter(month=month_param, is_active=True)
        total_budget = sum(float(b.amount) for b in budgets)
        total_spent = 0.0

        items = []
        for b in budgets:
            metrics = calculate_budget_metrics(b)
            total_spent += metrics['spent']
            items.append(metrics)

        total_remaining = total_budget - total_spent
        overall_utilization = (total_spent / total_budget * 100.0) if total_budget > 0 else 0.0

        return Response({
            'month': month_param,
            'total_budget': total_budget,
            'total_spent': total_spent,
            'total_remaining': total_remaining,
            'overall_utilization_percentage': round(overall_utilization, 1),
            'budget_count': len(items),
            'items': items,
        }, status=status.HTTP_200_OK)
