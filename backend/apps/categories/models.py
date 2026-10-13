from django.db import models
from django.conf import settings


class Category(models.Model):
    CATEGORY_TYPE_CHOICES = [
        ('EXPENSE', 'Expense'),
        ('INCOME', 'Income'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='categories'
    )
    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=10, choices=CATEGORY_TYPE_CHOICES, default='EXPENSE')
    icon = models.CharField(max_length=50, default='tag')
    color = models.CharField(max_length=20, default='#10B981')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        owner = "Default" if self.is_default or not self.user else self.user.email
        return f"{self.name} [{self.category_type}] ({owner})"
