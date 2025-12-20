from django.contrib import admin
from markdownx.admin import MarkdownxModelAdmin
from .models import Post, Category, Tag, PostMeta, BlogImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'order']
    prepopulated_fields = {'slug': ('name',)}
    list_filter = ['parent']
    ordering = ['order', 'name']
    search_fields = ['name', 'description']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    ordering = ['name']


class PostMetaInline(admin.TabularInline):
    model = PostMeta
    extra = 0
    fields = ['key', 'value']


@admin.register(Post)
class PostAdmin(MarkdownxModelAdmin):  # Enables markdown editor
    list_display = ['title', 'author', 'status', 'publish_date', 'view_count', 'reading_time', 'featured']
    list_filter = ['status', 'featured', 'categories', 'created_at', 'publish_date']
    search_fields = ['title', 'content', 'excerpt']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['categories', 'tags']
    inlines = [PostMetaInline]
    date_hierarchy = 'publish_date'

    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'content', 'excerpt', 'featured_image', 'full_width_image', 'hero_background_type', 'hero_background_opacity', 'hero_background_scope', 'hero_background_size', 'hero_background_tile_size')
        }),
        ('Publishing', {
            'fields': ('author', 'status', 'publish_date', 'featured', 'allow_comments')
        }),
        ('Taxonomy', {
            'fields': ('categories', 'tags')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords', 'focus_keyword', 'og_image', 'canonical_url'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('reading_time', 'view_count'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['reading_time', 'view_count']

    def save_model(self, request, obj, form, change):
        if not obj.author_id:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(BlogImage)
class BlogImageAdmin(admin.ModelAdmin):
    list_display = ['filename', 'alt_text', 'size_display', 'uploaded_by', 'created_at']
    list_filter = ['uploaded_by', 'created_at']
    search_fields = ['filename', 'alt_text', 'url']
    readonly_fields = ['url', 'filename', 'size', 'uploaded_by', 'created_at']

    def size_display(self, obj):
        if obj.size < 1024:
            return f"{obj.size} B"
        elif obj.size < 1024 * 1024:
            return f"{obj.size / 1024:.1f} KB"
        return f"{obj.size / (1024 * 1024):.1f} MB"
    size_display.short_description = 'Size'
