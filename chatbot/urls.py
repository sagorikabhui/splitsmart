from django.urls import path
from .views import ChatbotView

urlpatterns = [
    path('message/', ChatbotView.as_view(), name='chatbot'),
]