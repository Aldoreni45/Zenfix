from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from approvals.views import ApprovalViewSet
from activity_logs.views import ActivityLogViewSet
from clients.views import ClientViewSet
from common.health import HealthView, ReadyView
from dashboard.views import DashboardViewSet
from departments.views import DepartmentViewSet
from notifications.views import NotificationViewSet
from targets.views import MonthlyTargetViewSet
from tasks.views import CommentViewSet, TaskViewSet
from users.views import AuthViewSet, UserViewSet
from videos.views import SocialPostViewSet, VideoAssetViewSet, VideoViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"auth", AuthViewSet, basename="auth")
router.register(r"users", UserViewSet, basename="users")
router.register(r"departments", DepartmentViewSet, basename="departments")
router.register(r"clients", ClientViewSet, basename="clients")
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"comments", CommentViewSet, basename="comments")
router.register(r"videos", VideoViewSet, basename="videos")
router.register(r"video-assets", VideoAssetViewSet, basename="video-assets")
router.register(r"approvals", ApprovalViewSet, basename="approvals")
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"activity-logs", ActivityLogViewSet, basename="activity-logs")
router.register(r"dashboard", DashboardViewSet, basename="dashboard")
router.register(r"monthly-targets", MonthlyTargetViewSet, basename="monthly-targets")
router.register(r"social-posts", SocialPostViewSet, basename="social-posts")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/health/ready/", ReadyView.as_view(), name="health-ready"),
    path("api/", include(router.urls)),
]
