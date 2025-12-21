import hashlib
import hmac
import json
import logging
import secrets
import string

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Course, Enrollment

User = get_user_model()
logger = logging.getLogger(__name__)


def verify_saleor_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify the Saleor webhook signature."""
    if not signature or not secret:
        return False

    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)


def generate_random_password(length: int = 16) -> str:
    """Generate a random password for new users."""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for _ in range(length))


def get_or_create_user_by_email(email: str) -> tuple[User, bool]:
    """
    Get existing user by email or create a new one.
    Returns (user, was_created) tuple.
    """
    try:
        user = User.objects.get(email=email)
        return user, False
    except User.DoesNotExist:
        # Create new user with random password
        username = email.split('@')[0]
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=generate_random_password()
        )
        return user, True


def send_welcome_email(user: User, course: Course):
    """Send welcome email to newly enrolled user."""
    subject = f"You're enrolled in {course.title}!"
    message = f"""
Hi {user.username},

Thank you for purchasing {course.title}!

You can access your course by logging into your account at:
{getattr(settings, 'SITE_URL', 'http://localhost:8000')}/app/courses/{course.slug}

If this is your first time, please reset your password to set up your account:
{getattr(settings, 'SITE_URL', 'http://localhost:8000')}/forgot-password

Happy learning!
"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
            [user.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")


@csrf_exempt
@require_POST
def saleor_order_webhook(request):
    """
    Handle Saleor order webhooks to create enrollments.

    Expected payload structure for ORDER_CREATED/ORDER_FULFILLED:
    {
        "order": {
            "id": "...",
            "number": "...",
            "user_email": "customer@example.com",
            "lines": [
                {
                    "product_id": "...",
                    "variant_id": "...",
                    "product_name": "..."
                }
            ]
        }
    }
    """
    # Get webhook secret from settings
    webhook_secret = getattr(settings, 'SALEOR_WEBHOOK_SECRET', None)

    # Verify signature if secret is configured
    if webhook_secret:
        signature = request.headers.get('Saleor-Signature', '')
        if not verify_saleor_signature(request.body, signature, webhook_secret):
            logger.warning("Invalid webhook signature")
            return JsonResponse({'error': 'Invalid signature'}, status=401)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract order data
    order_data = payload.get('order', {})
    order_id = order_data.get('id', '')
    customer_email = order_data.get('user_email', '')
    order_lines = order_data.get('lines', [])

    if not customer_email:
        logger.warning(f"No customer email in order {order_id}")
        return JsonResponse({'error': 'No customer email'}, status=400)

    # Get or create user
    user, was_created = get_or_create_user_by_email(customer_email)

    enrollments_created = []

    # Process each line item
    for line in order_lines:
        product_id = line.get('product_id', '')

        if not product_id:
            continue

        # Find course by Saleor product ID
        try:
            course = Course.objects.get(saleor_product_id=product_id)
        except Course.DoesNotExist:
            logger.info(f"No course found for product {product_id}")
            continue

        # Create enrollment if not already enrolled
        enrollment, created = Enrollment.objects.get_or_create(
            user=user,
            course=course,
            defaults={'saleor_order_id': order_id}
        )

        if created:
            enrollments_created.append(course.title)
            logger.info(f"Enrolled {user.email} in {course.title}")

            # Send welcome email for new enrollments
            if was_created:
                send_welcome_email(user, course)

    return JsonResponse({
        'success': True,
        'user_created': was_created,
        'enrollments_created': enrollments_created
    })
