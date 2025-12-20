"""
URL configuration for gagglehomev2 project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.conf.urls.static import static
from django.views.static import serve
from .views import IndexView, list_available_backgrounds, ImageUploadView
from .api_auth_views import LoginView, LogoutView, AuthStatusView, SignupView, get_csrf_token
from . import admin as custom_admin  # Import our custom admin configuration
import logging
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.middleware.csrf import get_token

logger = logging.getLogger(__name__)

# API endpoints should come before the catchall route
api_patterns = [
    # API Auth URLs
    path("login/", LoginView.as_view(), name="api_login"),
    path("logout/", LogoutView.as_view(), name="api_logout"),
    path("signup/", SignupView.as_view(), name="api_signup"),
    path("auth_status/", AuthStatusView.as_view(), name="api_auth_status"),
    path("csrf_token/", get_csrf_token, name="api_csrf_token"),
    path("backgrounds/", list_available_backgrounds, name="api_backgrounds"),
    path("upload/image/", ImageUploadView.as_view(), name="api_image_upload"),
    # User URLs
    path("", include("users.urls")),
    # Theme URLs
    path("", include("themes.urls")),
    # Blog URLs
    path("blog/", include("blog.urls")),
]

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'csrfToken': get_token(request)})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("up/", include("up.urls")),
    path("markdownx/", include("markdownx.urls")),

    # Mount API endpoints with the 'api/v1/' prefix
    path("api/v1/", include((api_patterns, "api"))),

    # Serve React app for home page
    path("", IndexView.as_view(), name="home"),
]

# Serve media files (user uploads) - works in both dev and production
# CRITICAL: Must come BEFORE React catchall to prevent route conflicts
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# In development, let Django serve static files
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React catchall - MUST be last to avoid capturing other routes
urlpatterns += [
    re_path(r'^(?!admin|api|up|static|media).*$', IndexView.as_view(), name="react_catchall"),
]

# Only include debug toolbar URLs if installed (development environment)
if not settings.TESTING:
    try:
        import debug_toolbar  # noqa: F401
        urlpatterns = [
            *urlpatterns,
            path("__debug__/", include("debug_toolbar.urls")),
        ]
    except ImportError:
        # Debug toolbar not installed (production build)
        pass
