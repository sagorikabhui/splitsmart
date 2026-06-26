from django.db import models
from django.conf import settings
from groups.models import Group

class Expense(models.Model):
    SPLIT_TYPES = [
        ('equal', 'Equal'),
        ('exact', 'Exact Amount'),
        ('percentage', 'Percentage'),
    ]

    CATEGORIES = [
        ('food', 'Food & Drinks'),
        ('transport', 'Transport'),
        ('accommodation', 'Accommodation'),
        ('entertainment', 'Entertainment'),
        ('shopping', 'Shopping'),
        ('utilities', 'Utilities'),
        ('medical', 'Medical'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='other')
    split_type = models.CharField(max_length=15, choices=SPLIT_TYPES, default='equal')
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='paid_expenses')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_settled = models.BooleanField(default=False)
    date = models.DateField()

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title} - ₹{self.amount}"


class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_splits')
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_settled = models.BooleanField(default=False)
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'expense_splits'

    def __str__(self):
        return f"{self.user} owes ₹{self.amount_owed} for {self.expense.title}"


class Settlement(models.Model):
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settlements_paid')
    paid_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settlements_received')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='settlements', null=True, blank=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    upi_transaction_id = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = 'settlements'

    def __str__(self):
        return f"{self.paid_by} paid ₹{self.amount} to {self.paid_to}"