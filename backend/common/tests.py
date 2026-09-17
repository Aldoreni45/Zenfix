from django.test import TestCase
from rest_framework.test import APITestCase

from approvals.models import Approval
from clients.models import Client
from departments.models import Department
from notifications.models import Notification
from tasks.models import Task, TaskComment
from tasks.services import TaskCarryForwardService
from users.models import User
from videos.models import Video
from videos.services import VideoWorkflowService


class ZenFixAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            password="OwnerPass123!",
            role=User.Role.OWNER,
            status=User.Status.ACTIVE,
            email="owner@zenfix.local",
        )
        self.manager = User.objects.create_user(
            username="manager",
            password="ManagerPass123!",
            role=User.Role.MANAGER,
            status=User.Status.ACTIVE,
            email="manager@zenfix.local",
        )
        self.employee = User.objects.create_user(
            username="employee",
            password="EmployeePass123!",
            role=User.Role.EMPLOYEE,
            status=User.Status.ACTIVE,
            email="employee@zenfix.local",
            reports_to=self.manager,
        )
        self.other = User.objects.create_user(
            username="other",
            password="OtherPass123!",
            role=User.Role.EMPLOYEE,
            status=User.Status.ACTIVE,
            email="other@zenfix.local",
        )
        self.inactive = User.objects.create_user(
            username="inactive",
            password="InactivePass123!",
            role=User.Role.EMPLOYEE,
            status=User.Status.INACTIVE,
            email="inactive@zenfix.local",
        )
        self.dept = Department.objects.create(name="Marketing", slug="marketing")
        self.client_obj = Client.objects.create(
            name="Acme",
            company_name="Acme Inc",
            status=Client.Status.ACTIVE,
            assigned_manager=self.manager,
            created_by=self.owner,
        )
        self.task = Task.objects.create(
            title="Edit reel",
            assigned_to=self.employee,
            assigned_manager=self.manager,
            created_by=self.manager,
            client=self.client_obj,
            status=Task.Status.PENDING,
            priority=Task.Priority.HIGH,
        )
        self.other_task = Task.objects.create(
            title="Secret task",
            assigned_to=self.other,
            created_by=self.owner,
            status=Task.Status.PENDING,
        )

    def test_health(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get("database"), "connected")

    def test_login_logout_me(self):
        res = self.client.post("/api/auth/login/", {"username": "owner", "password": "OwnerPass123!"}, format="json")
        self.assertEqual(res.status_code, 200)
        body = res.data.get("data") or res.data
        self.assertTrue(body.get("user") or body.get("username") or "user" in str(res.data))
        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.client.post("/api/auth/logout/", {}, format="json")
        me2 = self.client.get("/api/users/me/")
        self.assertIn(me2.status_code, (401, 403))

    def test_inactive_cannot_login(self):
        res = self.client.post("/api/auth/login/", {"username": "inactive", "password": "InactivePass123!"}, format="json")
        self.assertIn(res.status_code, (401, 403))

    def test_unauthorized(self):
        res = self.client.get("/api/users/")
        self.assertEqual(res.status_code, 401)

    def test_employee_cannot_list_other_users(self):
        self.client.force_authenticate(self.employee)
        res = self.client.get("/api/users/")
        self.assertEqual(res.status_code, 200)
        payload = res.data.get("data") or res.data
        results = payload.get("results") if isinstance(payload, dict) else payload
        ids = {item["username"] for item in results}
        self.assertEqual(ids, {"employee"})

    def test_employee_cannot_create_user(self):
        self.client.force_authenticate(self.employee)
        res = self.client.post("/api/users/", {"username": "x", "password": "Password123!", "role": "manager"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_manager_cannot_create_owner(self):
        self.client.force_authenticate(self.manager)
        res = self.client.post("/api/users/", {"username": "newown", "password": "Password123!", "role": "owner"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_owner_user_crud(self):
        self.client.force_authenticate(self.owner)
        res = self.client.post(
            "/api/users/",
            {"username": "newbie", "password": "Password123!", "role": "employee", "email": "n@z.local"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        data = res.data.get("data") or res.data
        uid = data["id"]
        patch = self.client.patch(f"/api/users/{uid}/status/", {"status": "suspended"}, format="json")
        self.assertEqual(patch.status_code, 200)

    def test_employee_cannot_see_other_task(self):
        self.client.force_authenticate(self.employee)
        res = self.client.get(f"/api/tasks/{self.other_task.numeric_id}/")
        self.assertEqual(res.status_code, 404)

    def test_employee_cannot_modify_unassigned_task(self):
        self.client.force_authenticate(self.employee)
        res = self.client.patch(f"/api/tasks/{self.other_task.numeric_id}/", {"title": "hacked"}, format="json")
        self.assertIn(res.status_code, (403, 404))

    def test_task_start_and_invalid_payload(self):
        self.client.force_authenticate(self.employee)
        ok = self.client.post(f"/api/tasks/{self.task.numeric_id}/start/", {}, format="json")
        self.assertEqual(ok.status_code, 200)
        bad = self.client.post("/api/tasks/", {"title": ""}, format="json")
        self.assertIn(bad.status_code, (400, 403))

    def test_overdue_and_carry_forward(self):
        from datetime import timedelta
        from django.utils import timezone

        self.task.due_date = timezone.localdate() - timedelta(days=2)
        self.task.save()
        self.client.force_authenticate(self.manager)
        res = self.client.get("/api/tasks/overdue/")
        self.assertEqual(res.status_code, 200)
        new_due = timezone.localdate() + timedelta(days=7)
        TaskCarryForwardService.carry_forward_task(self.task, new_due_date=new_due, actor=self.manager)
        self.task.refresh_from_db()
        self.assertEqual(self.task.due_date, new_due)
        TaskCarryForwardService.carry_forward_task(self.task, new_due_date=new_due, actor=self.manager)
        self.task.refresh_from_db()
        self.assertEqual(self.task.carry_forward_count, 1)

    def test_video_workflow_employee_cannot_skip(self):
        video = Video.objects.create(title="Clip", stage=Video.Stage.IDEA, created_by=self.manager, assigned_to=self.employee)
        self.client.force_authenticate(self.employee)
        res = self.client.post(f"/api/videos/{video.numeric_id}/update_status/", {"status": "approved"}, format="json")
        self.assertEqual(res.status_code, 403)
        VideoWorkflowService.transition(video, Video.Stage.SCRIPT, actor=self.employee)
        video.refresh_from_db()
        self.assertEqual(video.stage, Video.Stage.SCRIPT)

    def test_approval_employee_cannot_review(self):
        video = Video.objects.create(title="Review me", stage=Video.Stage.INTERNAL_REVIEW, created_by=self.manager)
        approval = Approval.objects.create(video=video, requested_by=self.employee, status=Approval.Status.PENDING)
        self.client.force_authenticate(self.employee)
        res = self.client.post(f"/api/approvals/{approval.numeric_id}/approve/", {}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_notifications_and_activity(self):
        Notification.objects.create(recipient=self.employee, title="Hi", message="There", notification_type="info")
        self.client.force_authenticate(self.employee)
        count = self.client.get("/api/notifications/count/")
        self.assertEqual(count.status_code, 200)
        logs = self.client.get("/api/activity-logs/")
        self.assertEqual(logs.status_code, 200)
        recent = self.client.get("/api/activity-logs/recent/")
        self.assertEqual(recent.status_code, 403)

    def test_dashboard(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get("/api/dashboard/")
        self.assertEqual(res.status_code, 200)
        self.client.force_authenticate(self.employee)
        res2 = self.client.get("/api/dashboard/")
        self.assertEqual(res2.status_code, 200)
        payload = res2.data.get("data") or res2.data
        self.assertNotIn("total_users", payload)

    def test_duplicate_target(self):
        from targets.models import MonthlyTarget

        self.client.force_authenticate(self.owner)
        payload = {"month": 1, "year": 2026, "target_type": "videos_target", "target_value": 10, "user": self.employee.pk}
        first = self.client.post("/api/monthly-targets/", payload, format="json")
        self.assertEqual(first.status_code, 201)
        second = self.client.post("/api/monthly-targets/", payload, format="json")
        self.assertEqual(second.status_code, 400)

    def test_client_crud_permissions(self):
        self.client.force_authenticate(self.employee)
        res = self.client.post("/api/clients/", {"name": "Nope"}, format="json")
        self.assertEqual(res.status_code, 403)
        self.client.force_authenticate(self.manager)
        res = self.client.post("/api/clients/", {"name": "New Co", "status": "active"}, format="json")
        self.assertEqual(res.status_code, 201)

    def test_comments(self):
        self.client.force_authenticate(self.employee)
        res = self.client.post(f"/api/tasks/{self.task.numeric_id}/comments/", {"comment": "working"}, format="json")
        self.assertEqual(res.status_code, 201)
        data = res.data.get("data") or res.data
        cid = data["id"]
        patch = self.client.patch(f"/api/comments/{cid}/", {"comment": "updated"}, format="json")
        self.assertEqual(patch.status_code, 200)

    def test_password_not_in_payload(self):
        self.client.force_authenticate(self.owner)
        res = self.client.get("/api/users/me/")
        payload = res.data.get("data") or res.data
        self.assertNotIn("password", payload)
        self.assertNotIn("passwordHash", payload)
