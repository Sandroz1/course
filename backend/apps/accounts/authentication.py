from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .tokens import AUTH_TOKEN_VERSION_CLAIM


class VersionedJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_version = validated_token.get(AUTH_TOKEN_VERSION_CLAIM)

        try:
            token_version = int(token_version)
        except (TypeError, ValueError) as exc:
            raise AuthenticationFailed("Token is no longer valid.", code="token_not_valid") from exc

        if token_version != user.auth_token_version:
            raise AuthenticationFailed("Token is no longer valid.", code="token_not_valid")

        return user
