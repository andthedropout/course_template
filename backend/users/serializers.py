from rest_framework import serializers
from .models import UserAddress


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer for user saved addresses"""

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = UserAddress
        fields = [
            'id',
            'label',
            'first_name',
            'last_name',
            'street_address',
            'city',
            'state',
            'postal_code',
            'country',
            'is_default',
            'display_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'display_name']

    def get_display_name(self, obj):
        """Generate a display-friendly name for the address"""
        parts = [f"{obj.first_name} {obj.last_name}"]
        if obj.label:
            parts.append(f"({obj.label})")
        parts.append(f"- {obj.street_address}, {obj.city}")
        return " ".join(parts)

    def create(self, validated_data):
        # Automatically associate with the authenticated user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
