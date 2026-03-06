from app.config import settings

try:
    from celery import Celery
except Exception:
    Celery = None  # type: ignore


class _InlineTask:
    def __init__(self, fn):
        self.fn = fn

    def __call__(self, *args, **kwargs):
        return self.fn(*args, **kwargs)

    def delay(self, *args, **kwargs):
        return self.fn(*args, **kwargs)


class _InlineCelery:
    def __init__(self):
        self.conf = type("Conf", (), {"task_routes": {}})()

    def task(self, name=None):
        def decorator(fn):
            return _InlineTask(fn)

        return decorator


if Celery:
    celery = Celery("meet_ai", broker=settings.redis_url, backend=settings.redis_url)
    celery.conf.task_routes = {
        "app.tasks.generate_meeting_summary_task": {"queue": "summaries"},
    }
else:
    celery = _InlineCelery()
