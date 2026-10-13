from django.urls import path
from .views import ParseTransactionView, FinancialInsightsView, AssistantChatView

app_name = 'ai'

urlpatterns = [
    path('parse-transaction/', ParseTransactionView.as_view(), name='parse_transaction'),
    path('insights/', FinancialInsightsView.as_view(), name='insights'),
    path('chat/', AssistantChatView.as_view(), name='chat'),
]
