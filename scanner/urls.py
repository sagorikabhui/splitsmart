from django.urls import path
from .views import ScanReceiptView

urlpatterns = [
    path('scan/', ScanReceiptView.as_view(), name='scan-receipt'),
]