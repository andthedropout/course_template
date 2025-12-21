from rest_framework import serializers
from .models import Course, Module, Lesson, Enrollment


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for lesson data."""

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'content', 'video_url',
            'duration_minutes', 'order', 'is_free_preview'
        ]


class LessonListSerializer(serializers.ModelSerializer):
    """Lighter serializer for lesson list (no full content)."""

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'duration_minutes',
            'order', 'is_free_preview'
        ]


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
            'id', 'title', 'slug', 'description', 'thumbnail_url',
            'total_lessons', 'total_duration_minutes', 'created_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail with nested modules."""
    modules = ModuleSerializer(many=True, read_only=True)
    total_lessons = serializers.IntegerField(read_only=True)
    total_duration_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'thumbnail_url',
            'saleor_product_id', 'total_lessons', 'total_duration_minutes',
            'modules', 'created_at', 'updated_at'
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
