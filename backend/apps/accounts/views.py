from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.throttles import (
    ChangePasswordThrottle,
    PhoneSendCodeDailyThrottle,
    PhoneSendCodeMinuteThrottle,
    PhoneVerifyCodeThrottle,
)

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    PhoneSendCodeSerializer,
    PhoneVerifySerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .services.phone_verification import confirm_phone_code, create_and_send_code


def auth_payload(user):
    refresh = RefreshToken.for_user(user)

    return {
        "user": UserSerializer(user).data,
        "tokens": {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth_login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        return Response(auth_payload(serializer.validated_data["user"]))


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not isinstance(refresh_token, str) or not refresh_token.strip():
            raise ValidationError({"refresh": ["Передайте refresh token."]})

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(UserSerializer(request.user).data)


class PhoneSendCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PhoneSendCodeMinuteThrottle, PhoneSendCodeDailyThrottle]

    def post(self, request):
        serializer = PhoneSendCodeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        create_and_send_code(
            user=request.user,
            phone=serializer.validated_data["phone"],
            request=request,
        )

        return Response({"message": "Код отправлен."})


class PhoneVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [PhoneVerifyCodeThrottle]

    def post(self, request):
        serializer = PhoneVerifySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = confirm_phone_code(
            user=request.user,
            phone=serializer.validated_data["phone"],
            code=serializer.validated_data["code"],
        )

        return Response({"message": "Телефон подтверждён.", "user": UserSerializer(user).data})


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ChangePasswordThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "Пароль изменён."})
