"""
URL configuration for fintrack_core project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "app": "FinTrack AI API",
        "version": "1.0.0"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/', include('apps.users.urls', namespace='users')),
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/categories/', include('apps.categories.urls', namespace='categories')),
    path('api/transactions/', include('apps.transactions.urls', namespace='transactions')),
    path('api/budgets/', include('apps.budgets.urls', namespace='budgets')),
    path('api/goals/', include('apps.goals.urls', namespace='goals')),
    path('api/analytics/', include('apps.analytics.urls', namespace='analytics')),
    path('api/ai/', include('apps.ai.urls', namespace='ai')),
]
