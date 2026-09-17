from django.contrib.auth.models import AbstractUser
from django.db import models

from common.sequences import next_numeric_id


class User(AbstractUser):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        EMPLOYEE = "employee", "Employee"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        SUSPENDED = "suspended", "Suspended"

    email = models.EmailField(blank=True, db_index=True)

    numeric_id = models.PositiveIntegerField(unique=True, db_index=True, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    phone = models.CharField(max_length=40, blank=True)
    avatar = models.CharField(max_length=500, blank=True)
    department = models.ForeignKey(
        "departments.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="members",
    )
    reports_to = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="direct_reports",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zf_users"

    def save(self, *args, **kwargs):
        if not self.numeric_id:
            self.numeric_id = next_numeric_id("users.user")
        self.is_active = self.status == self.Status.ACTIVE
        if self.role == self.Role.OWNER:
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.username

    @property
    def role_name(self) -> str:
        return self.get_role_display()

    @property
    def status_name(self) -> str:
        return self.get_status_display()

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department_id else None
