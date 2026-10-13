from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import FinancialGoal
from .serializers import FinancialGoalSerializer, GoalContributeSerializer


class FinancialGoalViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = FinancialGoal.objects.filter(user=user).select_related('category')

        completed = self.request.query_params.get('completed')
        if completed is not None:
            is_comp = completed.lower() in ('true', '1')
            queryset = queryset.filter(is_completed=is_comp)

        return queryset.order_by('is_completed', 'target_date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        goal = self.get_object()
        serializer = GoalContributeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data['amount']

        goal.current_amount += amount
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
        goal.save()

        return Response(FinancialGoalSerializer(goal).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        goals = self.get_queryset()
        total_target = sum(float(g.target_amount) for g in goals)
        total_saved = sum(float(g.current_amount) for g in goals)
        completed_count = goals.filter(is_completed=True).count()
        overall_progress = (total_saved / total_target * 100.0) if total_target > 0 else 0.0

        return Response({
            'total_goals': goals.count(),
            'completed_goals': completed_count,
            'total_target_amount': total_target,
            'total_saved_amount': total_saved,
            'overall_progress_percentage': round(overall_progress, 1),
        }, status=status.HTTP_200_OK)
