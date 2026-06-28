import os
import json
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '')
        context_data = request.data.get('context', {})

        if not message:
            return Response(
                {'error': 'Message is required!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Build prompt with user's financial data
            prompt = f"""
You are SplitSmart AI assistant. Never use markdown formatting like **bold** or *italic*.  You help users understand their expense data.
Be friendly, concise and use Indian Rupee (₹) for amounts.
Use emojis to make responses more engaging.
Keep responses under 100 words.

User's financial data:
- Name: {context_data.get('name', 'User')}
- Total Expenses: ₹{context_data.get('total_expenses', 0)}
- Number of Expenses: {context_data.get('expense_count', 0)}
- Total Groups: {context_data.get('group_count', 0)}
- You are owed: ₹{context_data.get('total_owed', 0)}
- You owe: ₹{context_data.get('total_owe', 0)}
- Top spending category: {context_data.get('top_category', 'None')}
- Category breakdown: {json.dumps(context_data.get('categories', {}))}
- Recent expenses: {json.dumps(context_data.get('recent_expenses', []))}
- Balances: {json.dumps(context_data.get('balances', []))}
- Groups: {json.dumps(context_data.get('groups', []))}

User question: {message}

Answer the user's question based on this data. Keep response under 100 words.
            """

            # Call Gemini AI
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)

            return Response({
                'reply': response.text
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_ERROR)