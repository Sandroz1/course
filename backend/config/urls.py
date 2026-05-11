from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.accounts.views import MeView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/admin/", include("apps.accounts.urls_admin")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/progress/", include("apps.progress.urls")),
    path("api/me/", MeView.as_view(), name="me"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
