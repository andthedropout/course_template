from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserAddressViewSet

app_name = 'users'

router = DefaultRouter()
router.register('addresses', UserAddressViewSet, basename='address')

urlpatterns = [
    path('', include(router.urls)),
]
