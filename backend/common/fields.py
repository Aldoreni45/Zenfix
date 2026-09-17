from bson import ObjectId
from bson.errors import InvalidId
from rest_framework import serializers


class NumericOrPkRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A PrimaryKeyRelatedField that can resolve related models by either their
    standard pk (ObjectId in MongoDB) or their integer numeric_id.
    """

    def to_internal_value(self, data):
        if self.pk_field is not None:
            data = self.pk_field.to_internal_value(data)
        try:
            return self.get_queryset().get(pk=ObjectId(str(data)))
        except (InvalidId, TypeError, ValueError, self.queryset.model.DoesNotExist):
            try:
                return self.get_queryset().get(numeric_id=int(data))
            except (ValueError, TypeError, self.queryset.model.DoesNotExist):
                self.fail("does_not_exist", pk_value=data)

    def to_representation(self, value):
        return getattr(value, "numeric_id", value.pk)
