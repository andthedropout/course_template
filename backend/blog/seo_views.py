from django.http import HttpResponse
from django.utils import timezone
from .models import Post, Category, Tag


def sitemap(request):
    """Auto-generated XML sitemap"""
    posts = Post.objects.filter(
        status='published',
        publish_date__lte=timezone.now()
    ).order_by('-updated_at')

    categories = Category.objects.all()
    tags = Tag.objects.all()

    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    # Blog index
    xml.append('<url>')
    xml.append(f'<loc>{request.build_absolute_uri("/blog")}</loc>')
    xml.append('<changefreq>daily</changefreq>')
    xml.append('<priority>1.0</priority>')
    xml.append('</url>')

    # Individual posts
    for post in posts:
        xml.append('<url>')
        xml.append(f'<loc>{request.build_absolute_uri(f"/blog/{post.slug}")}</loc>')
        xml.append(f'<lastmod>{post.updated_at.strftime("%Y-%m-%d")}</lastmod>')
        xml.append('<changefreq>weekly</changefreq>')
        xml.append('<priority>0.8</priority>')
        xml.append('</url>')

    # Category pages
    for category in categories:
        xml.append('<url>')
        xml.append(f'<loc>{request.build_absolute_uri(f"/blog/category/{category.slug}")}</loc>')
        xml.append('<changefreq>weekly</changefreq>')
        xml.append('<priority>0.6</priority>')
        xml.append('</url>')

    # Tag pages
    for tag in tags:
        xml.append('<url>')
        xml.append(f'<loc>{request.build_absolute_uri(f"/blog/tag/{tag.slug}")}</loc>')
        xml.append('<changefreq>weekly</changefreq>')
        xml.append('<priority>0.5</priority>')
        xml.append('</url>')

    xml.append('</urlset>')

    return HttpResponse('\n'.join(xml), content_type='application/xml')


def rss_feed(request):
    """RSS feed for last 50 posts"""
    from django.utils.feedgenerator import Rss201rev2Feed

    posts = Post.objects.filter(
        status='published',
        publish_date__lte=timezone.now()
    ).order_by('-publish_date')[:50]

    feed = Rss201rev2Feed(
        title="GaggleHome Blog",
        link=request.build_absolute_uri('/blog'),
        description="Latest posts from GaggleHome",
        language="en",
    )

    for post in posts:
        feed.add_item(
            title=post.title,
            link=request.build_absolute_uri(f'/blog/{post.slug}'),
            description=post.excerpt,
            pubdate=post.publish_date,
            unique_id=f'tag:gagglehome.com,{post.publish_date.strftime("%Y-%m-%d")}:{post.slug}',
        )

    return HttpResponse(feed.writeString('utf-8'), content_type='application/rss+xml')
