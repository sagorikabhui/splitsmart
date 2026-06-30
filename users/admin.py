from django.contrib import admin

# Register your models herefrom django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "phone",
        "upi_id",
        "is_staff",
    )