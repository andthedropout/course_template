import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("gagglehomev2")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Configure worker concurrency to limit resource usage
worker_concurrency = int(os.getenv("CELERY_WORKER_CONCURRENCY", 2))
app.conf.worker_concurrency = worker_concurrency

# Disable prefetching too many tasks at once
app.conf.worker_prefetch_multiplier = 1

# Prevent worker auto-scaling
app.conf.worker_autoscale = None
