from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.conf import settings
import os
import secrets
import string

from departments.models import Department
from users.models import User
from clients.models import Client
from tasks.models import Task


DEFAULT_DEPARTMENTS = [
    "Marketing",
    "SEO",
    "Development",
    "Design",
    "Sales",
    "HR",
    "Production",
    "Social Media",
]


def _password(env_name: str) -> tuple[str, bool]:
    value = os.environ.get(env_name, "").strip()
    if value:
        return value, False
    alphabet = string.ascii_letters + string.digits
    generated = "".join(secrets.choice(alphabet) for _ in range(16))
    return generated, True


class Command(BaseCommand):
    help = "Seed departments and optional development users. Does not print passwords when DJANGO_DEBUG is False unless generated."

    def handle(self, *args, **options):
        for name in DEFAULT_DEPARTMENTS:
            Department.objects.get_or_create(name=name, defaults={"slug": slugify(name), "is_active": True})
        self.stdout.write(self.style.SUCCESS("Departments ensured."))

        owner_username = os.environ.get("SEED_OWNER_USERNAME", "admin").strip() or "admin"
        manager_username = os.environ.get("SEED_MANAGER_USERNAME", "manager").strip() or "manager"
        employee_username = os.environ.get("SEED_EMPLOYEE_USERNAME", "employee").strip() or "employee"

        specs = [
            (owner_username, "SEED_OWNER_PASSWORD", User.Role.OWNER, True),
            (manager_username, "SEED_MANAGER_PASSWORD", User.Role.MANAGER, False),
            (employee_username, "SEED_EMPLOYEE_PASSWORD", User.Role.EMPLOYEE, False),
        ]
        generated_passwords = []
        for username, env_key, role, staff in specs:
            password, generated = _password(env_key)
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@zenfix.local",
                    "role": role,
                    "status": User.Status.ACTIVE,
                    "is_staff": staff or role == User.Role.OWNER,
                    "first_name": role.title(),
                },
            )
            if created:
                user.set_password(password)
                user.role = role
                user.save()
                if generated:
                    generated_passwords.append((username, password, role))
            else:
                user.role = role
                user.status = User.Status.ACTIVE
                user.save()

        if generated_passwords and settings.DEBUG:
            self.stdout.write(self.style.WARNING("Generated development passwords (shown once):"))
            for username, password, role in generated_passwords:
                self.stdout.write(f"  {role}: {username} / {password}")
        elif generated_passwords and not settings.DEBUG:
            self.stdout.write(self.style.WARNING("Generated passwords were created but not printed because DEBUG is False."))

        if settings.SEED_DEMO_DATA:
            owner = User.objects.filter(role=User.Role.OWNER).first()
            manager = User.objects.filter(role=User.Role.MANAGER).first()
            employee = User.objects.filter(role=User.Role.EMPLOYEE).first()
            client, _ = Client.objects.get_or_create(
                name="Demo Client",
                defaults={
                    "company_name": "Demo Co",
                    "status": Client.Status.ACTIVE,
                    "assigned_manager": manager,
                    "created_by": owner,
                    "email": "demo@client.local",
                },
            )
            Task.objects.get_or_create(
                title="Demo launch task",
                defaults={
                    "client": client,
                    "assigned_to": employee,
                    "assigned_manager": manager,
                    "created_by": owner,
                    "status": Task.Status.PENDING,
                    "priority": Task.Priority.MEDIUM,
                },
            )
            self.stdout.write(self.style.SUCCESS("Demo data created."))

        self.stdout.write(self.style.SUCCESS("Seed complete."))
