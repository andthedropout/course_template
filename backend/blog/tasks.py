from celery import shared_task
from django.utils import timezone
from .models import Post
import logging

logger = logging.getLogger(__name__)


@shared_task
def publish_scheduled_posts():
    """
    Find all posts with status='scheduled' and publish_date <= now,
    then update their status to 'published'.

    This task should be run periodically via Celery Beat.
    """
    now = timezone.now()

    # Find posts that are scheduled and should be published
    scheduled_posts = Post.objects.filter(
        status='scheduled',
        publish_date__lte=now
    )

    count = scheduled_posts.count()

    if count > 0:
        logger.info(f"Found {count} scheduled post(s) to publish")

        # Update all matching posts to published status
        updated = scheduled_posts.update(status='published')

        # Log each published post for monitoring
        for post in scheduled_posts:
            logger.info(
                f"Published scheduled post: '{post.title}' (slug: {post.slug}, "
                f"scheduled for: {post.publish_date})"
            )

        logger.info(f"Successfully published {updated} post(s)")
        return f"Published {updated} post(s)"
    else:
        logger.debug("No scheduled posts ready to publish")
        return "No posts to publish"
