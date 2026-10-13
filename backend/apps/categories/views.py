from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return both system defaults and user-specific custom categories
        user = self.request.user
        queryset = Category.objects.filter(Q(user=user) | Q(user__isnull=True))

        category_type = self.request.query_params.get('type')
        if category_type:
            queryset = queryset.filter(category_type=category_type.upper())

        return queryset.order_by('is_default', 'name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_default=False)

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.is_default or instance.user is None:
            raise PermissionDenied("Default system categories cannot be modified.")
        if instance.user != self.request.user:
            raise PermissionDenied("You do not have permission to modify this category.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_default or instance.user is None:
            raise PermissionDenied("Default system categories cannot be deleted.")
        if instance.user != self.request.user:
            raise PermissionDenied("You do not have permission to delete this category.")
        instance.delete()
