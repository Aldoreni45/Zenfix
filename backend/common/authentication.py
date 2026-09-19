from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError, AuthenticationFailed
from rest_framework.request import Request

# simplejwt compares header key against AUTH_HEADER_TYPE_BYTES (a set of bytes),
# so the fallback header must be returned as bytes just like the parent class does.
_HTTP_HEADER_ENCODING = "iso-8859-1"


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from cookies as a fallback
    when the Authorization header is not present.

    Invalid/expired tokens are swallowed and treated as "no credentials" so
    public endpoints (login, csrf, logout) are not aborted by the auth layer
    before AllowAny logic runs. Secured views still return 401 because DRF's
    permission layer raises NotAuthenticated when authentication returns None.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None

    def get_header(self, request: Request):
        # First try the standard Authorization header
        header = super().get_header(request)
        if header:
            return header

        # Fallback to reading from cookies
        access_token = request.COOKIES.get("zenfix_access_token")
        if access_token:
            # Return in the format expected by parent class: b"Bearer <token>"
            return f"Bearer {access_token}".encode(_HTTP_HEADER_ENCODING)

        return None