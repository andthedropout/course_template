from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Course, Module, Lesson, Enrollment, LessonProgress
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
    LessonProgressUpdateSerializer,
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
        # Get course regardless of status - permission check handles access
        course = get_object_or_404(Course, slug=self.kwargs['course_slug'])
        lesson = get_object_or_404(
            Lesson,
            slug=self.kwargs['lesson_slug'],
            module__course=course
        )
        self.check_object_permissions(self.request, lesson)
        return lesson


class MyEnrollmentsView(generics.ListAPIView):
    """List courses the current user is enrolled in (including draft courses)."""
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Show all enrolled courses regardless of status
        # Enrolled users should see their courses even if not published yet
        return Enrollment.objects.filter(
            user=self.request.user
        ).select_related('course')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_enrollment(request, slug):
    """Check if current user is enrolled in a specific course."""
    # Allow checking enrollment for any course (including drafts)
    course = get_object_or_404(Course, slug=slug)
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

    Access rules:
    - Published courses: visible to everyone
    - Draft courses: only visible to enrolled users or staff
    """
    # First try to get the course regardless of status
    course = get_object_or_404(Course, slug=slug)

    # Check enrollment status
    is_enrolled = False
    is_staff = request.user.is_authenticated and request.user.is_staff
    if request.user.is_authenticated:
        is_enrolled = Enrollment.objects.filter(
            user=request.user,
            course=course
        ).exists()

    # If course is not published, only allow enrolled users or staff
    if course.status != 'published' and not is_enrolled and not is_staff:
        return Response(
            {'detail': 'Course not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Build structure
    modules = course.modules.prefetch_related('lessons').all()
    module_data = ModuleSerializer(modules, many=True).data

    return Response({
        'course': {
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
            'description': course.description,
            'long_description': course.long_description,
            'thumbnail_url': course.thumbnail_url,
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


# ============ Progress Tracking Views ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_lesson_progress(request, course_slug, lesson_slug):
    """
    Update progress for a specific lesson.
    Body: { completed: bool, video_position_seconds: int }
    """
    course = get_object_or_404(Course, slug=course_slug)
    lesson = get_object_or_404(Lesson, slug=lesson_slug, module__course=course)

    # Verify user is enrolled
    if not Enrollment.objects.filter(user=request.user, course=course).exists():
        return Response(
            {'detail': 'Not enrolled in this course.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = LessonProgressUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    progress, created = LessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )

    # Update fields if provided
    if 'completed' in serializer.validated_data:
        new_completed = serializer.validated_data['completed']
        if new_completed and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
        elif not new_completed:
            progress.completed = False
            progress.completed_at = None

    if 'video_position_seconds' in serializer.validated_data:
        progress.video_position_seconds = serializer.validated_data['video_position_seconds']

    progress.save()

    return Response({
        'completed': progress.completed,
        'video_position_seconds': progress.video_position_seconds,
        'completed_at': progress.completed_at,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_progress(request, course_slug):
    """
    Get progress summary for a course.
    Returns completed lessons, percentage, and next lesson to continue.
    """
    course = get_object_or_404(Course, slug=course_slug)

    # Verify user is enrolled
    if not Enrollment.objects.filter(user=request.user, course=course).exists():
        return Response(
            {'detail': 'Not enrolled in this course.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get all lessons in order
    lessons = Lesson.objects.filter(
        module__course=course
    ).order_by('module__order', 'order').values_list('id', 'slug', named=True)

    lesson_ids = [l.id for l in lessons]
    lesson_slugs = {l.id: l.slug for l in lessons}

    # Get progress for all lessons
    progress_qs = LessonProgress.objects.filter(
        user=request.user,
        lesson_id__in=lesson_ids
    )

    completed_ids = set()
    lesson_progress = {}

    for p in progress_qs:
        lesson_progress[p.lesson_id] = {
            'completed': p.completed,
            'video_position_seconds': p.video_position_seconds,
        }
        if p.completed:
            completed_ids.add(p.lesson_id)

    total_lessons = len(lesson_ids)
    completed_count = len(completed_ids)
    percentage = int((completed_count / total_lessons * 100)) if total_lessons > 0 else 0

    # Find next lesson (first uncompleted)
    next_lesson_slug = None
    for lesson_id in lesson_ids:
        if lesson_id not in completed_ids:
            next_lesson_slug = lesson_slugs[lesson_id]
            break

    # If all completed, return last lesson for review
    if next_lesson_slug is None and lesson_ids:
        next_lesson_slug = lesson_slugs[lesson_ids[-1]]

    return Response({
        'completed_lesson_ids': list(completed_ids),
        'total_lessons': total_lessons,
        'completed_count': completed_count,
        'percentage': percentage,
        'next_lesson_slug': next_lesson_slug,
        'lesson_progress': lesson_progress,
    })
