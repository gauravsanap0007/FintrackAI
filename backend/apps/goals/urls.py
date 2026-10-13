from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialGoalViewSet

app_name = 'goals'

router = DefaultRouter()
router.register(r'', FinancialGoalViewSet, basename='goal')

urlpatterns = [
    path('', include(router.urls)),
]
