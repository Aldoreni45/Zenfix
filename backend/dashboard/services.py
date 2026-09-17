from __future__ import annotations

from django.db.models import Count, Q
from django.utils import timezone

from approvals.models import Approval
from clients.models import Client
from notifications.models import Notification
from tasks.models import Task
from users.models import User
from videos.models import Video


class DashboardService:
    @staticmethod
    def _task_filters_for(user) -> Q:
        if user.role == User.Role.OWNER:
            return Q()
        if user.role == User.Role.MANAGER:
            return Q(assigned_manager=user) | Q(assigned_by=user) | Q(assigned_to__reports_to=user) | Q(created_by=user)
        return Q(assigned_to=user)

    @classmethod
    def build(cls, user: User) -> dict:
        today = timezone.localdate()
        task_q = cls._task_filters_for(user)
        tasks = Task.objects.filter(task_q)
        if user.role == User.Role.OWNER:
            clients = Client.objects.all()
            users = User.objects.all()
            videos = Video.objects.all()
            approvals = Approval.objects.all()
        elif user.role == User.Role.MANAGER:
            clients = Client.objects.filter(Q(assigned_manager=user) | Q(assigned_team_ids__contains=user.numeric_id))
            users = User.objects.filter(Q(pk=user.pk) | Q(reports_to=user) | Q(role=User.Role.EMPLOYEE))
            videos = Video.objects.filter(Q(created_by=user) | Q(assigned_to__reports_to=user) | Q(assigned_to=user) | Q(client__assigned_manager=user))
            approvals = Approval.objects.filter(Q(reviewed_by=user) | Q(requested_by__reports_to=user) | Q(status=Approval.Status.PENDING))
        else:
            clients = Client.objects.filter(Q(assigned_team_ids__contains=user.numeric_id) | Q(tasks__assigned_to=user)).distinct()
            users = User.objects.filter(pk=user.pk)
            videos = Video.objects.filter(Q(assigned_to=user) | Q(shooter=user) | Q(editor=user) | Q(social_media_handler=user))
            approvals = Approval.objects.filter(requested_by=user)

        overdue = tasks.filter(due_date__lt=today).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
        pending = tasks.filter(status__in=[Task.Status.PENDING, Task.Status.ASSIGNED])
        completed = tasks.filter(status=Task.Status.COMPLETED)
        unread = Notification.objects.filter(recipient=user, is_read=False).count()

        video_stats = videos.aggregate(
            total=Count("id"),
            approved=Count("id", filter=Q(stage__in=[Video.Stage.APPROVED, Video.Stage.PUBLISHED, Video.Stage.POSTED])),
            posted=Count("id", filter=Q(stage__in=[Video.Stage.PUBLISHED, Video.Stage.POSTED])),
            waiting=Count("id", filter=Q(stage__in=[Video.Stage.INTERNAL_REVIEW, Video.Stage.CLIENT_REVIEW, Video.Stage.OWNER_REVIEW])),
        )

        payload = {
            "role": user.role,
            "today_tasks": tasks.filter(due_date=today).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]).count(),
            "completed_today": tasks.filter(due_date=today, status=Task.Status.COMPLETED).count(),
            "in_progress_today": tasks.filter(due_date=today, status=Task.Status.IN_PROGRESS).count(),
            "pending_today": tasks.filter(due_date=today, status__in=[Task.Status.PENDING, Task.Status.ASSIGNED]).count(),
            "pending_previous": overdue.filter(assigned_to=user).count() if user.role == User.Role.EMPLOYEE else overdue.count(),
            "pending_tasks": pending.count(),
            "overdue_tasks": overdue.count(),
            "unread_notifications": unread,
            "waiting_approval": video_stats["waiting"],
            "videos_completed": video_stats["approved"],
            "videos_posted": video_stats["posted"],
            "videos_remaining": max((video_stats["total"] or 0) - (video_stats["approved"] or 0), 0),
        }

        if user.role == User.Role.OWNER:
            payload.update(
                {
                    "total_users": users.count(),
                    "managers": users.filter(role=User.Role.MANAGER).count(),
                    "employees": users.filter(role=User.Role.EMPLOYEE).count(),
                    "total_clients": clients.count(),
                    "active_clients": clients.filter(status=Client.Status.ACTIVE).count(),
                    "tasks": tasks.count(),
                    "pending_approvals": approvals.filter(status=Approval.Status.PENDING).count(),
                    "video_workflow": video_stats,
                    "client_progress": list(
                        clients.values("numeric_id", "name", "company_name")[:50]
                    ),
                    "total_monthly_target": 0,
                }
            )
        elif user.role == User.Role.MANAGER:
            team = User.objects.filter(Q(reports_to=user) | Q(role=User.Role.EMPLOYEE))
            payload.update(
                {
                    "assigned_clients": clients.count(),
                    "team_members": team.count(),
                    "approvals": approvals.filter(status=Approval.Status.PENDING).count(),
                    "workflow_statistics": video_stats,
                    "workload": {
                        "total": team.count(),
                        "assigned_clients": clients.count(),
                        "employees": [
                            {
                                "id": member.numeric_id,
                                "name": member.full_name,
                                "role": member.role,
                                "pending_tasks": Task.objects.filter(assigned_to=member, status__in=[Task.Status.PENDING, Task.Status.ASSIGNED]).count(),
                            }
                            for member in team.filter(role=User.Role.EMPLOYEE)[:50]
                        ],
                    },
                }
            )
        else:
            payload.update(
                {
                    "own_tasks": tasks.count(),
                    "completed_tasks": completed.count(),
                    "assigned_videos": videos.count(),
                    "pending_approvals": approvals.filter(status=Approval.Status.PENDING).count(),
                }
            )
        return payload

    @staticmethod
    def task_summary(user: User) -> dict:
        qs = Task.objects.all() if user.role == User.Role.OWNER else Task.objects.filter(DashboardService._task_filters_for(user))
        return {
            "total": qs.count(),
            "by_status": {
                "pending": qs.filter(status=Task.Status.PENDING).count(),
                "in_progress": qs.filter(status=Task.Status.IN_PROGRESS).count(),
                "completed": qs.filter(status=Task.Status.COMPLETED).count(),
                "rejected": qs.filter(status=Task.Status.REJECTED).count(),
                "cancelled": qs.filter(status=Task.Status.CANCELLED).count(),
            },
        }
