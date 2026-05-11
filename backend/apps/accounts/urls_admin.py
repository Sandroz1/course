from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views_admin import AdminUserViewSet


router = SimpleRouter()
router.register("users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("", include(router.urls)),
]
