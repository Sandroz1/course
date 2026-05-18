from urllib.parse import urlparse

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

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
from .tokens import refresh_for_user, validate_refresh_token_version


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    lifetime = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    response.set_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=int(lifetime.total_seconds()),
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        domain=settings.AUTH_REFRESH_COOKIE_DOMAIN,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        httponly=True,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        domain=settings.AUTH_REFRESH_COOKIE_DOMAIN,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


def auth_response(user, response_status=status.HTTP_200_OK):
    refresh = refresh_for_user(user)
    response = Response(
        {
            "user": UserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
            },
        },
        status=response_status,
    )
    set_refresh_cookie(response, str(refresh))

    return response


def get_refresh_token_from_request(request) -> str | None:
    return request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)


def normalize_origin(value: str | None) -> str | None:
    if not value:
        return None

    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return None

    return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}"


def get_auth_request_origin(request) -> str | None:
    origin = normalize_origin(request.headers.get("Origin"))
    if origin:
        return origin

    return normalize_origin(request.headers.get("Referer"))


def get_trusted_auth_origins(request) -> set[str]:
    origins = {
        origin
        for origin in (
            normalize_origin(value)
            for value in [*settings.CSRF_TRUSTED_ORIGINS, *settings.CORS_ALLOWED_ORIGINS]
        )
        if origin
    }
    current_origin = normalize_origin(f"{request.scheme}://{request.get_host()}")
    if current_origin:
        origins.add(current_origin)

    return origins


def enforce_cookie_refresh_origin(request) -> None:
    origin = get_auth_request_origin(request)
    if not origin or origin not in get_trusted_auth_origins(request):
        raise PermissionDenied("Trusted Origin or Referer header is required.")


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth_login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        return auth_response(serializer.validated_data["user"])


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = get_refresh_token_from_request(request)

        if not refresh_token:
            raise AuthenticationFailed("Refresh token cookie is missing.")

        enforce_cookie_refresh_origin(request)

        try:
            validate_refresh_token_version(refresh_token)
            serializer = self.get_serializer(data={"refresh": refresh_token})
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(str(exc)) from exc

        payload = dict(serializer.validated_data)
        next_refresh = payload.pop("refresh", None)
        response = Response(payload, status=status.HTTP_200_OK)

        if next_refresh:
            set_refresh_cookie(response, next_refresh)

        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = get_refresh_token_from_request(request)

        if not refresh_token:
            raise AuthenticationFailed("Refresh token cookie is missing.")

        enforce_cookie_refresh_origin(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)

        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            pass

        clear_refresh_cookie(response)

        return response


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
