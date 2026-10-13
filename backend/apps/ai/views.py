from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import (
    parse_natural_language_transaction,
    generate_financial_insights,
    answer_assistant_question,
)


class ParseTransactionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response(
                {'success': False, 'error': 'Text prompt is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = parse_natural_language_transaction(request.user, text)
        return Response(result, status=status.HTTP_200_OK if result.get('success') else status.HTTP_422_UNPROCESSABLE_ENTITY)


class FinancialInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        insights = generate_financial_insights(request.user)
        return Response({'insights': insights}, status=status.HTTP_200_OK)


class AssistantChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '')
        history = request.data.get('history', [])
        if not query:
            return Response(
                {'error': 'Question query is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = answer_assistant_question(request.user, query, history)
        return Response(response, status=status.HTTP_200_OK)
