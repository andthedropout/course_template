from django.contrib import admin
from .models import Course, Module, Lesson, Enrollment


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ['title', 'slug', 'order', 'duration_minutes', 'is_free_preview', 'video_url']
    prepopulated_fields = {'slug': ('title',)}


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 1
    fields = ['title', 'order', 'description']
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'saleor_product_id', 'total_lessons', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'description', 'saleor_product_id']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ModuleInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description', 'thumbnail_url')
        }),
        ('Saleor Integration', {
            'fields': ('saleor_product_id',)
        }),
        ('Publishing', {
            'fields': ('status',)
        }),
    )


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'lesson_count']
    list_filter = ['course']
    search_fields = ['title', 'course__title']
    inlines = [LessonInline]

    def lesson_count(self, obj):
        return obj.lessons.count()
    lesson_count.short_description = 'Lessons'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'order', 'duration_minutes', 'is_free_preview']
    list_filter = ['module__course', 'is_free_preview']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'enrolled_at', 'saleor_order_id']
    list_filter = ['course', 'enrolled_at']
    search_fields = ['user__username', 'user__email', 'course__title', 'saleor_order_id']
    raw_id_fields = ['user', 'course']
    readonly_fields = ['enrolled_at']
