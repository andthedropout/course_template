import time
from django.conf import settings
from django.db import connection
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

# Only import and connect to Redis if REDIS_URL is configured
if settings.REDIS_URL:
    from redis import Redis
    redis = Redis.from_url(settings.REDIS_URL)
else:
    redis = None


@csrf_exempt
def index(request):
    return HttpResponse("")


@csrf_exempt
def databases(request):
    """
    Health check endpoint with retry logic for serverless database wake-up.

    Railway calls this endpoint to verify the app is healthy. With serverless PostgreSQL,
    the database may be sleeping and takes 5-15 seconds to wake up. This retry logic
    ensures the health check succeeds even when the database is cold booting.
    """
    max_retries = 5
    retry_delay = 2  # Base delay in seconds

    for attempt in range(max_retries):
        try:
            # Check Redis connection if available
            if redis:
                redis.ping()

            # Always check database connection
            # This will raise an exception if database is not available
            connection.ensure_connection()

            # Health check passed
            return HttpResponse("")

        except Exception as e:
            # If this isn't the last attempt, retry with exponential backoff
            if attempt < max_retries - 1:
                wait_time = retry_delay * (attempt + 1)  # 2s, 4s, 6s, 8s
                time.sleep(wait_time)
                # Close any broken connections before retry
                connection.close()
                continue

            # Last attempt failed - return 503 Service Unavailable
            # Railway will retry the health check after a delay
            return HttpResponse(
                f"Health check failed after {max_retries} attempts: {str(e)}",
                status=503
            )

    return HttpResponse("")
