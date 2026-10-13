from django.db import models
from django.conf import settings


class Account(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('BANK', 'Bank Account'),
        ('CASH', 'Cash'),
        ('CREDIT_CARD', 'Credit Card'),
        ('INVESTMENT', 'Investment'),
        ('SAVINGS', 'Savings'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='accounts'
    )
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='BANK')
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='INR')
    account_number_last4 = models.CharField(max_length=4, blank=True, default='')
    institution_name = models.CharField(max_length=100, blank=True, default='')
    color = models.CharField(max_length=20, default='#3B82F6')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()}) - {self.user.email}"
