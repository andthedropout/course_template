from rest_framework import serializers
from django.utils import timezone
from .models import Post, Category, Tag
from .utils import parse_markdown_components


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class TagSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class PostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for post listings"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    featured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image_url',
            'author_name', 'status', 'publish_date', 'reading_time', 'view_count',
            'categories', 'tags', 'featured'
        ]

    def get_featured_image_url(self, obj):
        return obj.featured_image if obj.featured_image else None


class PostDetailSerializer(serializers.ModelSerializer):
    """Full serializer with parsed content"""
    author = serializers.SerializerMethodField()
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    content_parsed = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content_parsed', 'excerpt',
            'featured_image_url', 'og_image_url', 'full_width_image',
            'hero_background_type', 'hero_background_opacity', 'hero_background_scope', 'hero_background_size', 'hero_background_tile_size',
            'author', 'publish_date', 'status',
            'updated_at', 'reading_time', 'view_count', 'categories', 'tags',
            'meta_title', 'meta_description', 'meta_keywords', 'focus_keyword', 'canonical_url'
        ]

    def get_author(self, obj):
        return {
            'name': obj.author.get_full_name() or obj.author.username,
            'email': obj.author.email,
            'username': obj.author.username,
        }

    def get_content_parsed(self, obj):
        """Parse markdown and return HTML + components"""
        return parse_markdown_components(obj.content)

    def get_featured_image_url(self, obj):
        return obj.featured_image if obj.featured_image else None

    def get_og_image_url(self, obj):
        if obj.og_image:
            return obj.og_image
        elif obj.featured_image:
            return obj.featured_image
        return None


# ============================================================================
# Write Serializers for CMS
# ============================================================================

class CategoryWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating categories"""

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'parent', 'order']
        extra_kwargs = {
            'slug': {'required': False},  # Auto-generated if not provided
        }


class TagWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tags"""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        extra_kwargs = {
            'slug': {'required': False},  # Auto-generated if not provided
        }


class PostWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating posts"""
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    # Allow both file uploads and URL strings for images
    featured_image_upload = serializers.ImageField(write_only=True, required=False)
    og_image_upload = serializers.ImageField(write_only=True, required=False)

    # Read-only fields for response
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    content_parsed = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'content_parsed', 'excerpt',
            'featured_image', 'og_image', 'featured_image_upload', 'og_image_upload',
            'featured_image_url', 'og_image_url', 'full_width_image',
            'hero_background_type', 'hero_background_opacity', 'hero_background_scope', 'hero_background_size', 'hero_background_tile_size',
            'status', 'publish_date', 'featured', 'allow_comments',
            'meta_title', 'meta_description', 'meta_keywords', 'focus_keyword', 'canonical_url',
            'category_ids', 'tag_ids', 'categories', 'tags',
            'author', 'author_name', 'reading_time', 'view_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['reading_time', 'view_count', 'created_at', 'updated_at', 'author_name', 'content_parsed', 'author', 'featured_image_url', 'og_image_url']
        extra_kwargs = {
            'slug': {'required': False},  # Auto-generated if not provided
            'content': {'required': False},  # Can be empty for drafts
            'excerpt': {'required': False},  # Auto-generated if empty
            'featured_image': {'required': False},  # URL or uploaded
            'og_image': {'required': False},  # URL or uploaded
        }

    def get_author(self, obj):
        """Return author details for viewing"""
        if obj.author:
            return {
                'name': obj.author.get_full_name() or obj.author.username,
                'email': obj.author.email,
                'username': obj.author.username,
            }
        return None

    def get_content_parsed(self, obj):
        """Parse markdown and return HTML + components for viewing"""
        return parse_markdown_components(obj.content)

    def get_featured_image_url(self, obj):
        return obj.featured_image if obj.featured_image else None

    def get_og_image_url(self, obj):
        if obj.og_image:
            return obj.og_image
        elif obj.featured_image:
            return obj.featured_image
        return None

    def validate(self, data):
        """
        Validate that published/scheduled posts have required fields
        """
        status = data.get('status', None)

        # If publishing, ensure required fields are present
        if status == 'published':
            # Check content for both create and update operations
            content = data.get('content')
            if not content:
                # If updating, check if instance has content
                if self.instance and self.instance.content:
                    # Instance has content, allow update
                    pass
                else:
                    # No content in data or instance
                    raise serializers.ValidationError({
                        'content': 'Content is required for published posts.'
                    })

            # Set publish_date to now if not provided
            if not data.get('publish_date'):
                data['publish_date'] = timezone.now()

        # If scheduling, require publish_date to be set and in the future
        if status == 'scheduled':
            publish_date = data.get('publish_date')

            if not publish_date:
                raise serializers.ValidationError({
                    'publish_date': 'Publish date is required for scheduled posts.'
                })

            # Validate publish_date is in the future
            if publish_date <= timezone.now():
                raise serializers.ValidationError({
                    'publish_date': 'Publish date must be in the future for scheduled posts.'
                })

        return data

    def create(self, validated_data):
        """
        Create post with author and handle M2M relationships
        """
        # Extract M2M data
        category_ids = validated_data.pop('category_ids', [])
        tag_ids = validated_data.pop('tag_ids', [])

        # Handle image uploads
        featured_image_upload = validated_data.pop('featured_image_upload', None)
        og_image_upload = validated_data.pop('og_image_upload', None)

        # Set author from request user
        validated_data['author'] = self.context['request'].user

        # Handle image uploads - save files and store URLs
        if featured_image_upload:
            from .views import save_uploaded_image
            validated_data['featured_image'] = save_uploaded_image(
                featured_image_upload,
                self.context['request'].user
            )

        if og_image_upload:
            from .views import save_uploaded_image
            validated_data['og_image'] = save_uploaded_image(
                og_image_upload,
                self.context['request'].user
            )

        # Create post
        post = Post.objects.create(**validated_data)

        # Set M2M relationships
        if category_ids:
            post.categories.set(category_ids)
        if tag_ids:
            post.tags.set(tag_ids)

        return post

    def update(self, instance, validated_data):
        """
        Update post and handle M2M relationships
        """
        # Extract M2M data
        category_ids = validated_data.pop('category_ids', None)
        tag_ids = validated_data.pop('tag_ids', None)

        # Handle image uploads
        featured_image_upload = validated_data.pop('featured_image_upload', None)
        og_image_upload = validated_data.pop('og_image_upload', None)

        # Handle image uploads - save files and store URLs
        if featured_image_upload:
            from .views import save_uploaded_image
            validated_data['featured_image'] = save_uploaded_image(
                featured_image_upload,
                self.context['request'].user
            )

        if og_image_upload:
            from .views import save_uploaded_image
            validated_data['og_image'] = save_uploaded_image(
                og_image_upload,
                self.context['request'].user
            )

        # Update regular fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update M2M relationships if provided
        if category_ids is not None:
            instance.categories.set(category_ids)
        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance
