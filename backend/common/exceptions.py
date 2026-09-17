import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from pymongo.errors import PyMongoError
from rest_framework import status
from rest_framework.exceptions import APIException, AuthenticationFailed, NotAuthenticated, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("zenfix")


def _error(code: str, message: str, details=None, http_status=400) -> Response:
    return Response(
        {
            "success": False,
            "error": {"code": code, "message": message, "details": details or {}},
        },
        status=http_status,
    )


def api_exception_handler(exc, context):
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        return _error("AUTHENTICATION_ERROR", str(exc.detail) if hasattr(exc, "detail") else "Authentication required.", http_status=401)
    if isinstance(exc, PermissionDenied):
        return _error("PERMISSION_DENIED", str(exc.detail) if hasattr(exc, "detail") else "Permission denied.", http_status=403)
    if isinstance(exc, Http404):
        return _error("NOT_FOUND", "Resource not found.", http_status=404)
    if isinstance(exc, ValidationError):
        details = exc.detail if hasattr(exc, "detail") else {}
        return _error("VALIDATION_ERROR", "Invalid input.", details=details, http_status=400)
    if isinstance(exc, DjangoValidationError):
        return _error("VALIDATION_ERROR", "Invalid input.", details=getattr(exc, "message_dict", {"non_field_errors": exc.messages}), http_status=400)
    if isinstance(exc, PyMongoError):
        logger.exception("Database error")
        return _error("DATABASE_ERROR", "A database error occurred.", http_status=503)

    response = exception_handler(exc, context)
    if response is not None:
        message = "Request failed."
        details = response.data
        if isinstance(response.data, dict) and "detail" in response.data:
            message = str(response.data["detail"])
        return _error(
            "ERROR" if not isinstance(exc, APIException) else exc.__class__.__name__.upper(),
            message,
            details=details,
            http_status=response.status_code,
        )

    logger.exception("Unhandled exception")
    return _error("INTERNAL_ERROR", "An unexpected error occurred.", http_status=500)
