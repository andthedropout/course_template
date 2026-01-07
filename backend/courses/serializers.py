from rest_framework import serializers
from .models import Course, Module, Lesson, Enrollment, LessonProgress, BunnyVideo, CoursePrerequisite
from .bunny_service import BunnyStreamService
from blog.models import Tag


class CourseTagSerializer(serializers.ModelSerializer):
    """Simple tag serializer for courses (without post_count)."""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CoursePrerequisiteSerializer(serializers.ModelSerializer):
    """Serializer for course prerequisites."""
    required_course_id = serializers.IntegerField(source='required_course.id', read_only=True)
    required_course_title = serializers.CharField(source='required_course.title', read_only=True)
    required_course_slug = serializers.CharField(source='required_course.slug', read_only=True)

    class Meta:
        model = CoursePrerequisite
        fields = ['id', 'required_course_id', 'required_course_title', 'required_course_slug', 'enforcement']


class BunnyVideoSerializer(serializers.ModelSerializer):
    """Serializer for Bunny Stream video data."""

    class Meta:
        model = BunnyVideo
        fields = [
            'id', 'guid', 'title', 'duration_seconds', 'thumbnail_url',
            'thumbnail_blurhash', 'status', 'file_size_bytes', 'created_at'
        ]
        read_only_fields = ['id', 'guid', 'created_at']


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lesson data (read)."""
    bunny_video = BunnyVideoSerializer(read_only=True)
    signed_video_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'content', 'blocks', 'video_url',
            'bunny_video', 'signed_video_url',
            'duration_minutes', 'order', 'is_free_preview'
        ]

    def get_signed_video_url(self, obj):
        """Generate signed Bunny URL for enrolled users."""
        if not obj.bunny_video or obj.bunny_video.status != 'ready':
            return None

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        # Staff always get signed URLs
        if request.user.is_staff:
            service = BunnyStreamService()
            return service.generate_signed_url(obj.bunny_video.guid)

        # Check enrollment for regular users
        course = obj.module.course
        is_enrolled = course.enrollments.filter(user=request.user).exists()

        # Allow free preview lessons
        if is_enrolled or obj.is_free_preview:
            service = BunnyStreamService()
            return service.generate_signed_url(obj.bunny_video.guid)

        return None


class LessonListSerializer(serializers.ModelSerializer):
    """Lighter serializer for lesson list (no full content)."""
    has_video = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'duration_minutes',
            'order', 'is_free_preview', 'has_video'
        ]

    def get_has_video(self, obj):
        return bool(obj.video_url) or (obj.bunny_video and obj.bunny_video.status == 'ready')


class LessonWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating lessons (staff only)."""
    slug = serializers.SlugField(required=False, allow_blank=True)
    bunny_video_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    bunny_video = BunnyVideoSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'blocks', 'video_url',
            'bunny_video', 'bunny_video_id',
            'duration_minutes', 'order', 'is_free_preview'
        ]
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        bunny_video_id = validated_data.pop('bunny_video_id', None)

        # If bunny_video_id is explicitly set
        if bunny_video_id is not None:
            try:
                bunny_video = BunnyVideo.objects.get(id=bunny_video_id)
                instance.bunny_video = bunny_video
                # Clear external URL when using Bunny
                instance.video_url = ''
            except BunnyVideo.DoesNotExist:
                pass
        elif bunny_video_id is None and 'video_url' in validated_data and validated_data['video_url']:
            # Clear Bunny video when using external URL
            instance.bunny_video = None

        return super().update(instance, validated_data)

    def create(self, validated_data):
        bunny_video_id = validated_data.pop('bunny_video_id', None)
        instance = super().create(validated_data)

        if bunny_video_id:
            try:
                bunny_video = BunnyVideo.objects.get(id=bunny_video_id)
                instance.bunny_video = bunny_video
                instance.video_url = ''
                instance.save()
            except BunnyVideo.DoesNotExist:
                pass

        return instance


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer for module with nested lessons."""
    lessons = LessonListSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'lessons']


class CourseListSerializer(serializers.ModelSerializer):
    """Serializer for course list view."""
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)
    tags = CourseTagSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'total_lessons', 'total_duration_minutes',
            'difficulty', 'learning_objectives', 'tags', 'created_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail with nested modules."""
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)
    tags = CourseTagSerializer(many=True, read_only=True)
    prerequisites = CoursePrerequisiteSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'total_lessons',
            'total_duration_minutes', 'modules', 'difficulty', 'learning_objectives',
            'tags', 'prerequisites', 'created_at', 'updated_at'
        ]


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for enrollment with nested course info."""
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'enrolled_at', 'saleor_order_id']


class EnrollmentCheckSerializer(serializers.Serializer):
    """Simple serializer to check if user is enrolled."""
    is_enrolled = serializers.BooleanField()
    course_slug = serializers.CharField()


# ============ Staff Write Serializers ============

class ModuleWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating modules (staff only)."""

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order']
        read_only_fields = ['id']


class CourseWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses (staff only)."""
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    tags = CourseTagSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'status',
            'difficulty', 'learning_objectives', 'tags', 'tag_ids'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        course = Course.objects.create(**validated_data)
        if tag_ids:
            course.tags.set(tag_ids)
        return course

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance


class CourseFullSerializer(serializers.ModelSerializer):
    """Full course serializer for CMS (includes all fields + nested data)."""
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)
    tags = CourseTagSerializer(many=True, read_only=True)
    prerequisites = CoursePrerequisiteSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'status', 'total_lessons',
            'total_duration_minutes', 'modules', 'difficulty', 'learning_objectives',
            'tags', 'prerequisites', 'created_at', 'updated_at'
        ]


class ReorderItemSerializer(serializers.Serializer):
    """Serializer for reorder requests."""
    id = serializers.IntegerField()
    order = serializers.IntegerField()


class ReorderModulesSerializer(serializers.Serializer):
    """Serializer for reordering modules."""
    modules = ReorderItemSerializer(many=True)


class ReorderLessonsSerializer(serializers.Serializer):
    """Serializer for reordering lessons within a module."""
    module_id = serializers.IntegerField()
    lessons = ReorderItemSerializer(many=True)


# ============ Progress Tracking Serializers ============

class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for individual lesson progress."""

    class Meta:
        model = LessonProgress
        fields = ['completed', 'video_position_seconds', 'completed_at', 'updated_at']
        read_only_fields = ['completed_at', 'updated_at']


class LessonProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating lesson progress."""
    completed = serializers.BooleanField(required=False)
    video_position_seconds = serializers.IntegerField(required=False, min_value=0)


class CourseProgressSerializer(serializers.Serializer):
    """Serializer for course progress summary."""
    completed_lesson_ids = serializers.ListField(child=serializers.IntegerField())
    total_lessons = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    percentage = serializers.IntegerField()
    next_lesson_slug = serializers.CharField(allow_null=True)
    lesson_progress = serializers.DictField()
