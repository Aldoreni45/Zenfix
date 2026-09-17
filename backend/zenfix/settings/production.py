import os

from .base import *  # noqa: F403
from .base import SECRET_KEY, _env_bool, _env_list

DEBUG = False

if SECRET_KEY == "insecure-dev-key-change-me":  # noqa: F405
    raise RuntimeError("DJANGO_SECRET_KEY must be set in production.")

ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS")
if not ALLOWED_HOSTS:
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set in production.")

CORS_ALLOWED_ORIGINS = _env_list("CORS_ALLOWED_ORIGINS")
if not CORS_ALLOWED_ORIGINS:
    raise RuntimeError("CORS_ALLOWED_ORIGINS must be set in production.")

CSRF_TRUSTED_ORIGINS = _env_list("CSRF_TRUSTED_ORIGINS")
SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", True)
CSRF_COOKIE_SECURE = _env_bool("CSRF_COOKIE_SECURE", True)
SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", True)
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")




