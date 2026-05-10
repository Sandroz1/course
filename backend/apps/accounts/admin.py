from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Телефон", {"fields": ("phone", "is_phone_verified")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Телефон", {"fields": ("phone", "is_phone_verified")}),
    )
    list_display = ("username", "email", "phone", "is_phone_verified", "is_staff", "is_active")
    search_fields = ("username", "email", "phone")

