from bson import ObjectId
from bson.errors import InvalidId
from django.shortcuts import get_object_or_404
from rest_framework import viewsets


class NumericIdViewSetMixin:
    lookup_value_regex = r"[^/]+"

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup = str(self.kwargs[self.lookup_field])
        try:
            ObjectId(lookup)
            return get_object_or_404(queryset, pk=lookup)
        except (InvalidId, TypeError, ValueError):
            return get_object_or_404(queryset, numeric_id=int(lookup))


class PublicIdSerializerMixin:
    def get_id(self, obj):
        return getattr(obj, "numeric_id", str(obj.pk))
