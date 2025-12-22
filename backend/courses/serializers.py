from rest_framework import serializers
from .models import Course, Module, Lesson, Enrollment, LessonProgress


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lesson data (read)."""

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'content', 'blocks', 'video_url',
            'duration_minutes', 'order', 'is_free_preview'
        ]


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
        return bool(obj.video_url)


class LessonWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating lessons (staff only)."""
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'blocks', 'video_url',
            'duration_minutes', 'order', 'is_free_preview'
        ]
        read_only_fields = ['id']


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

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'total_lessons', 'total_duration_minutes', 'created_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail with nested modules."""
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'total_lessons',
            'total_duration_minutes', 'modules', 'created_at', 'updated_at'
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

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'status'
        ]
        read_only_fields = ['id']


class CourseFullSerializer(serializers.ModelSerializer):
    """Full course serializer for CMS (includes all fields + nested data)."""
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'thumbnail_url', 'saleor_product_id', 'status', 'total_lessons',
            'total_duration_minutes', 'modules', 'created_at', 'updated_at'
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
