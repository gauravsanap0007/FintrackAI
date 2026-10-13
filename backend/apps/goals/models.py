from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class FinancialGoal(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='financial_goals'
    )
    name = models.CharField(max_length=150)
    target_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    current_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    target_date = models.DateField(null=True, blank=True)
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='goals'
    )
    color = models.CharField(max_length=20, default='#10B981')
    icon = models.CharField(max_length=50, default='target')
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['is_completed', 'target_date', '-created_at']

    def __str__(self):
        return f"{self.name} ({self.current_amount}/{self.target_amount}) - {self.user.email}"
