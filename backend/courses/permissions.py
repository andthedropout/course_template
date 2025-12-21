from rest_framework import permissions
from .models import Enrollment


class IsEnrolledOrFreePreview(permissions.BasePermission):
    """
    Permission check for lesson access:
    - Allow if lesson is marked as free preview
    - Allow if user is enrolled in the course
    - Deny otherwise
    """

    def has_object_permission(self, request, view, lesson):
        # Free preview lessons are accessible to everyone
        if lesson.is_free_preview:
            return True

        # Anonymous users can only access free previews
        if not request.user.is_authenticated:
            return False

        # Check if user is enrolled in the course
        return Enrollment.objects.filter(
            user=request.user,
            course=lesson.module.course
        ).exists()


class IsEnrolled(permissions.BasePermission):
    """
    Permission check for course content access.
    User must be enrolled in the course.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, course):
        return Enrollment.objects.filter(
            user=request.user,
            course=course
        ).exists()
