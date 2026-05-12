from rest_framework import permissions, status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsPhoneVerified
from .serializers import ChatRequestSerializer
from .services import UpstreamAiError, build_qwen_messages, call_qwen
from .usage import AiDailyLimitExceeded, release_ai_request, reserve_ai_request


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
            return Response(
                {
                    "message": "Лимит AI-запросов на сегодня исчерпан.",
                    "remainingRequests": exc.usage.remaining,
                    "usage": exc.usage.as_dict(),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            answer = call_qwen(messages)
        except UpstreamAiError as exc:
            release_ai_request(request.user)
            return Response({"message": exc.message}, status=exc.status_code)
        except Exception:
            release_ai_request(request.user)
            raise

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
