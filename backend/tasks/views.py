from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from notifications.services import NotificationService
from tasks.models import Task, TaskComment
from tasks.serializers import TaskCommentSerializer, TaskSerializer
from tasks.services import TaskCarryForwardService
from users.models import User


class TaskViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedAndActive]
    search_fields = ("title", "task_id", "description")
    filterset_fields = ("status", "priority", "department", "client", "assigned_to")
    ordering_fields = ("due_date", "created_at", "priority", "status")
    queryset = Task.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(Q(assigned_manager=user) | Q(assigned_by=user) | Q(created_by=user) | Q(assigned_to__reports_to=user))
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot create tasks.")
        instance = serializer.save(created_by=user, assigned_by=user)
        if instance.due_date and not instance.original_due_date:
            instance.original_due_date = instance.due_date
            instance.save(update_fields=["original_due_date"])
        ActivityLogService.log(actor=user, action=ActivityLog.Action.CREATE, entity_type="task", entity_id=str(instance.numeric_id), description=f"Created task {instance.title}", request=self.request)
        NotificationService.notify(recipient=instance.assigned_to, title="Task assigned", message=f'You were assigned "{instance.title}".', notification_type="task_assigned", related_object_type="task", related_object_id=str(instance.numeric_id))

    def _is_task_assignee(self, task, user):
        if not task.assigned_to:
            return False
        if task.assigned_to_id == user.pk:
            return True
        if str(task.assigned_to_id) == str(user.pk):
            return True
        task_num_id = getattr(task.assigned_to, "numeric_id", None)
        user_num_id = getattr(user, "numeric_id", None)
        if task_num_id is not None and user_num_id is not None and task_num_id == user_num_id:
            return True
        return False

    def perform_update(self, serializer):
        user = self.request.user
        task = self.get_object()
        if user.role == User.Role.EMPLOYEE and not self._is_task_assignee(task, user):
            raise PermissionDenied("You can only update your assigned tasks.")
        if user.role == User.Role.EMPLOYEE:
            allowed = {"status", "notes", "actual_hours", "attachments"}
            extra = set(serializer.validated_data) - allowed
            if extra:
                raise PermissionDenied("Employees cannot change those task fields.")
        new_status = serializer.validated_data.get("status")
        if new_status in {Task.Status.IN_PROGRESS, Task.Status.COMPLETED}:
            if not self._is_task_assignee(task, user):
                raise PermissionDenied("Only the assigned employee can start or complete this task.")
        old_status = task.status
        serializer.save()
        updated = serializer.instance
        if old_status != updated.status:
            ActivityLogService.log(
                actor=user,
                action=ActivityLog.Action.STATUS_CHANGE,
                entity_type="task",
                entity_id=str(updated.numeric_id),
                description=f"Task '{updated.title}' status changed from {old_status} to {updated.status}",
                metadata={"from": old_status, "to": updated.status},
                request=self.request,
            )

    def perform_destroy(self, instance):
        if self.request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot delete tasks.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def my_tasks(self, request):
        qs = Task.objects.filter(assigned_to=request.user)
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        qs = self.get_queryset().filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED])
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def overdue(self, request):
        raw_date = request.query_params.get("date")
        today = parse_date(raw_date) if raw_date else timezone.localdate()
        qs = self.get_queryset().filter(
            Q(due_date__lt=today) | Q(status=Task.Status.OVERDUE)
        ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def today(self, request):
        raw_date = request.query_params.get("date")
        today = parse_date(raw_date) if raw_date else timezone.localdate()
        qs = self.get_queryset().filter(due_date=today).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        days = min(int(request.query_params.get("days") or 7), 90)
        raw_date = request.query_params.get("date")
        today = parse_date(raw_date) if raw_date else timezone.localdate()
        qs = self.get_queryset().filter(due_date__gt=today, due_date__lte=today + timedelta(days=days)).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
        return Response(TaskSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def pending_previous(self, request):
        return self.overdue(request)

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot create tasks.")
        items = request.data.get("tasks") or []
        global_fields = request.data.get("global") or {}
        created = []
        for item in items:
            serializer = TaskSerializer(data={**global_fields, **item})
            serializer.is_valid(raise_exception=True)
            instance = serializer.save(created_by=request.user, assigned_by=request.user)
            created.append(TaskSerializer(instance).data)
        return Response({"created": len(created), "tasks": created}, status=status_created())

    @action(detail=False, methods=["post"])
    def carry_forward_all_pending(self, request):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot carry forward all tasks.")
        raw = request.data.get("new_due_date")
        new_due = parse_date(raw) if raw else TaskCarryForwardService.default_next_due()
        if not new_due:
            raise ValidationError({"new_due_date": "Invalid date."})
        result = TaskCarryForwardService.carry_forward_all_pending(new_due_date=new_due, actor=request.user, request=request)
        return Response(result)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        task = self.get_object()
        if not task.assigned_to:
            raise ValidationError("Task must be assigned to an employee before it can be started.")
        if not self._is_task_assignee(task, request.user):
            raise PermissionDenied("Only the assigned employee can start this task.")
        if task.status not in {Task.Status.PENDING, Task.Status.ASSIGNED, Task.Status.REJECTED}:
            raise ValidationError("Task can only be started when pending or assigned.")
        task.status = Task.Status.IN_PROGRESS
        task.started_at = timezone.now()
        task.save()
        ActivityLogService.log(
            actor=request.user,
            action=ActivityLog.Action.UPDATE,
            entity_type="task",
            entity_id=str(task.numeric_id),
            description=f"Task '{task.title}' started",
            request=request,
        )
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        if not task.assigned_to:
            raise ValidationError("Task must be assigned to an employee before it can be completed.")
        if not self._is_task_assignee(task, request.user):
            raise PermissionDenied("Only the assigned employee can complete this task.")
        if task.status not in {Task.Status.IN_PROGRESS, Task.Status.ASSIGNED, Task.Status.PENDING, Task.Status.SUBMITTED, Task.Status.REJECTED}:
            raise ValidationError("Task cannot be completed in its current status.")
        drive_link = request.data.get("drive_link", "").strip()
        completion_notes = request.data.get("completion_notes", "").strip()
        if not drive_link:
            raise ValidationError({"drive_link": "Drive link is required to complete a task."})
        task.status = Task.Status.COMPLETED
        task.completed_at = timezone.now()
        task.drive_link = drive_link
        task.completion_notes = completion_notes
        task.notes = request.data.get("notes", task.notes)
        if "actual_hours" in request.data:
            task.actual_hours = request.data.get("actual_hours")
        task.save()
        ActivityLogService.log(
            actor=request.user,
            action=ActivityLog.Action.SUBMIT,
            entity_type="task",
            entity_id=str(task.numeric_id),
            description=f"Task '{task.title}' completed",
            request=request,
        )
        if task.created_by and task.created_by != request.user:
            NotificationService.notify(
                recipient=task.created_by,
                title="Task Completed",
                message=f'"{task.title}" was completed by {request.user.full_name or request.user.username}.',
                notification_type="task_completed",
                related_object_type="task",
                related_object_id=str(task.numeric_id),
            )
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot reject tasks.")
        task = self.get_object()
        task.status = Task.Status.REJECTED
        task.rejection_reason = request.data.get("reason", "")
        task.rejection_count = (task.rejection_count or 0) + 1
        task.save()
        ActivityLogService.log(
            actor=request.user,
            action=ActivityLog.Action.REJECT,
            entity_type="task",
            entity_id=str(task.numeric_id),
            description=f"Task '{task.title}' rejected",
            metadata={"reason": task.rejection_reason[:500]},
            request=request,
        )
        NotificationService.notify(recipient=task.assigned_to, title="Task rejected", message=task.rejection_reason, notification_type="task_rejected", related_object_type="task", related_object_id=str(task.numeric_id))
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot assign tasks.")
        task = self.get_object()
        target_id = request.data.get("assigned_to")
        assignee = User.objects.filter(numeric_id=target_id).first() or User.objects.filter(pk=target_id).first()
        if not assignee:
            raise ValidationError({"assigned_to": "User not found."})
        task.assigned_to = assignee
        task.status = Task.Status.ASSIGNED
        task.save()
        ActivityLogService.log(
            actor=request.user,
            action=ActivityLog.Action.ASSIGN,
            entity_type="task",
            entity_id=str(task.numeric_id),
            description=f"Assigned task '{task.title}' to {assignee.full_name or assignee.username}",
            metadata={"assignee": str(assignee.numeric_id), "assignee_name": assignee.full_name or assignee.username},
            request=request,
        )
        NotificationService.notify(recipient=assignee, title="Task assigned", message=f'You were assigned "{task.title}".', notification_type="task_assigned", related_object_type="task", related_object_id=str(task.numeric_id))
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=["post"])
    def carry_forward(self, request, pk=None):
        task = self.get_object()
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot carry forward tasks.")
        raw = request.data.get("new_due_date")
        new_due = parse_date(raw) if raw else TaskCarryForwardService.default_next_due()
        if not new_due:
            raise ValidationError({"new_due_date": "Invalid date."})
        TaskCarryForwardService.carry_forward_task(task, new_due_date=new_due, actor=request.user, request=request)
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == "GET":
            return Response(TaskCommentSerializer(task.comments.all(), many=True).data)
        serializer = TaskCommentSerializer(data={"comment": request.data.get("comment"), "task": task.pk})
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user, task=task)
        return Response(serializer.data, status=201)


def status_created():
    from rest_framework import status as http_status

    return http_status.HTTP_201_CREATED


class CommentViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = TaskComment.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = TaskComment.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(Q(task__assigned_manager=user) | Q(task__created_by=user) | Q(author=user))
        return qs.filter(Q(author=user) | Q(task__assigned_to=user))

    def perform_update(self, serializer):
        comment = self.get_object()
        if comment.author_id != self.request.user.pk and self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("You can only edit your comments.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author_id != self.request.user.pk and self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("You can only delete your comments.")
        instance.delete()
