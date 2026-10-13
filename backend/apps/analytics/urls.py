from django.urls import path
from .views import DashboardOverviewView, MonthlyTrendsView, CategoryBreakdownView

app_name = 'analytics'

urlpatterns = [
    path('overview/', DashboardOverviewView.as_view(), name='dashboard_overview'),
    path('monthly-trends/', MonthlyTrendsView.as_view(), name='monthly_trends'),
    path('category-breakdown/', CategoryBreakdownView.as_view(), name='category_breakdown'),
]
