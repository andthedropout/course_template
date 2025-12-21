from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserAddress
from .serializers import UserAddressSerializer


class UserAddressViewSet(viewsets.ModelViewSet):
    """
    API endpoints for user saved addresses.

    All endpoints require authentication.

    Endpoints:
    GET /api/v1/users/addresses/                  - List user's addresses
    POST /api/v1/users/addresses/                 - Create new address
    GET /api/v1/users/addresses/<id>/             - Get address detail
    PUT/PATCH /api/v1/users/addresses/<id>/       - Update address
    DELETE /api/v1/users/addresses/<id>/          - Delete address
    POST /api/v1/users/addresses/<id>/set_default/ - Set as default address
    """
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return addresses belonging to the authenticated user"""
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate new address with the authenticated user"""
        # If this is the user's first address, make it default
        is_first_address = not UserAddress.objects.filter(
            user=self.request.user
        ).exists()

        serializer.save(
            user=self.request.user,
            is_default=is_first_address or serializer.validated_data.get('is_default', False)
        )

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this address as the user's default address"""
        address = self.get_object()

        # Unset all other defaults for this user
        UserAddress.objects.filter(
            user=request.user,
            is_default=True
        ).update(is_default=False)

        # Set this address as default
        address.is_default = True
        address.save()

        serializer = self.get_serializer(address)
        return Response(serializer.data)
