from __future__ import annotations

from datetime import date, timedelta

from django.db.models import Q
from django.utils import timezone

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from notifications.services import NotificationService
from tasks.models import Task


class TaskCarryForwardService:
    """Carry unfinished tasks into a new reporting period without duplicating records."""

    OPEN_STATUSES = {
        Task.Status.PENDING,
        Task.Status.ASSIGNED,
        Task.Status.IN_PROGRESS,
        Task.Status.BLOCKED,
        Task.Status.SUBMITTED,
        Task.Status.OVERDUE,
        Task.Status.REJECTED,
    }

    @classmethod
    def unfinished_queryset(cls, *, as_of: date | None = None):
        as_of = as_of or timezone.localdate()
        return Task.objects.filter(status__in=cls.OPEN_STATUSES).filter(
            Q(due_date__lt=as_of) | Q(due_date__isnull=True, status=Task.Status.OVERDUE)
        )

    @classmethod
    def carry_forward_task(cls, task: Task, *, new_due_date: date, actor=None, request=None) -> Task:
        if task.status in {Task.Status.COMPLETED, Task.Status.CANCELLED}:
            return task
        if task.carried_forward_from_id and task.due_date == new_due_date:
            return task
        if not task.original_due_date:
            task.original_due_date = task.due_date
        task.due_date = new_due_date
        task.carry_forward_count = (task.carry_forward_count or 0) + 1
        if task.status == Task.Status.OVERDUE:
            task.status = Task.Status.PENDING
        task.save()
        ActivityLogService.log(
            actor=actor,
            action=ActivityLog.Action.CARRY_FORWARD,
            entity_type="task",
            entity_id=str(task.numeric_id),
            description=f"Carried forward task {task.title}",
            metadata={"new_due_date": new_due_date.isoformat(), "original_due_date": str(task.original_due_date)},
            request=request,
        )
        NotificationService.notify(
            recipient=task.assigned_to,
            title="Task carried forward",
            message=f'"{task.title}" was carried forward to {new_due_date.isoformat()}.',
            notification_type="task_assigned",
            related_object_type="task",
            related_object_id=str(task.numeric_id),
        )
        return task

    @classmethod
    def carry_forward_all_pending(cls, *, new_due_date: date, actor=None, request=None) -> dict:
        count = 0
        for task in cls.unfinished_queryset():
            cls.carry_forward_task(task, new_due_date=new_due_date, actor=actor, request=request)
            count += 1
        return {"carried_count": count, "new_due_date": new_due_date.isoformat()}

    @classmethod
    def default_next_due(cls) -> date:
        return timezone.localdate() + timedelta(days=1)
