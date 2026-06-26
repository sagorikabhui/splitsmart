import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
import base64
import json
import re

# Configure Gemini AI
import os
from dotenv import load_dotenv
load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

class ScanReceiptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if image is provided
        if 'receipt' not in request.FILES:
            return Response(
                {'error': 'No receipt image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        receipt_file = request.FILES['receipt']

        try:
            # Read image and convert to base64
            image_data = receipt_file.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            # Get file type
            content_type = receipt_file.content_type or 'image/jpeg'

            # Initialize Gemini model
            model = genai.GenerativeModel('gemini-2.5-flash')

            # Create prompt for receipt scanning
            prompt = """
            You are a receipt scanner AI. Analyze this receipt image and extract the following information.
            Return ONLY a valid JSON object with no extra text, no markdown, no code blocks.

            Extract:
            {
                "title": "Short title of the expense (e.g. Dinner at McDonald's)",
                "amount": 0.00,
                "category": "one of: food, transport, accommodation, entertainment, shopping, utilities, medical, other",
                "items": ["item1 - price", "item2 - price"],
                "shop_name": "Name of the shop/restaurant",
                "date": "YYYY-MM-DD format if found, else empty string"
            }

            Rules:
            - amount should be the FINAL TOTAL amount including all taxes and charges
            - Look for words like 'Total', 'Grand Total', 'Amount Due', 'Net Amount'
            - NEVER use subtotal, always use the final total
            - amount should be a number only, no currency symbols
            - category should be lowercase
            - if you cannot read the receipt clearly, make your best guess
            - return ONLY the JSON, nothing else
            """

            # Send image to Gemini
            response = model.generate_content([
                prompt,
                {
                    "mime_type": content_type,
                    "data": image_base64
                }
            ])

            # Parse response
            response_text = response.text.strip()

            # Clean response if needed
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*', '', response_text)
            response_text = response_text.strip()

            # Parse JSON
            extracted_data = json.loads(response_text)

            return Response({
                'success': True,
                'data': extracted_data
            }, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({
                'success': False,
                'error': 'Could not parse receipt data. Please try again!'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error scanning receipt: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)