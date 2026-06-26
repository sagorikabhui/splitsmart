from django.urls import path
from .views import ExpenseListCreateView, ExpenseDetailView, BalanceView, SettlementView, SimplifyDebtsView, UPIPaymentView

urlpatterns = [
    path('', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('balances/', BalanceView.as_view(), name='balances'),
    path('settle/', SettlementView.as_view(), name='settle'),
    path('simplify/', SimplifyDebtsView.as_view(), name='simplify-debts'),
    path('upi-payment/', UPIPaymentView.as_view(), name='upi-payment'),
]