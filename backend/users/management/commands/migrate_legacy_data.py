from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth.hashers import make_password
from django.utils.dateparse import parse_datetime, parse_date

from users.models import User
from clients.models import Client
from tasks.models import Task
from videos.models import Video
from notifications.models import Notification
from activity_logs.models import ActivityLog


class Command(BaseCommand):
    help = "Import documents from the legacy Next.js single-collection `data` store into Django MongoDB models."

    def handle(self, *args, **options):
        db = connection.get_database()
        coll = db.get_collection("data")
        count = coll.count_documents({})
        if count == 0:
            self.stdout.write("No legacy documents found in `data`.")
            return

        imported = 0
        for doc in coll.find({}):
            entity = doc.get("entity")
            try:
                if entity == "users":
                    self._user(doc)
                elif entity == "clients":
                    self._client(doc)
                elif entity == "tasks":
                    self._task(doc)
                elif entity == "videos":
                    self._video(doc)
                elif entity == "notifications":
                    self._notification(doc)
                elif entity == "activity-logs":
                    self._log(doc)
                imported += 1
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"Skipped {entity} {doc.get('id')}: {exc}")
        self.stdout.write(self.style.SUCCESS(f"Processed {imported} legacy documents."))

    def _user(self, doc):
        username = doc.get("username")
        if not username or User.objects.filter(username=username).exists():
            return
        user = User(
            username=username,
            email=doc.get("email") or f"{username}@legacy.local",
            first_name=doc.get("first_name") or "",
            last_name=doc.get("last_name") or "",
            role=doc.get("role") or User.Role.EMPLOYEE,
            status=doc.get("status") or User.Status.ACTIVE,
            phone=doc.get("phone") or "",
        )
        if doc.get("passwordHash"):
            user.password = doc["passwordHash"]
        else:
            user.set_unusable_password()
        user.save()

    def _client(self, doc):
        name = doc.get("name")
        if not name or Client.objects.filter(name=name).exists():
            return
        Client.objects.create(
            name=name,
            company_name=doc.get("company_name") or "",
            email=doc.get("email") or "",
            phone=doc.get("phone") or "",
            status=doc.get("status") or Client.Status.ACTIVE,
            contact_person=doc.get("contact_person") or "",
        )

    def _task(self, doc):
        title = doc.get("title")
        if not title:
            return
        Task.objects.create(
            title=title,
            description=doc.get("description") or "",
            status=doc.get("status") or Task.Status.PENDING,
            priority=doc.get("priority") or Task.Priority.MEDIUM,
            due_date=parse_date(str(doc["due_date"])) if doc.get("due_date") else None,
            notes=doc.get("notes") or "",
        )

    def _video(self, doc):
        title = doc.get("title")
        if not title:
            return
        Video.objects.create(
            title=title,
            description=doc.get("description") or "",
            stage=doc.get("status") or doc.get("stage") or Video.Stage.IDEA,
            status=doc.get("status") or Video.Stage.IDEA,
        )

    def _notification(self, doc):
        recipient = User.objects.filter(numeric_id=doc.get("receiver")).first()
        if not recipient:
            recipient = User.objects.filter(role=User.Role.OWNER).first()
        if not recipient:
            return
        Notification.objects.create(
            recipient=recipient,
            title=doc.get("title") or "Notification",
            message=doc.get("message") or "",
            notification_type=doc.get("type") or "info",
            is_read=bool(doc.get("read")),
        )

    def _log(self, doc):
        actor = User.objects.filter(numeric_id=doc.get("user")).first()
        ActivityLog.objects.create(
            actor=actor,
            action=(doc.get("action") or "UPDATE").upper()[:40],
            entity_type=doc.get("entity") or "unknown",
            entity_id=str(doc.get("entity_id") or ""),
            description=doc.get("action_name") or "",
            metadata=doc.get("details") or {},
        )
