from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThemeViewSet, ThemeSettingViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'themes', ThemeViewSet, basename='theme')
router.register(r'theme-settings', ThemeSettingViewSet, basename='theme-setting')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

# This creates the following endpoints (mounted at /api/v1/ in main urls.py):
# GET    /api/v1/themes/                    - List all active themes (lightweight)
# POST   /api/v1/themes/                    - Create new theme
# GET    /api/v1/themes/{name}/             - Get specific theme by name (full data)
# PUT    /api/v1/themes/{name}/             - Update theme (admin only)
# DELETE /api/v1/themes/{name}/             - Delete theme (admin only)
# GET    /api/v1/themes/current/            - Get current active theme
# GET    /api/v1/themes/current-setting/    - Get current theme setting
# POST   /api/v1/themes/set-current/        - Set current theme (admin only)
# POST   /api/v1/themes/{name}/duplicate/   - Duplicate theme (admin only)
# 
# GET    /api/v1/theme-settings/            - Get theme setting
# POST   /api/v1/theme-settings/            - Create theme setting (admin only)
# PUT    /api/v1/theme-settings/{id}/       - Update theme setting (admin only) 