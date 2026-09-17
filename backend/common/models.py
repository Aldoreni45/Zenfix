from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class NumericIdModel(TimeStampedModel):
    """Public integer id for frontend compatibility; MongoDB ObjectId remains PK."""

    numeric_id = models.PositiveIntegerField(unique=True, db_index=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.numeric_id:
            from common.sequences import next_numeric_id

            self.numeric_id = next_numeric_id(self._meta.label_lower)
        super().save(*args, **kwargs)
