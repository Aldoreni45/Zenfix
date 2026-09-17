from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from users.models import User
from videos.models import SocialPost, Video, VideoAsset
from videos.serializers import SocialPostSerializer, VideoAssetSerializer, VideoSerializer
from videos.services import VideoWorkflowService


class VideoViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticatedAndActive]
    search_fields = ("title", "video_code", "description")
    filterset_fields = ("stage", "status", "priority", "client", "assigned_to")
    ordering_fields = ("deadline", "created_at")
    queryset = Video.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = Video.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(Q(created_by=user) | Q(assigned_to=user) | Q(client__assigned_manager=user) | Q(assigned_to__reports_to=user))
        return qs.filter(Q(assigned_to=user) | Q(shooter=user) | Q(editor=user) | Q(social_media_handler=user))

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot create videos.")
        instance = serializer.save(created_by=self.request.user)
        ActivityLogService.log(actor=self.request.user, action=ActivityLog.Action.CREATE, entity_type="video", entity_id=str(instance.numeric_id), description=f"Created video {instance.title}", request=self.request)

    def perform_destroy(self, instance):
        if self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("Only the owner can delete videos.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def my_videos(self, request):
        qs = Video.objects.filter(Q(assigned_to=request.user) | Q(shooter=request.user) | Q(editor=request.user) | Q(social_media_handler=request.user))
        return Response(VideoSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def workflow_stats(self, request):
        qs = self.get_queryset()
        stats = qs.aggregate(
            total=Count("id"),
            in_production=Count("id", filter=Q(stage__in=[Video.Stage.SHOOTING, Video.Stage.EDITING, Video.Stage.IN_PROGRESS])),
            waiting_approval=Count("id", filter=Q(stage__in=[Video.Stage.INTERNAL_REVIEW, Video.Stage.CLIENT_REVIEW, Video.Stage.OWNER_REVIEW])),
            approved=Count("id", filter=Q(stage=Video.Stage.APPROVED)),
            posted=Count("id", filter=Q(stage__in=[Video.Stage.PUBLISHED, Video.Stage.POSTED])),
        )
        return Response(stats)

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        video = self.get_object()
        stage = request.data.get("status") or request.data.get("stage")
        if not stage:
            raise ValidationError({"status": "status is required."})
        VideoWorkflowService.transition(video, stage, actor=request.user, request=request)
        return Response(VideoSerializer(video).data)

    @action(detail=True, methods=["post"])
    def advance_workflow(self, request, pk=None):
        video = VideoWorkflowService.advance(self.get_object(), actor=request.user, request=request)
        return Response(VideoSerializer(video).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot reject videos.")
        video = VideoWorkflowService.transition(self.get_object(), Video.Stage.REJECTED, actor=request.user, request=request, reason=request.data.get("reason", ""))
        return Response(VideoSerializer(video).data)


class VideoAssetViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = VideoAssetSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        return VideoAsset.objects.all()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=False, methods=["get"])
    def my_uploads(self, request):
        qs = VideoAsset.objects.filter(uploaded_by=request.user)
        return Response(VideoAssetSerializer(qs, many=True).data)


class SocialPostViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = SocialPostSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        return SocialPost.objects.all()

    @action(detail=False, methods=["get"])
    def scheduled(self, request):
        return Response(SocialPostSerializer(self.get_queryset().filter(status=SocialPost.Status.SCHEDULED), many=True).data)

    @action(detail=False, methods=["get"])
    def my_posts(self, request):
        return Response(SocialPostSerializer(self.get_queryset().filter(assigned_to=request.user), many=True).data)

    @action(detail=True, methods=["post"])
    def mark_posted(self, request, pk=None):
        post = self.get_object()
        post.status = SocialPost.Status.POSTED
        from django.utils import timezone

        post.posted_date = timezone.now()
        post.save()
        return Response(SocialPostSerializer(post).data)
