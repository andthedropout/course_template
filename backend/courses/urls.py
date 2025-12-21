from django.urls import path
from . import views
from . import webhooks

urlpatterns = [
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

    # Enrollment
    path('my-enrollments/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
    path('<slug:slug>/check-enrollment/', views.check_enrollment, name='check-enrollment'),

    # Webhook for Saleor order events
    path('webhooks/saleor/', webhooks.saleor_order_webhook, name='saleor-webhook'),
]
