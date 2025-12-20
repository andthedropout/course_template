from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User


class UserAdmin(BaseUserAdmin):
    """Custom user admin to show site manager group membership"""
    
    # Add is_site_manager to the list display
    list_display = BaseUserAdmin.list_display + ('is_site_manager',)
    
    # Add is_site_manager to list filter
    list_filter = BaseUserAdmin.list_filter + ('groups',)
    
    def is_site_manager(self, obj):
        """Check if user is in Site Managers group"""
        return obj.groups.filter(name='Site Managers').exists()
    
    is_site_manager.boolean = True
    is_site_manager.short_description = 'Site Manager'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin) 