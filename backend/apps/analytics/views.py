from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import (
    get_dashboard_overview,
    get_monthly_trends,
    get_category_breakdown,
)


class DashboardOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            months = int(request.query_params.get('months', 6))
            months = max(1, min(months, 24))
        except ValueError:
            months = 6

        overview = get_dashboard_overview(request.user, months=months)
        return Response(overview, status=status.HTTP_200_OK)


class MonthlyTrendsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            months = int(request.query_params.get('months', 6))
            months = max(1, min(months, 24))
        except ValueError:
            months = 6

        trends = get_monthly_trends(request.user, months_count=months)
        return Response({'trends': trends}, status=status.HTTP_200_OK)


class CategoryBreakdownView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cat_type = request.query_params.get('type', 'EXPENSE').upper()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        breakdown = get_category_breakdown(
            request.user,
            category_type=cat_type,
            start_date=start_date,
            end_date=end_date
        )
        return Response(breakdown, status=status.HTTP_200_OK)
