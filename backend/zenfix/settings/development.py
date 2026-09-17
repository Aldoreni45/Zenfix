from .base import *  # noqa: F403

DEBUG = True

# Override session cookie settings for development (HTTP, not HTTPS)
# Use SAMESITE="None" to allow cross-origin cookies between :3000 and :8000
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = False  # noqa: F403

# Disable rate limiting in development
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        "user": "10000/hour",
        "anon": "1000/hour",
        "login": "100/minute",
        "password_reset": "100/hour",
    },
}
