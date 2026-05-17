from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import F
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken


AUTH_TOKEN_VERSION_CLAIM = "auth_version"


def refresh_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh[AUTH_TOKEN_VERSION_CLAIM] = user.auth_token_version
    return refresh


def blacklist_user_refresh_tokens(user) -> None:
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


def invalidate_user_tokens(user) -> None:
    blacklist_user_refresh_tokens(user)
    type(user).objects.filter(pk=user.pk).update(auth_token_version=F("auth_token_version") + 1)
    user.refresh_from_db(fields=["auth_token_version"])


def validate_refresh_token_version(refresh_token: str) -> None:
    token = RefreshToken(refresh_token)
    user_id_claim = settings.SIMPLE_JWT.get("USER_ID_CLAIM", "user_id")
    user_id = token.get(user_id_claim)
    token_version = token.get(AUTH_TOKEN_VERSION_CLAIM)

    try:
        token_version = int(token_version)
    except (TypeError, ValueError) as exc:
        raise TokenError("Token is no longer valid.") from exc

    User = get_user_model()
    user = User.objects.filter(pk=user_id, is_active=True).only("auth_token_version").first()
    if not user or token_version != user.auth_token_version:
        raise TokenError("Token is no longer valid.")
