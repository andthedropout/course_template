from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
from django.db import models
from datetime import datetime
import os
import uuid
from .models import Post, Category, Tag, BlogImage
from .serializers import (
    PostListSerializer, PostDetailSerializer, PostWriteSerializer,
    CategorySerializer, CategoryWriteSerializer,
    TagSerializer, TagWriteSerializer
)
from .permissions import IsStaffUser, IsAuthorOrStaff


def save_uploaded_image(image_file, user):
    """
    Helper function to save an uploaded image and return its URL
    Used by serializers for featured/og image uploads
    """
    # Generate unique filename
    file_ext = os.path.splitext(image_file.name)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # Create upload path: blog/uploads/YYYY/MM/
    now = datetime.now()
    upload_path = os.path.join('blog', 'uploads', str(now.year), f"{now.month:02d}")

    # Full path for storage
    file_path = os.path.join(upload_path, unique_filename)

    # Save file
    saved_path = default_storage.save(file_path, image_file)

    # Return URL
    file_url = f"{settings.MEDIA_URL}{saved_path}"

    # Save to BlogImage model for tracking
    BlogImage.objects.create(
        url=file_url,
        alt_text='',  # No alt text for inline uploads
        filename=unique_filename,
        size=image_file.size,
        uploaded_by=user
    )

    return file_url


class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoints for blog posts

    Public endpoints (no auth required):
    GET /api/v1/blog/posts/              - List published posts
    GET /api/v1/blog/posts/<slug>/       - Post detail
    POST /api/v1/blog/posts/<slug>/view/ - Increment view count

    Staff-only endpoints (requires staff user):
    POST /api/v1/blog/posts/                  - Create post
    PUT/PATCH /api/v1/blog/posts/<slug>/      - Update post
    DELETE /api/v1/blog/posts/<slug>/         - Delete post
    GET /api/v1/blog/posts/drafts/            - List user's drafts
    GET /api/v1/blog/posts/all_posts/         - List all posts (staff only)
    """
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['publish_date', 'view_count', 'created_at', 'updated_at']
    ordering = ['-created_at']  # Default to most recent first
    permission_classes = [IsAuthenticatedOrReadOnly, IsStaffUser, IsAuthorOrStaff]

    def get_queryset(self):
        """
        Return published posts for public users,
        all posts for staff users in list view
        """
        user = self.request.user

        # For detail view, allow staff to view any post, public users only published
        if self.action == 'retrieve':
            if user.is_authenticated and user.is_staff:
                queryset = Post.objects.all()
            else:
                queryset = Post.objects.filter(
                    status='published',
                    publish_date__lte=timezone.now()
                )
        # For list view, staff sees all posts, public sees only published
        else:
            if user.is_authenticated and user.is_staff:
                queryset = Post.objects.all()
            else:
                queryset = Post.objects.filter(
                    status='published',
                    publish_date__lte=timezone.now()
                )

        queryset = queryset.select_related('author').prefetch_related('categories', 'tags')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)

        # Filter by tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)

        # Featured only
        featured = self.request.query_params.get('featured')
        if featured:
            queryset = queryset.filter(featured=True)

        # Status filter (staff only) - filters the existing queryset
        if user.is_authenticated and user.is_staff:
            status_filter = self.request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

        return queryset

    def get_serializer_class(self):
        """Use write serializer for create/update, read serializers for read operations"""
        if self.action in ['create', 'update', 'partial_update']:
            return PostWriteSerializer
        elif self.action == 'retrieve':
            # Staff users get write serializer (includes raw content for editing)
            is_authenticated = self.request.user.is_authenticated
            is_staff = self.request.user.is_staff if is_authenticated else False

            if is_authenticated and is_staff:
                return PostWriteSerializer
            return PostDetailSerializer
        return PostListSerializer

    @action(detail=True, methods=['post'], permission_classes=[])
    def view(self, request, slug=None):
        """Increment view count (public endpoint)"""
        post = self.get_object()
        post.view_count += 1
        post.save(update_fields=['view_count'])
        return Response({'view_count': post.view_count})

    @action(detail=True, methods=['get'], permission_classes=[])
    def related(self, request, slug=None):
        """Get related posts (public endpoint)"""
        post = self.get_object()

        # Get posts that share categories or tags with this post
        related_posts = Post.objects.filter(
            status='published',
            publish_date__lte=timezone.now()
        ).exclude(
            id=post.id
        ).filter(
            models.Q(categories__in=post.categories.all()) |
            models.Q(tags__in=post.tags.all())
        ).distinct().select_related('author').prefetch_related('categories', 'tags')[:6]

        serializer = PostListSerializer(related_posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly, IsStaffUser])
    def drafts(self, request):
        """List user's draft posts (staff only)"""
        queryset = Post.objects.filter(
            author=request.user,
            status='draft'
        ).select_related('author').prefetch_related('categories', 'tags').order_by('-updated_at')

        serializer = PostListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly, IsStaffUser])
    def all_posts(self, request):
        """List all posts regardless of status (staff only)"""
        queryset = Post.objects.all().select_related('author').prefetch_related('categories', 'tags').order_by('-updated_at')

        # Allow filtering by status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Allow filtering by author
        author = request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username=author)

        serializer = PostListSerializer(queryset, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoints for categories

    GET /api/v1/blog/categories/       - List categories
    GET /api/v1/blog/categories/<id>/  - Category detail

    Staff-only:
    POST /api/v1/blog/categories/           - Create category
    PUT/PATCH /api/v1/blog/categories/<id>/ - Update category
    DELETE /api/v1/blog/categories/<id>/    - Delete category
    """
    queryset = Category.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsStaffUser]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoryWriteSerializer
        return CategorySerializer


class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoints for tags

    GET /api/v1/blog/tags/       - List tags
    GET /api/v1/blog/tags/<id>/  - Tag detail

    Staff-only:
    POST /api/v1/blog/tags/           - Create tag
    PUT/PATCH /api/v1/blog/tags/<id>/ - Update tag
    DELETE /api/v1/blog/tags/<id>/    - Delete tag
    """
    queryset = Tag.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsStaffUser]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TagWriteSerializer
        return TagSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly, IsStaffUser])
def list_blog_images(request):
    """
    List all uploaded blog images

    GET /api/v1/blog/images/

    Returns: [{'id': 1, 'url': '...', 'alt_text': '...', 'filename': '...', 'size': 123}]
    """
    images = BlogImage.objects.all().order_by('-created_at')

    data = [{
        'id': img.id,
        'url': img.url,
        'alt_text': img.alt_text,
        'filename': img.filename,
        'size': img.size,
        'created_at': img.created_at.isoformat()
    } for img in images]

    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly, IsStaffUser])
def upload_blog_image(request):
    """
    Upload image for blog posts (featured images, OG images, or content images)

    POST /api/v1/blog/upload-image/
    Body: multipart/form-data with 'image' file and optional 'alt_text'

    Returns: {'url': '/media/blog/uploads/2024/01/uuid-filename.jpg', 'alt_text': '...'}
    """
    if 'image' not in request.FILES:
        return Response(
            {'error': 'No image file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    image_file = request.FILES['image']
    alt_text = request.data.get('alt_text', '')

    # Validate file extension
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    file_ext = os.path.splitext(image_file.name)[1].lower()

    if file_ext not in allowed_extensions:
        return Response(
            {'error': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if image_file.size > max_size:
        return Response(
            {'error': 'File size exceeds 10MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # Create upload path: blog/uploads/YYYY/MM/
    from datetime import datetime
    now = datetime.now()
    upload_path = os.path.join('blog', 'uploads', str(now.year), f"{now.month:02d}")

    # Full path for storage
    file_path = os.path.join(upload_path, unique_filename)

    # Save file
    saved_path = default_storage.save(file_path, image_file)

    # Return URL
    file_url = f"{settings.MEDIA_URL}{saved_path}"

    # Save to BlogImage model for tracking
    blog_image = BlogImage.objects.create(
        url=file_url,
        alt_text=alt_text,
        filename=unique_filename,
        size=image_file.size,
        uploaded_by=request.user
    )

    return Response({
        'url': file_url,
        'filename': unique_filename,
        'size': image_file.size,
        'alt_text': alt_text,
        'id': blog_image.id
    }, status=status.HTTP_201_CREATED)
