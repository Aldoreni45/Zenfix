from django.apps import AppConfig


class VideoProtocolConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "video_protocol"
    verbose_name = "Video Protocol"
