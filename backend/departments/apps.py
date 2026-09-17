from django.apps import AppConfig


class DepartmentsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "departments"
