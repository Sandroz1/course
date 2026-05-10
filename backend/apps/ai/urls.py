from django.urls import path

from .views import AiChatView, AiHealthView


urlpatterns = [
    path("health/", AiHealthView.as_view(), name="ai-health"),
    path("chat/", AiChatView.as_view(), name="ai-chat"),
]
