from django.apps import AppConfig


class ActivityLogsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "activity_logs"
