from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.text import slugify
from markdownx.models import MarkdownxField

User = get_user_model()


class Category(models.Model):
    """Blog categories (5-10 max, hierarchical)"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children'
    )
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    """Blog tags (granular topics)"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Post(models.Model):
    """Main blog post model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('scheduled', 'Scheduled'),
        ('archived', 'Archived')
    ]

    # Content
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=255)
    content = MarkdownxField()  # Markdown with custom syntax
    excerpt = models.TextField(
        max_length=300,
        blank=True,
        help_text="Brief summary (auto-generated if empty)"
    )

    # Media (store URLs instead of files for flexibility)
    featured_image = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="URL to featured image (upload or select from library)"
    )
    og_image = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="URL to OG image (upload or select from library, auto-uses featured if empty)"
    )
    full_width_image = models.BooleanField(
        default=True,
        help_text="Display featured image at full width (vs constrained width)"
    )
    hero_background_type = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Animated background type for hero section (e.g., 'clouds', 'waves', leave empty for none)"
    )
    hero_background_opacity = models.FloatField(
        default=0.6,
        help_text="Background opacity (0.0-1.0)"
    )
    hero_background_scope = models.CharField(
        max_length=20,
        choices=[('hero', 'Hero Section Only'), ('full', 'Full Page')],
        default='hero',
        help_text="Apply background to hero section only or entire page"
    )
    hero_background_size = models.CharField(
        max_length=20,
        choices=[
            ('cover', 'Cover (stretch to fill)'),
            ('contain', 'Contain (fit without cropping)'),
            ('tile', 'Tile (repeat pattern)')
        ],
        default='cover',
        help_text="How the background should scale and display"
    )
    hero_background_tile_size = models.IntegerField(
        default=800,
        help_text="Tile size in pixels (100-2000)"
    )

    # Publishing
    author = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='blog_posts'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    publish_date = models.DateTimeField(null=True, blank=True)

    # SEO
    meta_title = models.CharField(
        max_length=70,
        blank=True,
        help_text="SEO title (auto-uses title if empty)"
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        help_text="Meta description for search engines"
    )
    meta_keywords = models.CharField(max_length=255, blank=True)
    focus_keyword = models.CharField(
        max_length=100,
        blank=True,
        help_text="Primary keyword for SEO analysis"
    )
    canonical_url = models.URLField(
        blank=True,
        help_text="Canonical URL if content published elsewhere first"
    )

    # Taxonomy
    categories = models.ManyToManyField(Category, blank=True, related_name='posts')
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')

    # Computed/Analytics
    reading_time = models.IntegerField(default=1, help_text="Auto-calculated")
    view_count = models.IntegerField(default=0)

    # Features
    featured = models.BooleanField(default=False, help_text="Show in featured section")
    allow_comments = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-publish_date', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'publish_date']),
            models.Index(fields=['-publish_date']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-generate slug from title
        if not self.slug:
            self.slug = slugify(self.title)

        # Auto-calculate reading time
        self.reading_time = self._calculate_reading_time()

        # Auto-generate excerpt if empty
        if not self.excerpt:
            self.excerpt = self._generate_excerpt()

        # Set publish_date if publishing for first time
        if self.status == 'published' and not self.publish_date:
            self.publish_date = timezone.now()

        super().save(*args, **kwargs)

    def _calculate_reading_time(self):
        """228 words per minute average"""
        from markdown import markdown
        from bs4 import BeautifulSoup

        # Convert markdown to HTML, strip tags, count words
        html = markdown(self.content)
        text = BeautifulSoup(html, 'html.parser').get_text()
        word_count = len(text.split())
        minutes = max(1, round(word_count / 228))
        return minutes

    def _generate_excerpt(self):
        """First 300 chars of content (plain text)"""
        from markdown import markdown
        from bs4 import BeautifulSoup

        html = markdown(self.content)
        text = BeautifulSoup(html, 'html.parser').get_text()
        return text[:297] + '...' if len(text) > 300 else text


class PostMeta(models.Model):
    """Extensible metadata for future features (skills, jobs, etc.)"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='metadata')
    key = models.CharField(max_length=100, db_index=True)
    value = models.TextField()  # JSON string for complex data

    class Meta:
        unique_together = [['post', 'key']]
        indexes = [
            models.Index(fields=['post', 'key']),
        ]
        verbose_name_plural = 'Post Metadata'

    def __str__(self):
        return f"{self.post.title} - {self.key}"


class BlogImage(models.Model):
    """Track uploaded blog images with metadata for SEO"""
    url = models.CharField(max_length=500, unique=True)
    alt_text = models.CharField(max_length=200, blank=True, help_text="Alt text for SEO and accessibility")
    filename = models.CharField(max_length=255)
    size = models.IntegerField(help_text="File size in bytes")
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_images'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.filename
