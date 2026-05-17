import logging

from rest_framework import permissions, status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsPhoneVerified
from .serializers import ChatRequestSerializer
from .services import AiProviderResult, UpstreamAiError, build_qwen_messages, call_qwen
from .throttles import AiGlobalBurstThrottle, AiUserBurstThrottle
from .usage import (
    AiDailyLimitExceeded,
    AiGlobalDailyLimitExceeded,
    record_ai_token_usage,
    release_ai_request,
    reserve_ai_request,
)


logger = logging.getLogger(__name__)


class AiHealthView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def get(self, _request):
        return Response(
            {
                "status": "ok",
                "service": "uchicode-ai",
            }
        )


class AiChatView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPhoneVerified]
    throttle_classes = [AiGlobalBurstThrottle, AiUserBurstThrottle]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        messages = build_qwen_messages(
            question=data["question"],
            selected_text=data.get("selectedText", ""),
            history=data.get("history", []),
        )

        try:
            usage = reserve_ai_request(request.user)
        except AiDailyLimitExceeded as exc:
            logger.warning(
                "ai_user_daily_limit_exceeded",
                extra={"user_id": request.user.pk, "remaining": exc.usage.remaining},
            )
            return Response(
                {
                    "message": "Лимит AI-запросов на сегодня исчерпан.",
                    "remainingRequests": exc.usage.remaining,
                    "usage": exc.usage.as_dict(),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except AiGlobalDailyLimitExceeded as exc:
            logger.warning(
                "ai_global_daily_limit_exceeded",
                extra={"limit": exc.usage.limit, "used": exc.usage.used},
            )
            return Response(
                {
                    "message": "AI request limit is temporarily exhausted.",
                    "remainingRequests": exc.usage.remaining,
                    "usage": exc.usage.as_dict(),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            provider_result = call_qwen(messages)
        except UpstreamAiError as exc:
            release_ai_request(request.user)
            logger.warning(
                "ai_upstream_error",
                extra={"user_id": request.user.pk, "status_code": exc.status_code},
            )
            return Response({"message": exc.message}, status=exc.status_code)
        except Exception:
            release_ai_request(request.user)
            raise

        if isinstance(provider_result, AiProviderResult):
            answer = provider_result.answer
            if provider_result.has_token_usage:
                usage = record_ai_token_usage(
                    request.user,
                    prompt_tokens=provider_result.prompt_tokens,
                    completion_tokens=provider_result.completion_tokens,
                    total_tokens=provider_result.total_tokens,
                )
        else:
            answer = provider_result

        logger.info(
            "ai_request_completed",
            extra={
                "user_id": request.user.pk,
                "remaining": usage.remaining,
                "total_tokens": usage.total_tokens,
            },
        )

        return Response(
            {
                "answer": answer,
                "remainingRequests": usage.remaining,
                "usage": usage.as_dict(),
            }
        )

    def throttled(self, request, wait):
        raise Throttled(
            detail="Слишком много запросов к AI. Подожди немного и попробуй снова.",
            wait=wait,
        )
