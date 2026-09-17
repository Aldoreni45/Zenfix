import os

from .base import *  # noqa: F403
from .base import DATABASES

DEBUG = False

# Tests use a dedicated MongoDB database name. Never use SQLite.
DATABASES["default"]["NAME"] = os.environ.get("MONGODB_TEST_DB", "zenfix_test")

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
