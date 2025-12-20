# -*- coding: utf-8 -*-

import multiprocessing
import os
from distutils.util import strtobool

bind = f"0.0.0.0:{os.getenv('PORT', '8080')}"
accesslog = "-"
access_log_format = "%(h)s %(l)s %(u)s %(t)s '%(r)s' %(s)s %(b)s '%(f)s' '%(a)s' in %(D)sµs"  # noqa: E501

# Optimized for small Railway instances (512MB-1GB)
# 1 worker + 4 threads uses ~40% less memory than 2 workers + 1 thread
# For larger instances, set WEB_CONCURRENCY=2-4 via environment variable
workers = int(os.getenv("WEB_CONCURRENCY", 1))  # Optimized for cost: 1 worker
threads = int(os.getenv("PYTHON_MAX_THREADS", 4))  # Use threads for concurrency

# Use gthread worker for better async performance
worker_class = os.getenv("WORKER_CLASS", "gthread")

reload = bool(strtobool(os.getenv("WEB_RELOAD", "false")))

timeout = int(os.getenv("WEB_TIMEOUT", 120))


# Serverless-friendly connection lifecycle hooks
def on_starting(server):
    """
    Called before the master process is initialized.
    Close any stale database connections from previous runs.
    This is critical for serverless environments where the container
    may be reused after scaling from zero.
    """
    try:
        from django.db import connections
        for conn in connections.all():
            conn.close()
    except Exception:
        # Django may not be fully loaded yet - safe to ignore
        pass


def post_fork(server, worker):
    """
    Called after a worker has been forked.
    Close all database connections to avoid sharing sockets between processes.
    Each worker needs its own connection pool.
    """
    try:
        from django.db import connections
        for conn in connections.all():
            conn.close()
    except Exception:
        # If this fails, let the worker start anyway
        pass


def on_exit(server):
    """
    Called before Gunicorn shuts down.
    Gracefully close all database connections.
    This ensures clean connection state when Railway scales the app to zero.
    """
    try:
        from django.db import connections
        for conn in connections.all():
            # Close stale/unusable connections first
            conn.close_if_unusable_or_obsolete()
            # Then close the connection entirely
            conn.close()
    except Exception:
        # Best effort - don't block shutdown
        pass
