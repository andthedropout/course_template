from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import Course, Module, Lesson, Enrollment, LessonProgress, BunnyVideo, CoursePrerequisite
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
    BunnyVideoSerializer,
    CoursePrerequisiteSerializer,
)
from .permissions import IsEnrolledOrFreePreview
from .bunny_service import BunnyStreamService


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

    # Serialize prerequisites
    prerequisites = CoursePrerequisiteSerializer(course.prerequisites.all(), many=True).data

    # Serialize tags
    from blog.models import Tag
    tags = [{'id': t.id, 'name': t.name, 'slug': t.slug} for t in course.tags.all()]

    return Response({
        'course': {
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
            'description': course.description,
            'long_description': course.long_description,
            'thumbnail_url': course.thumbnail_url,
            'difficulty': course.difficulty,
            'learning_objectives': course.learning_objectives or [],
            'tags': tags,
            'prerequisites': prerequisites,
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


# ============ Bunny Stream Video Views ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_bunny_videos(request):
    """List all uploaded Bunny videos for the video library. Staff only."""
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    videos = BunnyVideo.objects.filter(status='ready').order_by('-created_at')
    serializer = BunnyVideoSerializer(videos, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_bunny_upload(request):
    """
    Initialize a Bunny video upload.
    Returns TUS upload URL and video GUID for direct frontend upload.
    Staff only.
    """
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    title = request.data.get('title', 'Untitled Video')

    service = BunnyStreamService()
    if not service.is_configured():
        return Response(
            {'detail': 'Bunny Stream is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        result = service.create_video(title)
    except Exception as e:
        return Response(
            {'detail': f'Failed to create video: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Create local tracking record
    video = BunnyVideo.objects.create(
        guid=result['guid'],
        title=title,
        status='uploading',
        uploaded_by=request.user
    )

    # Generate TUS auth headers
    tus_headers = service.generate_tus_auth_headers(result['guid'])

    return Response({
        'video_id': video.id,
        'guid': result['guid'],
        'tus_upload_url': result['tus_upload_url'],
        'library_id': service.library_id,
        'tus_headers': tus_headers,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_bunny_upload(request, video_id):
    """
    Called by frontend after TUS upload completes.
    Fetches video metadata from Bunny and updates local record.
    Staff only.
    """
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    video = get_object_or_404(BunnyVideo, id=video_id)

    service = BunnyStreamService()
    try:
        bunny_data = service.get_video_status(video.guid)
    except Exception as e:
        return Response(
            {'detail': f'Failed to fetch video status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Bunny status: 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=ready, 5=error
    bunny_status = bunny_data.get('status', 0)
    if bunny_status == 4:
        video.status = 'ready'
    elif bunny_status == 5:
        video.status = 'failed'
    elif bunny_status >= 1:
        video.status = 'processing'

    video.duration_seconds = bunny_data.get('length')
    video.file_size_bytes = bunny_data.get('storageSize')
    video.thumbnail_blurhash = bunny_data.get('thumbnailBlurhash', '')

    # Build thumbnail URL - use thumbnailFileName if available, otherwise default to thumbnail.jpg
    thumbnail_filename = bunny_data.get('thumbnailFileName') or 'thumbnail.jpg'
    video.thumbnail_url = f"https://{service.cdn_hostname}/{video.guid}/{thumbnail_filename}"

    video.save()

    return Response(BunnyVideoSerializer(video).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_video_status(request, video_id):
    """Poll video processing status. Staff only."""
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    video = get_object_or_404(BunnyVideo, id=video_id)

    if video.status in ['uploading', 'processing']:
        service = BunnyStreamService()
        try:
            bunny_data = service.get_video_status(video.guid)

            bunny_status = bunny_data.get('status', 0)
            if bunny_status == 4:
                video.status = 'ready'
                video.duration_seconds = bunny_data.get('length')
                video.file_size_bytes = bunny_data.get('storageSize')
                video.thumbnail_blurhash = bunny_data.get('thumbnailBlurhash', '')

                thumbnail_filename = bunny_data.get('thumbnailFileName') or 'thumbnail.jpg'
                video.thumbnail_url = f"https://{service.cdn_hostname}/{video.guid}/{thumbnail_filename}"

                video.save()
            elif bunny_status == 5:
                video.status = 'failed'
                video.save()
        except Exception:
            pass  # Keep current status on error

    return Response({
        'status': video.status,
        'video': BunnyVideoSerializer(video).data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_bunny_video(request, video_id):
    """Delete a video from Bunny Stream and local database. Staff only."""
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    video = get_object_or_404(BunnyVideo, id=video_id)

    # Check if video is used by any lessons
    if video.lessons.exists():
        return Response(
            {'detail': 'Cannot delete video that is in use by lessons.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    service = BunnyStreamService()
    try:
        service.delete_video(video.guid)
    except Exception:
        pass  # Continue with local deletion even if Bunny fails

    video.delete()

    return Response({'status': 'deleted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video_thumbnail(request, video_id):
    """
    Proxy endpoint to serve video thumbnails.
    Required because Bunny CDN with token auth blocks direct thumbnail access.
    Staff only.
    """
    from django.http import HttpResponse

    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    video = get_object_or_404(BunnyVideo, id=video_id)

    if video.status != 'ready':
        return Response(
            {'detail': 'Video not ready.'},
            status=status.HTTP_404_NOT_FOUND
        )

    service = BunnyStreamService()
    if not service.is_configured():
        return Response(
            {'detail': 'Bunny Stream not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Fetch thumbnail using signed URL
    thumbnail_bytes = service.fetch_thumbnail_bytes(video.guid)
    if thumbnail_bytes:
        return HttpResponse(
            thumbnail_bytes,
            content_type='image/jpeg'
        )

    return Response(
        {'detail': 'Failed to fetch thumbnail.'},
        status=status.HTTP_404_NOT_FOUND
    )


# ============ Course Prerequisites Views ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_course_prerequisite(request, course_slug):
    """
    Add a prerequisite to a course. Staff only.
    Body: { required_course_id: int, enforcement: 'recommended' | 'required' }
    """
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    course = get_object_or_404(Course, slug=course_slug)
    required_course_id = request.data.get('required_course_id')
    enforcement = request.data.get('enforcement', 'recommended')

    if not required_course_id:
        return Response(
            {'detail': 'required_course_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    required_course = get_object_or_404(Course, id=required_course_id)

    # Prevent self-reference
    if course.id == required_course.id:
        return Response(
            {'detail': 'A course cannot be its own prerequisite.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already exists
    if CoursePrerequisite.objects.filter(course=course, required_course=required_course).exists():
        return Response(
            {'detail': 'This prerequisite already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    prerequisite = CoursePrerequisite.objects.create(
        course=course,
        required_course=required_course,
        enforcement=enforcement
    )

    return Response(
        CoursePrerequisiteSerializer(prerequisite).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_course_prerequisite(request, course_slug, prerequisite_id):
    """Remove a prerequisite from a course. Staff only."""
    if not request.user.is_staff:
        return Response(
            {'detail': 'Staff access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    course = get_object_or_404(Course, slug=course_slug)
    prerequisite = get_object_or_404(CoursePrerequisite, id=prerequisite_id, course=course)
    prerequisite.delete()

    return Response({'status': 'deleted'})
