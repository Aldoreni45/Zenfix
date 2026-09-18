from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework.request import Request


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from cookies as a fallback
    when Authorization header is not present.
    """
    
    def get_header(self, request: Request):
        # First try the standard Authorization header
        header = super().get_header(request)
        if header:
            return header
        
        # Fallback to reading from cookies
        access_token = request.COOKIES.get('zenfix_access_token')
        if access_token:
            # Return in the format expected by parent class: "Bearer <token>"
            return f'Bearer {access_token}'
        
        return None