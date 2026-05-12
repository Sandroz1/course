from rest_framework.throttling import SimpleRateThrottle


class AuthUserScopedRateThrottle(SimpleRateThrottle):
    scope = ""

    def get_cache_key(self, request, _view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)

        return self.cache_format % {"scope": self.scope, "ident": ident}


class PhoneSendCodeMinuteThrottle(AuthUserScopedRateThrottle):
    scope = "phone_send_code"


class PhoneSendCodeDailyThrottle(AuthUserScopedRateThrottle):
    scope = "phone_send_code_daily"


class PhoneVerifyCodeThrottle(AuthUserScopedRateThrottle):
    scope = "phone_verify_code"


class ChangePasswordThrottle(AuthUserScopedRateThrottle):
    scope = "change_password"
