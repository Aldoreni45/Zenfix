from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class PasswordResetThrottle(SimpleRateThrottle):
    scope = "password_reset"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
