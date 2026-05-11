from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ChatRequestSerializer
from .services import UpstreamAiError, build_qwen_messages, call_qwen
from .throttles import (
    AiAnonBurstThrottle,
    AiAnonDailyThrottle,
    AiUserBurstThrottle,
    AiUserDailyThrottle,
)


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
    throttle_classes = [
        AiAnonBurstThrottle,
        AiAnonDailyThrottle,
        AiUserBurstThrottle,
        AiUserDailyThrottle,
    ]

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
            answer = call_qwen(messages)
        except UpstreamAiError as exc:
            return Response({"message": exc.message}, status=exc.status_code)

        return Response({"answer": answer})

    def throttled(self, request, wait):
        raise Throttled(
            detail="Слишком много запросов к AI. Подожди немного и попробуй снова.",
            wait=wait,
        )
