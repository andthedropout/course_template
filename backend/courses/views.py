from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Course, Module, Lesson, Enrollment
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    LessonSerializer,
    LessonListSerializer,
    EnrollmentSerializer,
    ModuleSerializer,
)
from .permissions import IsEnrolledOrFreePreview


class CourseListView(generics.ListAPIView):
    """List all published courses."""
    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Course.objects.filter(status='published')


class CourseDetailView(generics.RetrieveAPIView):
    """Get course details by slug."""
    serializer_class = CourseDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Course.objects.filter(status='published')


class CourseLessonsView(generics.ListAPIView):
    """List all lessons for a course (with enrollment check for content)."""
    serializer_class = LessonListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        course = get_object_or_404(Course, slug=self.kwargs['slug'], status='published')
        return Lesson.objects.filter(module__course=course).order_by('module__order', 'order')


class LessonDetailView(generics.RetrieveAPIView):
    """Get lesson detail (requires enrollment or free preview)."""
    serializer_class = LessonSerializer
    permission_classes = [IsEnrolledOrFreePreview]

    def get_object(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'], status='published')
        lesson = get_object_or_404(
            Lesson,
            slug=self.kwargs['lesson_slug'],
            module__course=course
        )
        self.check_object_permissions(self.request, lesson)
        return lesson


class MyEnrollmentsView(generics.ListAPIView):
    """List courses the current user is enrolled in."""
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user,
            course__status='published'
        ).select_related('course')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_enrollment(request, slug):
    """Check if current user is enrolled in a specific course."""
    course = get_object_or_404(Course, slug=slug, status='published')
    is_enrolled = Enrollment.objects.filter(
        user=request.user,
        course=course
    ).exists()

    return Response({
        'is_enrolled': is_enrolled,
        'course_slug': slug
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def course_structure(request, slug):
    """
    Get the full course structure (modules + lessons) for navigation.
    Includes enrollment status if user is authenticated.
    """
    course = get_object_or_404(Course, slug=slug, status='published')

    # Check enrollment status
    is_enrolled = False
    if request.user.is_authenticated:
        is_enrolled = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).exists()

    # Build structure
    modules = course.modules.prefetch_related('lessons').all()
    module_data = ModuleSerializer(modules, many=True).data

    return Response({
        'course': {
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
        },
        'is_enrolled': is_enrolled,
        'modules': module_data,
    })
