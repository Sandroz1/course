from rest_framework.throttling import SimpleRateThrottle


class BaseAiThrottle(SimpleRateThrottle):
    scope = ""

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = f"user:{request.user.pk}"
        else:
            ident = f"anon:{self.get_ident(request)}"

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }


class AiUserBurstThrottle(BaseAiThrottle):
    scope = "ai_user_burst"

    def allow_request(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return True
        return super().allow_request(request, view)


class AiGlobalBurstThrottle(SimpleRateThrottle):
    scope = "ai_global_burst"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": "global",
        }


class AiUserDailyThrottle(AiUserBurstThrottle):
    scope = "ai_user_daily"
