from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from activity_logs.models import ActivityLog
from activity_logs.serializers import ActivityLogSerializer
from common.permissions import IsOwnerRole
from tasks.models import Task
from tasks.serializers import TaskSerializer
from users.models import User

MAX_RANGE_DAYS = 366


class TaskHistoryItemSerializer(serializers.ModelSerializer):
    """Lightweight task payload for lists/tables; avoids the heavy comment
    nesting of TaskSerializer so paginated history stays fast."""

    id = serializers.IntegerField(source="numeric_id", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True, default=None)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)
    assigned_manager_name = serializers.CharField(source="assigned_manager.full_name", read_only=True, default=None)
    video_code = serializers.CharField(source="video.video_code", read_only=True, default=None)
    priority_name = serializers.CharField(read_only=True)
    status_name = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "task_id",
            "title",
            "client_name",
            "assigned_to_name",
            "assigned_manager_name",
            "video_code",
            "priority",
            "priority_name",
            "status",
            "status_name",
            "due_date",
            "due_time",
            "completed_at",
            "created_at",
            "updated_at",
            "carry_forward_count",
            "rejection_count",
            "is_overdue",
        )


def _resolve_user(value: str) -> User | None:
    if not value:
        return None
    if str(value).isdigit():
        return User.objects.filter(numeric_id=int(value)).first()
    return User.objects.filter(pk=value).first()


def _resolve_task(value: str) -> Task:
    if str(value).isdigit():
        task = Task.objects.filter(numeric_id=int(value)).first()
        if task:
            return task
    try:
        return Task.objects.get(pk=value)
    except Task.DoesNotExist:
        raise NotFound("Task not found.")


class TaskHistoryService:
    """Owner-only Task History / Team Activity data source.

    The date range windows the ledger keyed on ``due_date`` (the day each task
    was supposed to be handled); statuses reflect the current state. Overdue is
    computed as of today so a completed task is never counted twice.
    """

    @staticmethod
    def _range(request) -> tuple | None:
        if request.query_params.get("all"):
            return None
        start_raw = request.query_params.get("start")
        end_raw = request.query_params.get("end")
        today = timezone.localdate()
        if not start_raw and not end_raw:
            return today - timedelta(days=29), today
        if not start_raw or not end_raw:
            raise ValidationError({"range": "Both start and end dates are required."})
        start = parse_date(start_raw)
        end = parse_date(end_raw)
        if not start or not end or start > end:
            raise ValidationError({"range": "Invalid date range."})
        if (end - start).days > MAX_RANGE_DAYS:
            raise ValidationError({"range": "Date range cannot exceed 366 days."})
        return start, end

    @staticmethod
    def _base(request, rng, user):
        qs = Task.objects.all()
        if rng is not None:
            start, end = rng
            qs = qs.filter(due_date__range=(start, end))
        if user is not None:
            qs = qs.filter(assigned_to=user)
        return qs

    @staticmethod
    def _grouped(qs) -> dict:
        return {str(row["assigned_to"]): row["n"] for row in qs.values("assigned_to").annotate(n=Count("id"))}

    @staticmethod
    def _status_breakdown(qs) -> dict:
        today = timezone.localdate()
        return {
            "completed": qs.filter(status=Task.Status.COMPLETED).count(),
            "pending": qs.filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED]).count(),
            "in_progress": qs.filter(
                status__in=[Task.Status.IN_PROGRESS, Task.Status.BLOCKED, Task.Status.SUBMITTED]
            ).count(),
            "overdue": qs.filter(
                ~Q(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]),
                Q(status=Task.Status.OVERDUE) | Q(due_date__lt=today),
            ).count(),
            "rejected": qs.filter(status=Task.Status.REJECTED).count(),
            "cancelled": qs.filter(status=Task.Status.CANCELLED).count(),
            "carried_forward": qs.filter(carry_forward_count__gt=0).count(),
        }

    @classmethod
    def summary(cls, request) -> dict:
        rng = cls._range(request)
        user = _resolve_user(request.query_params.get("user"))
        qs = cls._base(request, rng, user)
        counts = cls._status_breakdown(qs)
        root = Task.objects if user is None else Task.objects.filter(assigned_to=user)
        total_all = root.count()
        total_in_range = qs.count()
        counts["total"] = total_in_range
        counts["total_all_time"] = total_all
        counts["completion_rate"] = round(
            (counts["completed"] / total_in_range) * 100, 1
        ) if total_in_range else 0
        counts["due_soon"] = qs.filter(
            due_date__lte=timezone.localdate() + timedelta(days=3),
            due_date__gte=timezone.localdate(),
        ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]).count()
        return counts

    @classmethod
    def users(cls, request) -> list:
        rng = cls._range(request)
        role = request.query_params.get("role")
        query = User.objects.filter(status=User.Status.ACTIVE).select_related("department")
        if role:
            if role not in User.Role.values:
                raise ValidationError({"role": "Invalid role."})
            query = query.filter(role=role)
        users = list(query)
        base = cls._base(request, rng, None)
        today = timezone.localdate()

        buckets = {
            "assigned": cls._grouped(base),
            "completed": cls._grouped(base.filter(status=Task.Status.COMPLETED)),
            "pending": cls._grouped(base.filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED])),
            "in_progress": cls._grouped(
                base.filter(status__in=[Task.Status.IN_PROGRESS, Task.Status.BLOCKED, Task.Status.SUBMITTED])
            ),
            "rejected": cls._grouped(base.filter(status=Task.Status.REJECTED)),
            "overdue": cls._grouped(
                base.filter(
                    ~Q(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]),
                    Q(status=Task.Status.OVERDUE) | Q(due_date__lt=today),
                )
            ),
        }

        payload = []
        for u in users:
            key = str(u.pk)
            assigned = buckets["assigned"].get(key, 0)
            completed = buckets["completed"].get(key, 0)
            pending = buckets["pending"].get(key, 0)
            in_progress = buckets["in_progress"].get(key, 0)
            rejected = buckets["rejected"].get(key, 0)
            overdue = buckets["overdue"].get(key, 0)
            payload.append(
                {
                    "id": u.numeric_id,
                    "username": u.username,
                    "name": u.full_name,
                    "email": u.email,
                    "role": u.role,
                    "role_name": u.get_role_display(),
                    "department": u.department_id,
                    "department_name": u.department.name if u.department_id else None,
                    "assigned": assigned,
                    "completed": completed,
                    "pending": pending,
                    "in_progress": in_progress,
                    "rejected": rejected,
                    "overdue": overdue,
                    "completion_rate": round(completed / assigned * 100, 1) if assigned else 0,
                }
            )
        payload.sort(key=lambda row: row["assigned"], reverse=True)
        return payload

    @classmethod
    def daily(cls, request) -> list:
        rng = cls._range(request)
        user = _resolve_user(request.query_params.get("user"))
        base = cls._base(request, rng, user)
        today = timezone.localdate()
        if rng is None:
            start, end = today - timedelta(days=29), today
        else:
            start, end = rng
            if (end - start).days > MAX_RANGE_DAYS:
                start = end - timedelta(days=MAX_RANGE_DAYS - 1)
        if start > end:
            start, end = end, start

        def by_day(qs) -> dict:
            return {str(row["due_date"]): row["n"] for row in qs.filter(due_date__isnull=False).values("due_date").annotate(n=Count("id"))}

        buckets = {
            "total": by_day(base),
            "completed": by_day(base.filter(status=Task.Status.COMPLETED)),
            "pending": by_day(base.filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED])),
            "in_progress": by_day(
                base.filter(status__in=[Task.Status.IN_PROGRESS, Task.Status.BLOCKED, Task.Status.SUBMITTED])
            ),
            "rejected": by_day(base.filter(status=Task.Status.REJECTED)),
            "overdue": by_day(
                base.filter(
                    ~Q(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]),
                    Q(status=Task.Status.OVERDUE) | Q(due_date__lt=today),
                )
            ),
        }

        rows = []
        day = start
        while day <= end:
            key = day.isoformat()
            total = buckets["total"].get(key, 0)
            rows.append(
                {
                    "date": key,
                    "total": total,
                    "completed": buckets["completed"].get(key, 0),
                    "pending": buckets["pending"].get(key, 0),
                    "in_progress": buckets["in_progress"].get(key, 0),
                    "rejected": buckets["rejected"].get(key, 0),
                    "overdue": buckets["overdue"].get(key, 0),
                }
            )
            day += timedelta(days=1)
        return rows

    @classmethod
    def tasks(cls, request) -> dict:
        rng = cls._range(request)
        user = _resolve_user(request.query_params.get("user"))
        qs = cls._base(request, rng, user).select_related("client", "assigned_to", "assigned_manager", "video")

        status = request.query_params.get("status")
        if status:
            if status not in Task.Status.values:
                raise ValidationError({"status": "Invalid status."})
            qs = qs.filter(status=status)
        priority = request.query_params.get("priority")
        if priority:
            if priority not in Task.Priority.values:
                raise ValidationError({"priority": "Invalid priority."})
            qs = qs.filter(priority=priority)

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(task_id__icontains=search))

        ordering = request.query_params.get("ordering", "-due_date")
        if ordering not in {
            "due_date",
            "-due_date",
            "created_at",
            "-created_at",
            "updated_at",
            "-updated_at",
            "priority",
            "-priority",
            "status",
            "-status",
            "title",
            "-title",
        }:
            ordering = "-due_date"
        qs = qs.order_by(ordering)

        page = max(int(request.query_params.get("page") or 1), 1)
        page_size = min(int(request.query_params.get("page_size") or 20), 100)
        count = qs.count()
        items = list(qs[(page - 1) * page_size : page * page_size])
        return {
            "count": count,
            "page": page,
            "page_size": page_size,
            "items": TaskHistoryItemSerializer(items, many=True).data,
        }

    @classmethod
    def user_detail(cls, request, user: User) -> dict:
        rng = cls._range(request)
        qs = cls._base(request, rng, user)
        counts = cls._status_breakdown(qs)
        counts["total"] = qs.count()
        counts["completion_rate"] = round(
            (counts["completed"] / counts["total"]) * 100, 1
        ) if counts["total"] else 0

        recent = qs.order_by("-updated_at").select_related("client", "assigned_to", "video")[:20]
        recent_tasks = TaskHistoryItemSerializer(recent, many=True).data

        activity = ActivityLog.objects.filter(actor=user).select_related("actor")[:40]
        all_tasks = Task.objects.filter(assigned_to=user)
        return {
            "user": {
                "id": user.numeric_id,
                "username": user.username,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
                "role_name": user.get_role_display(),
                "department": user.department_id,
                "department_name": user.department.name if user.department_id else None,
                "status": user.status,
            },
            "counts": counts,
            "recent_tasks": recent_tasks,
            "activity": ActivityLogSerializer(activity, many=True).data,
            "all_time": {
                "assigned": all_tasks.count(),
                "completed": all_tasks.filter(status=Task.Status.COMPLETED).count(),
                "pending": all_tasks.filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED]).count(),
                "overdue": all_tasks.filter(
                    ~Q(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]),
                    Q(status=Task.Status.OVERDUE) | Q(due_date__lt=timezone.localdate()),
                ).count(),
            },
        }

    @classmethod
    def task_detail(cls, task: Task) -> dict:
        logs = (
            ActivityLog.objects.filter(entity_type="task")
            .filter(Q(entity_id=str(task.numeric_id)) | Q(entity_id=str(task.pk)))
            .select_related("actor")
        )
        return {
            "task": TaskSerializer(task).data,
            "timeline": ActivityLogSerializer(logs, many=True).data,
        }


class TaskHistoryViewSet(viewsets.ViewSet):
    """Read-only Task History / Team Activity reports, restricted to the owner."""

    permission_classes = [IsOwnerRole]

    @action(detail=False, methods=["get"])
    def summary(self, request):
        return Response(TaskHistoryService.summary(request))

    @action(detail=False, methods=["get"])
    def users(self, request):
        return Response(TaskHistoryService.users(request))

    @action(detail=False, methods=["get"])
    def daily(self, request):
        return Response(TaskHistoryService.daily(request))

    @action(detail=False, methods=["get"])
    def tasks(self, request):
        return Response(TaskHistoryService.tasks(request))

    @action(detail=False, methods=["get"], url_path=r"users/(?P<user_id>[^/.]+)")
    def user_detail(self, request, user_id):
        user = _resolve_user(user_id)
        if user is None:
            raise NotFound("User not found.")
        return Response(TaskHistoryService.user_detail(request, user))

    @action(detail=False, methods=["get"], url_path=r"tasks/(?P<task_id>[^/.]+)")
    def task_detail(self, request, task_id):
        task = _resolve_task(task_id)
        return Response(TaskHistoryService.task_detail(task))