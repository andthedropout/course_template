"""
Custom permissions for blog app.
"""
from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """
    Permission class that only allows staff users to perform the action.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for staff users
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsAuthorOrStaff(permissions.BasePermission):
    """
    Permission class that allows:
    - Authors to edit their own posts
    - Staff users to edit any post
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Staff can edit anything
        if request.user and request.user.is_staff:
            return True

        # Authors can only edit their own posts
        return obj.author == request.user
