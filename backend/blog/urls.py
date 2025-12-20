from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CategoryViewSet, TagViewSet, upload_blog_image, list_blog_images
from . import seo_views

router = DefaultRouter()
router.register('posts', PostViewSet, basename='post')
router.register('categories', CategoryViewSet, basename='category')
router.register('tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    path('images/', list_blog_images, name='blog-list-images'),
    path('upload-image/', upload_blog_image, name='blog-upload-image'),
    path('sitemap.xml', seo_views.sitemap, name='blog-sitemap'),
    path('feed.xml', seo_views.rss_feed, name='blog-rss'),
]
