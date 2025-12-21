from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import Course, Module, Lesson, Enrollment
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    CourseWriteSerializer,
    CourseFullSerializer,
    LessonSerializer,
    LessonListSerializer,
    LessonWriteSerializer,
    EnrollmentSerializer,
    ModuleSerializer,
    ModuleWriteSerializer,
    ReorderModulesSerializer,
    ReorderLessonsSerializer,
)
from .permissions import IsEnrolledOrFreePreview


class IsStaff(IsAdminUser):
    """Permission check for staff users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


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


# ============ Staff CMS Views ============

class StaffCourseListCreateView(generics.ListCreateAPIView):
    """List all courses (including drafts) or create a new course. Staff only."""
    permission_classes = [IsStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseWriteSerializer
        return CourseFullSerializer

    def get_queryset(self):
        return Course.objects.all().order_by('-updated_at')


class StaffCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a course. Staff only."""
    permission_classes = [IsStaff]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CourseWriteSerializer
        return CourseFullSerializer

    def get_queryset(self):
        return Course.objects.all()


class StaffModuleListCreateView(generics.ListCreateAPIView):
    """List or create modules for a course. Staff only."""
    serializer_class = ModuleWriteSerializer
    permission_classes = [IsStaff]

    def get_queryset(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        return Module.objects.filter(course=course).order_by('order')

    def perform_create(self, serializer):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        # Auto-set order to be last
        max_order = Module.objects.filter(course=course).count()
        serializer.save(course=course, order=max_order)


class StaffModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a module. Staff only."""
    serializer_class = ModuleWriteSerializer
    permission_classes = [IsStaff]

    def get_object(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        return get_object_or_404(Module, id=self.kwargs['module_id'], course=course)


class StaffLessonListCreateView(generics.ListCreateAPIView):
    """List or create lessons for a module. Staff only."""
    permission_classes = [IsStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LessonWriteSerializer
        return LessonListSerializer

    def get_queryset(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        module = get_object_or_404(Module, id=self.kwargs['module_id'], course=course)
        return Lesson.objects.filter(module=module).order_by('order')

    def perform_create(self, serializer):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        module = get_object_or_404(Module, id=self.kwargs['module_id'], course=course)
        # Auto-set order to be last
        max_order = Lesson.objects.filter(module=module).count()
        serializer.save(module=module, order=max_order)


class StaffLessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a lesson. Staff only."""
    permission_classes = [IsStaff]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return LessonWriteSerializer
        return LessonSerializer

    def get_object(self):
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        return get_object_or_404(
            Lesson,
            slug=self.kwargs['lesson_slug'],
            module__course=course
        )


class ReorderModulesView(APIView):
    """Reorder modules within a course. Staff only."""
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request, course_slug):
        course = get_object_or_404(Course, slug=course_slug)
        serializer = ReorderModulesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for item in serializer.validated_data['modules']:
            Module.objects.filter(
                id=item['id'],
                course=course
            ).update(order=item['order'])

        return Response({'status': 'ok'})


class ReorderLessonsView(APIView):
    """Reorder lessons within a module. Staff only."""
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request, course_slug):
        course = get_object_or_404(Course, slug=course_slug)
        serializer = ReorderLessonsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        module = get_object_or_404(
            Module,
            id=serializer.validated_data['module_id'],
            course=course
        )

        for item in serializer.validated_data['lessons']:
            Lesson.objects.filter(
                id=item['id'],
                module=module
            ).update(order=item['order'])

        return Response({'status': 'ok'})
