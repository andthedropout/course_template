from django.urls import path
from . import views
from . import webhooks

urlpatterns = [
    # Enrollment (must come before slug routes)
    path('my-enrollments/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),

    # Webhook for Saleor order events
    path('webhooks/saleor/', webhooks.saleor_order_webhook, name='saleor-webhook'),

    # ============ Staff CMS Routes ============
    path('cms/', views.StaffCourseListCreateView.as_view(), name='staff-course-list'),
    path('cms/<slug:slug>/', views.StaffCourseDetailView.as_view(), name='staff-course-detail'),
    path('cms/<slug:course_slug>/modules/', views.StaffModuleListCreateView.as_view(), name='staff-module-list'),
    path('cms/<slug:course_slug>/modules/<int:module_id>/', views.StaffModuleDetailView.as_view(), name='staff-module-detail'),
    path('cms/<slug:course_slug>/modules/<int:module_id>/lessons/', views.StaffLessonListCreateView.as_view(), name='staff-lesson-list'),
    path('cms/<slug:course_slug>/lessons/<slug:lesson_slug>/', views.StaffLessonDetailView.as_view(), name='staff-lesson-detail'),
    path('cms/<slug:course_slug>/reorder-modules/', views.ReorderModulesView.as_view(), name='reorder-modules'),
    path('cms/<slug:course_slug>/reorder-lessons/', views.ReorderLessonsView.as_view(), name='reorder-lessons'),
    path('cms/<slug:course_slug>/prerequisites/', views.add_course_prerequisite, name='add-prerequisite'),
    path('cms/<slug:course_slug>/prerequisites/<int:prerequisite_id>/', views.remove_course_prerequisite, name='remove-prerequisite'),

    # ============ Bunny Stream Video Routes (Staff) ============
    path('videos/', views.list_bunny_videos, name='bunny-video-list'),
    path('videos/upload/', views.create_bunny_upload, name='bunny-upload-init'),
    path('videos/<int:video_id>/confirm/', views.confirm_bunny_upload, name='bunny-upload-confirm'),
    path('videos/<int:video_id>/status/', views.check_video_status, name='bunny-video-status'),
    path('videos/<int:video_id>/thumbnail/', views.get_video_thumbnail, name='bunny-video-thumbnail'),
    path('videos/<int:video_id>/', views.delete_bunny_video, name='bunny-video-delete'),

    # ============ Public Routes ============
    # Course list and detail
    path('', views.CourseListView.as_view(), name='course-list'),
    path('<slug:slug>/', views.CourseDetailView.as_view(), name='course-detail'),

    # Course structure (for navigation sidebar)
    path('<slug:slug>/structure/', views.course_structure, name='course-structure'),

    # Lessons
    path('<slug:slug>/lessons/', views.CourseLessonsView.as_view(), name='course-lessons'),
    path(
        '<slug:course_slug>/lessons/<slug:lesson_slug>/',
        views.LessonDetailView.as_view(),
        name='lesson-detail'
    ),

    # Enrollment check
    path('<slug:slug>/check-enrollment/', views.check_enrollment, name='check-enrollment'),

    # Progress tracking
    path('<slug:course_slug>/progress/', views.get_course_progress, name='course-progress'),
    path(
        '<slug:course_slug>/lessons/<slug:lesson_slug>/progress/',
        views.update_lesson_progress,
        name='lesson-progress'
    ),
]
