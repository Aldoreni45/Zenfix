from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MonthlyVideoProtocolViewSet, VideoRecordViewSet, VideoStageViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"protocols", MonthlyVideoProtocolViewSet, basename="protocols")
router.register(r"video-records", VideoRecordViewSet, basename="video-records")
router.register(r"video-stages", VideoStageViewSet, basename="video-stages")

urlpatterns = [
    path("", include(router.urls)),
]
