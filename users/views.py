import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .serializers import RegisterSerializer, UserSerializer
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            # Find user by email first
            user_obj = User.objects.get(email=email)
            # Then authenticate
            user = authenticate(request, username=user_obj.username, password=password)
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid email or password!'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or password!'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Please provide current and new password!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        request.user.set_password(new_password)
        request.user.save()

        # Update token
        request.user.auth_token.delete()
        token = Token.objects.create(user=request.user)

        return Response({
            'message': 'Password changed successfully!',
            'token': token.key
        }, status=status.HTTP_200_OK)
        
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Please provide an email address!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Create reset link
            reset_link = f"http://127.0.0.1:8000/static/reset-password.html?uid={uid}&token={token}"

            # Send email
            send_mail(
                subject='SplitSmart — Reset Your Password',
                message=f'''
Hi {user.first_name},

You requested to reset your password for SplitSmart.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you did not request this, please ignore this email.

Best regards,
SplitSmart Team
                ''',
                from_email=os.getenv('EMAIL_HOST_USER'),
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({
                'message': 'Password reset link sent to your email!'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email!'},
                status=status.HTTP_404_NOT_FOUND
            )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uid or not token or not new_password:
            return Response(
                {'error': 'Invalid request!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode uid
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)

            # Verify token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Invalid or expired reset link!'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(new_password)
            user.save()

            return Response({
                'message': 'Password reset successfully! You can now login!'
            }, status=status.HTTP_200_OK)

        except (User.DoesNotExist, ValueError):
            return Response(
                {'error': 'Invalid reset link!'},
                status=status.HTTP_400_BAD_REQUEST
            )