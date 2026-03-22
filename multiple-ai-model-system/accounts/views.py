from .google_auth import get_or_create_google_user, generate_jwt_for_user
import requests
from .serializers import RegisterSerializer, UserAccountActivationSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .utils import send_the_email
from .models import OTP,CreditAccount
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated, AllowAny
from .tasks import send_otp_email_task
from django.conf import settings
import logging
User= get_user_model()
from random import randint

logger = logging.getLogger(__name__)


def _send_otp_with_fallback(subject, user_email, message, message_type='registration'):
    """Try Celery first, then synchronous email; don't raise to API callers."""
    try:
        send_otp_email_task.delay(
            subject=subject,
            user_email=user_email,
            message=message,
            message_type=message_type,
        )
        return True
    except Exception:
        logger.exception("Failed to queue OTP email task; falling back to sync email")

    try:
        send_the_email(
            subject=subject,
            user_email=user_email,
            message=message,
            message_type=message_type,
        )
        return True
    except Exception:
        logger.exception("Fallback synchronous email also failed")
        return False


class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.save()
            code = randint(100000,999999)
            OTP.objects.create(user=user, code=code, type='registration')
            message = f"Hello {user.username}\n\n Your verification code is: {code} ! It will expire in 10 minutes.\n\nThank you for registering with us!\n\nBest regards,\nMultiAI Platform Team"
            email_sent = _send_otp_with_fallback(
                subject="Welcome to MultiAI Platform 🚀",
                user_email=user.email,
                message=message,
                message_type='registration',
            )
                
#             send_otp_email_task.apply_async(
#     args=(),  # if you have only kwargs, leave empty
#     kwargs={
#         "subject": "Welcome to MultiAI Platform 🚀",
#         "user_email": user.email,
#         "message": message,
#         "message_type": "registration"
#     }
# )
            response_payload = {
                "message": "User registered successfully. Please check your email for the verification code."
            }
            if not email_sent and settings.DEBUG:
                response_payload["message"] = "User registered, but email delivery failed in development. Use the OTP from this response."
                response_payload["otp"] = str(code)

            return Response(response_payload, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivateAccountView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserAccountActivationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.is_active = True
            user.save()
            
            OTP.objects.filter(user=user, type='registration').delete()
            return Response({"message": "Account activated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    """Resend OTP code for account activation"""
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

        # Delete old OTPs and create a new one
        OTP.objects.filter(user=user, type='registration').delete()
        code = randint(100000, 999999)
        OTP.objects.create(user=user, code=code, type='registration')

        message = f"Hello {user.username}\n\nYour new verification code is: {code}. It will expire in 10 minutes.\n\nBest regards,\nMultiAI Platform Team"
        
        email_sent = _send_otp_with_fallback(
            subject="Your New Verification Code 🚀",
            user_email=email,
            message=message,
            message_type='registration',
        )

        response_payload = {"message": "A new verification code has been sent to your email."}
        if not email_sent and settings.DEBUG:
            response_payload["message"] = "OTP regenerated, but email delivery failed in development. Use the OTP from this response."
            response_payload["otp"] = str(code)

        return Response(response_payload, status=status.HTTP_200_OK)
    

from .serializers import LoginSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user=serializer.validated_data['user']
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'user':{
                'id': user.id,
                'user_id': user.id,
                'email': user.email,
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'is_active': user.is_active,
                'subscribed':user.subscribed,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'credits_balance': user.creditaccount.credits if hasattr(user, 'creditaccount') else 0,
                "total_token_used":user.total_token_used
                
                },
                
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LogoutView(APIView):
    # permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "User logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)






#Transection History View

from .models import CreditTransaction
from .serializers import CreditTransactionSerializer
from rest_framework.generics import ListAPIView

class CreditTransactionHistoryView(ListAPIView):
    serializer_class = CreditTransactionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if not user.is_staff:
            return CreditTransaction.objects.select_related('credit_account').filter(credit_account__user=user).order_by('-created_at')
        return CreditTransaction.objects.select_related('credit_account').all().order_by('-created_at')



#views for google authentication 

from .google_auth import get_or_create_google_user, generate_jwt_for_user
import requests

class GoogleLoginAPIView(APIView):
    """
    Receives Google id_token from frontend and returns JWT tokens.
    """
    permission_classes = [AllowAny]
    def post(self, request):
        id_token = request.data.get("id_token")
        if not id_token:
            return Response({"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google
        google_response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
        if google_response.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        google_data = google_response.json()
        email = google_data.get("email")
        if not email:
            return Response({"error": "Email not found in Google token"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user
        user = get_or_create_google_user(google_data)

        # Generate JWT
        tokens = generate_jwt_for_user(user)

        return Response(tokens, status=status.HTTP_200_OK)




#forgot password 

from .serializers import ForgotPasswordSerializer
from django.shortcuts import get_object_or_404

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {"error": "No account found with this email."},
                    status=status.HTTP_404_NOT_FOUND
                )

            OTP.objects.filter(user=user, type='password_reset').delete()
            code = randint(100000, 999999)
            OTP.objects.create(user=user, code=code, type='password_reset')
            
            message = f"Hello! Your temporary code is {code}. It will expire in 10 minutes."
            
            email_sent = _send_otp_with_fallback(
                subject="Forgot Password 🚀",
                user_email=email,
                message=message,
                message_type='forgot password',
            )

            response_payload = {"success": "OTP sent successfully to your email"}
            if not email_sent and settings.DEBUG:
                response_payload = {
                    "success": "OTP generated, but email delivery failed in development. Use the OTP from this response.",
                    "otp": str(code),
                }

            return Response(response_payload, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        

from .serializers import ResetPasswordSerializer

class ResetView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            password = serializer.validated_data['password']

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not available on this email"}, status=status.HTTP_404_NOT_FOUND)

            otp = OTP.objects.filter(user=user, code=code, type='password_reset').first()
            if not otp:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            if otp.is_expired():
                return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(password)
            if user.is_active == False:
                user.is_active = True
            user.save()
            
            # Delete OTP after successful use
            otp.delete()

            return Response({"success": "Password reset successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




from rest_framework import viewsets,permissions
from .models import UserProfile
from .serializers import UserProfileSerializer

class CustomerPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True
        return False
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.user==request.user

class ProfileView(viewsets.ModelViewSet):
    queryset=UserProfile.objects.select_related('user',"user__creditaccount")
    permission_classes=[CustomerPermission]
    serializer_class=UserProfileSerializer
    

    def create(self, request, *args, **kwargs):
        # Check if user already has a profile
        profile = UserProfile.objects.filter(user=request.user).first()
        if profile:
            # If profile exists, update it instead of creating a new one
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            first_name=request.data.get("first_name",None)
            last_name=request.data.get("last_name",None)
            email=request.data.get("email",None)
            username=request.data.get("username",None)
            update_fields = []
            if first_name:
                request.user.first_name=first_name
                update_fields.append('first_name')
            if last_name:
                request.user.last_name=last_name
                update_fields.append('last_name')
            if email:
                request.user.email=email
                update_fields.append('email')
            if username:
                request.user.username=username
                update_fields.append('username')
            if update_fields:
                request.user.save(update_fields=update_fields)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # def get_queryset(self):
    #     if self.request.user.is_staff:
    #         return super().get_queryset()
    #     return super().get_queryset().filter(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(user=self.request.user)

        # Non-staff users only see their own profile
        # if not self.request.user.is_staff:
        #     queryset = queryset.filter(user=self.request.user)

        # 🔍 Filter by email (query param)
        email = self.request.query_params.get("email")
        if email:
            queryset = queryset.filter(user__email__icontains=email)

        return queryset
    





#Credit Account View

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CreditAccount
from .serializers import CreditAccountSerializer
from rest_framework.permissions import IsAuthenticated



class CreditAccountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            credit_account = CreditAccount.objects.get(user=request.user)
            serializer = CreditAccountSerializer(credit_account)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CreditAccount.DoesNotExist:
            return Response({"error": "Credit account not found."}, status=status.HTTP_404_NOT_FOUND)


# Admin user creation endpoint
from rest_framework.permissions import IsAdminUser

class CreateAdminView(APIView):
    """
    Create a new admin user. Only accessible by existing admins.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not all([email, username, password]):
            return Response(
                {"error": "Email, username, and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "A user with this username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            admin_user = User.objects.create_user(
                email=email,
                username=username,
                password=password,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            return Response({
                "message": "Admin user created successfully.",
                "user": {
                    "id": admin_user.id,
                    "email": admin_user.email,
                    "username": admin_user.username,
                    "is_staff": admin_user.is_staff,
                    "is_superuser": admin_user.is_superuser
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordView(APIView):
    """
    Change password for authenticated users.
    Requires current password and new password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {"error": "Both current_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        if len(new_password) < 8:
            return Response(
                {"error": "New password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK
        )


class DeleteAccountView(APIView):
    """
    Delete account for authenticated users.
    Requires password confirmation.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        password = request.data.get('password')
        
        if not password:
            return Response(
                {"error": "Password is required to confirm account deletion."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {"error": "Password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete the user account
        user_email = user.email
        user.delete()
        
        return Response(
            {"message": f"Account for {user_email} has been deleted successfully."},
            status=status.HTTP_200_OK
        )