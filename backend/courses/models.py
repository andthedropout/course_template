from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from markdownx.models import MarkdownxField

User = get_user_model()


class Course(models.Model):
    """A course that can be purchased through Saleor and accessed by enrolled users."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=255)
    description = MarkdownxField(
        blank=True,
        help_text="Short course description for cards and listings"
    )
    long_description = MarkdownxField(
        blank=True,
        help_text="Detailed course overview - explains modules, structure, prerequisites"
    )
    thumbnail_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="URL to course thumbnail image"
    )
    saleor_product_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="Product ID from Saleor to link purchases"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def total_lessons(self):
        return Lesson.objects.filter(module__course=self).count()

    @property
    def total_duration_minutes(self):
        return Lesson.objects.filter(module__course=self).aggregate(
            total=models.Sum('duration_minutes')
        )['total'] or 0


class Module(models.Model):
    """A module/section within a course containing multiple lessons."""
    course = models.ForeignKey(
        Course,
        related_name='modules',
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Lesson(models.Model):
    """An individual lesson within a module."""
    module = models.ForeignKey(
        Module,
        related_name='lessons',
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, blank=True)
    content = MarkdownxField(
        blank=True,
        help_text="Legacy: Lesson content in Markdown (use blocks instead)"
    )
    blocks = models.JSONField(
        default=list,
        blank=True,
        help_text="Block-based content as JSON array"
    )
    video_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="External video URL (YouTube, Vimeo, Bunny, etc.)"
    )
    duration_minutes = models.IntegerField(
        default=0,
        help_text="Estimated duration in minutes"
    )
    order = models.IntegerField(default=0)
    is_free_preview = models.BooleanField(
        default=False,
        help_text="Allow access without enrollment for preview"
    )

    class Meta:
        ordering = ['order']
        unique_together = ['module', 'slug']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class Enrollment(models.Model):
    """Tracks user enrollment in a course after purchase."""
    user = models.ForeignKey(
        User,
        related_name='enrollments',
        on_delete=models.CASCADE
    )
    course = models.ForeignKey(
        Course,
        related_name='enrollments',
        on_delete=models.CASCADE
    )
    saleor_order_id = models.CharField(
        max_length=100,
        help_text="Order ID from Saleor for reference"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"


class LessonProgress(models.Model):
    """Tracks user progress through individual lessons."""
    user = models.ForeignKey(
        User,
        related_name='lesson_progress',
        on_delete=models.CASCADE
    )
    lesson = models.ForeignKey(
        Lesson,
        related_name='progress',
        on_delete=models.CASCADE
    )

    # Completion tracking
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Video resume position (in seconds)
    video_position_seconds = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'lesson']
        verbose_name_plural = 'Lesson progress'

    def __str__(self):
        status = "✓" if self.completed else "○"
        return f"{status} {self.user.username} - {self.lesson.title}"
