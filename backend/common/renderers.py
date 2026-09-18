import json

from bson import ObjectId
from rest_framework.renderers import JSONRenderer


class _MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


class EnvelopeJSONRenderer(JSONRenderer):
    encoder_class = _MongoJSONEncoder

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get("response")
        request = renderer_context.get("request")
        if request is not None and request.path.startswith("/api/schema"):
            return super().render(data, accepted_media_type, renderer_context)
        if request is not None and request.path.startswith("/api/docs"):
            return super().render(data, accepted_media_type, renderer_context)
        if isinstance(data, dict) and ("success" in data or "status" in data and "database" in data):
            return super().render(data, accepted_media_type, renderer_context)
        if response is not None and response.status_code >= 400:
            if isinstance(data, dict) and "success" in data:
                payload = data
            else:
                payload = {
                    "success": False,
                    "error": {
                        "code": "ERROR",
                        "message": _first_message(data),
                        "details": data if isinstance(data, dict) else {},
                    },
                }
            return super().render(payload, accepted_media_type, renderer_context)
        payload = {"success": True, "data": data, "message": ""}
        return super().render(payload, accepted_media_type, renderer_context)


def _first_message(data) -> str:
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        try:
            return json.dumps(data)[:300]
        except TypeError:
            return "Request failed."
    if isinstance(data, list) and data:
        return str(data[0])
    return "Request failed."
