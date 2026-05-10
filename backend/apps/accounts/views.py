from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class RegisterPlaceholderView(APIView):
    throttle_scope = "auth_register"

    def post(self, _request):
        return Response(
            {
                "detail": "Registration endpoint is not implemented yet.",
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class LoginPlaceholderView(APIView):
    throttle_scope = "auth_login"

    def post(self, _request):
        return Response(
            {
                "detail": "Login endpoint is not implemented yet.",
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
