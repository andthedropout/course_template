from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from blog.models import Category, Tag, Post

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates sample blog data for testing'

    def handle(self, *args, **kwargs):
        # Get or create a superuser
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            user.set_password('admin')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create categories
        categories_data = [
            {'name': 'Technology', 'description': 'Latest tech trends and innovations'},
            {'name': 'Web Development', 'description': 'Frontend, backend, and full-stack development'},
            {'name': 'AI & Machine Learning', 'description': 'Artificial intelligence and ML topics'},
        ]

        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories.append(category)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created category: {category.name}'))

        # Create tags
        tags_data = ['React', 'Django', 'Python', 'JavaScript', 'TypeScript', 'AI', 'Tutorial']
        tags = []
        for tag_name in tags_data:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tags.append(tag)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created tag: {tag.name}'))

        # Create sample posts
        posts_data = [
            {
                'title': 'Getting Started with TanStack Router',
                'content': '''# TanStack Router Guide

Welcome to this comprehensive guide on **TanStack Router**!

## What is TanStack Router?

TanStack Router is a powerful routing solution for React applications that provides:

- Type-safe routing
- Server-side rendering (SSR) support
- File-based routing
- Built-in data loading

## Example Usage

Here's how you can create a basic route:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})
```

## Custom Components

You can embed YouTube videos like this:

{{youtube:dQw4w9WgXcQ}}

## Conclusion

TanStack Router makes building modern React apps easier and more type-safe!
''',
                'status': 'published',
                'featured': True,
                'categories_indexes': [0, 1],
                'tags_indexes': [0, 3, 4],
            },
            {
                'title': 'Building a Blog with Django REST Framework',
                'content': '''# Django REST Framework Blog Tutorial

Learn how to build a powerful blog system using **Django REST Framework**.

## Features We'll Build

1. Markdown support
2. Custom components
3. SEO optimization
4. Category and tag system

## Custom Image Component

You can add images with custom syntax:

{{image:/media/blog/example.jpg|alt=Example Image}}

## Database Models

Here's our Post model structure:

- Title and slug
- Markdown content
- Publishing workflow
- SEO metadata
- View count tracking

## Next Steps

Stay tuned for part 2 where we cover the frontend implementation!
''',
                'status': 'published',
                'featured': False,
                'categories_indexes': [1],
                'tags_indexes': [1, 2, 6],
            },
            {
                'title': 'The Future of AI in Web Development',
                'content': '''# AI in Web Development

Artificial Intelligence is revolutionizing how we build web applications.

## Current Trends

- AI-powered code completion
- Automated testing
- Smart design systems
- Content generation

## Practical Applications

AI can help with:

1. **Code Review**: Automated code quality checks
2. **Bug Detection**: Finding issues before they reach production
3. **Performance Optimization**: Suggesting better algorithms
4. **Accessibility**: Ensuring WCAG compliance

## Looking Ahead

The future of web development will be increasingly AI-assisted, but human creativity remains irreplaceable.
''',
                'status': 'published',
                'featured': True,
                'categories_indexes': [0, 2],
                'tags_indexes': [5],
            },
        ]

        for post_data in posts_data:
            post, created = Post.objects.get_or_create(
                title=post_data['title'],
                defaults={
                    'content': post_data['content'],
                    'author': user,
                    'status': post_data['status'],
                    'featured': post_data['featured'],
                    'publish_date': timezone.now(),
                }
            )
            if created:
                # Add categories
                for idx in post_data.get('categories_indexes', []):
                    post.categories.add(categories[idx])

                # Add tags
                for idx in post_data.get('tags_indexes', []):
                    post.tags.add(tags[idx])

                self.stdout.write(self.style.SUCCESS(f'Created post: {post.title}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Sample blog data created successfully!'))
