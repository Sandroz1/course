from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import PhoneVerificationCode, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Телефон", {"fields": ("phone", "is_phone_verified")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Телефон", {"fields": ("phone", "is_phone_verified")}),
    )
    list_display = (
        "username",
        "email",
        "phone",
        "is_phone_verified",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
        "last_login",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "is_phone_verified", "date_joined", "last_login")
    search_fields = ("username", "email", "phone")
    ordering = ("username",)
    readonly_fields = DjangoUserAdmin.readonly_fields + ("date_joined", "last_login")


@admin.register(PhoneVerificationCode)
class PhoneVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "created_at", "expires_at", "attempts_count", "is_used", "sent_ip")
    list_filter = ("is_used", "created_at", "expires_at")
    search_fields = ("user__username", "phone", "sent_ip")
    readonly_fields = ("user", "phone", "code_hash", "created_at", "expires_at", "attempts_count", "is_used", "sent_ip")

    def has_add_permission(self, request):
        return False
