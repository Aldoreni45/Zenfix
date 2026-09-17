from django.db import models

from common.models import NumericIdModel


class Department(NumericIdModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "zf_departments"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
