from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from users.models import User

from .models import MonthlyVideoProtocol, VideoRecord, VideoStage
from .serializers import (
    MonthlyVideoProtocolSerializer,
    MonthlyVideoProtocolListSerializer,
    VideoRecordSerializer,
    VideoStageSerializer,
    StageActionSerializer,
    StageRejectSerializer,
    ProtocolCreateSerializer,
    TargetUpdateSerializer,
)


STAGE_ORDER = [
    VideoStage.StageType.SHOOT,
    VideoStage.StageType.EDIT,
    VideoStage.StageType.REVIEW,
    VideoStage.StageType.CLIENT_APPROVAL,
    VideoStage.StageType.INSTAGRAM_POST,
]

MONTHS = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _validate_stage_transition(video, stage_type, action_type):
    current_idx = STAGE_ORDER.index(stage_type)

    if current_idx > 0:
        prev_type = STAGE_ORDER[current_idx - 1]
        prev_stage = VideoStage.objects.filter(video=video, stage_type=prev_type).first()
        if not prev_stage or prev_stage.status != VideoStage.Status.COMPLETED:
            raise ValueError(
                f"Cannot {action_type} {stage_type}: "
                f"{prev_type} must be completed first."
            )

    stage = VideoStage.objects.filter(video=video, stage_type=stage_type).first()
    if not stage:
        raise ValueError(f"Stage {stage_type} not found for this video.")

    if action_type == "start" and stage.status not in (VideoStage.Status.NOT_STARTED, VideoStage.Status.REJECTED):
        raise ValueError(f"Stage {stage_type} cannot be started (current status: {stage.status}).")
    if action_type == "complete" and stage.status != VideoStage.Status.IN_PROGRESS:
        raise ValueError(f"Stage {stage_type} must be in progress to complete.")

    return stage


class MonthlyVideoProtocolViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    queryset = MonthlyVideoProtocol.objects.select_related("client", "created_by").prefetch_related(
        "videos__stages__tasks", "videos__stages__assigned_to"
    )
    permission_classes = [IsAuthenticatedAndActive]

    def get_serializer_class(self):
        if self.action == "list":
            return MonthlyVideoProtocolListSerializer
        return MonthlyVideoProtocolSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        client_id = self.request.query_params.get("client_id")
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        status_filter = self.request.query_params.get("status")

        if client_id:
            qs = qs.filter(client_id=client_id)
        if month:
            qs = qs.filter(month=int(month))
        if year:
            qs = qs.filter(year=int(year))
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = ProtocolCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from clients.models import Client
        try:
            client = Client.objects.get(numeric_id=data["client"])
        except Client.DoesNotExist:
            try:
                client = Client.objects.get(id=data["client"])
            except Client.DoesNotExist:
                return Response(
                    {"error": "Client not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        existing = MonthlyVideoProtocol.objects.filter(
            client=client, month=data["month"], year=data["year"]
        ).first()
        if existing:
            return Response(
                {"error": f"Protocol already exists for {data['month']}/{data['year']}. Use update to change target."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        protocol = MonthlyVideoProtocol.objects.create(
            client=client,
            month=data["month"],
            year=data["year"],
            target_videos=data["target_videos"],
            created_by=request.user,
        )

        for i in range(1, data["target_videos"] + 1):
            video = VideoRecord.objects.create(protocol=protocol, video_number=i)
            for stage_type in STAGE_ORDER:
                VideoStage.objects.create(video=video, stage_type=stage_type)

        return Response(
            MonthlyVideoProtocolSerializer(protocol).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def dashboard(self, request, pk=None):
        protocol = self.get_object()
        videos = protocol.videos.prefetch_related("stages__tasks", "stages__assigned_to").all()

        from django.db.models import Count as DCount, Q
        stage_stats = {}
        for stage_type, _ in VideoStage.StageType.choices:
            stage_stats[stage_type] = {
                "completed": VideoStage.objects.filter(
                    video__protocol=protocol,
                    stage_type=stage_type,
                    status=VideoStage.Status.COMPLETED,
                ).count(),
                "in_progress": VideoStage.objects.filter(
                    video__protocol=protocol,
                    stage_type=stage_type,
                    status=VideoStage.Status.IN_PROGRESS,
                ).count(),
                "total": videos.count(),
            }

        video_summaries = []
        for video in videos:
            stages = list(video.stages.order_by("stage_type"))
            completed_count = sum(1 for s in stages if s.status == VideoStage.Status.COMPLETED)
            video_summaries.append({
                "id": video.id,
                "numeric_id": video.numeric_id,
                "video_number": video.video_number,
                "title": video.title,
                "current_status": video.current_status,
                "current_stage_name": video.current_stage_name,
                "current_stage_type": video.current_stage_type,
                "completion_percentage": round((completed_count / 5) * 100) if 5 else 0,
                "stages": VideoStageSerializer(stages, many=True).data,
            })

        employee_workload = (
            User.objects.filter(
                video_stages__video__protocol=protocol,
                video_stages__status__in=[
                    VideoStage.Status.NOT_STARTED,
                    VideoStage.Status.IN_PROGRESS,
                    VideoStage.Status.COMPLETED,
                ],
            )
            .annotate(
                assigned_count=Count(
                    "video_stages",
                    filter=Q(video_stages__video__protocol=protocol),
                ),
                completed_count=Count(
                    "video_stages",
                    filter=Q(
                        video_stages__video__protocol=protocol,
                        video_stages__status=VideoStage.Status.COMPLETED,
                    ),
                ),
                in_progress_count=Count(
                    "video_stages",
                    filter=Q(
                        video_stages__video__protocol=protocol,
                        video_stages__status=VideoStage.Status.IN_PROGRESS,
                    ),
                ),
            )
            .values("id", "numeric_id", "first_name", "last_name", "email",
                    "assigned_count", "completed_count", "in_progress_count")
        )

        counts = protocol.video_status_counts

        return Response({
            "protocol": MonthlyVideoProtocolSerializer(protocol).data,
            "video_summaries": video_summaries,
            "stage_stats": stage_stats,
            "employee_workload": list(employee_workload),
            "counts": {
                "target": protocol.target_videos,
                "posted": counts["posted"],
                "in_progress": counts["in_progress"],
                "not_started": counts["not_started"],
                "remaining": protocol.target_videos - counts["posted"],
            },
        })

    @action(detail=True, methods=["put"], url_path="update-target")
    def update_target(self, request, pk=None):
        protocol = self.get_object()
        serializer = TargetUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        new_target = data["target_videos"]

        current_count = protocol.videos.count()
        current_stages = VideoStage.objects.filter(video__protocol=protocol).count()

        if new_target < current_count:
            if not data.get("confirm_reduction"):
                existing_stages = VideoStage.objects.filter(
                    video__protocol=protocol,
                    status__in=[VideoStage.Status.IN_PROGRESS, VideoStage.Status.COMPLETED],
                ).count()
                return Response(
                    {
                        "error": f"Reducing from {current_count} to {new_target} videos. "
                                 f"{existing_stages} stages have work. Set confirm_reduction=true to proceed.",
                        "existing_stages_with_work": existing_stages,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            videos_to_remove = VideoRecord.objects.filter(
                protocol=protocol,
                video_number__gt=new_target,
            )
            videos_to_remove.delete()
        elif new_target > current_count:
            for i in range(current_count + 1, new_target + 1):
                video = VideoRecord.objects.create(protocol=protocol, video_number=i)
                for stage_type in STAGE_ORDER:
                    VideoStage.objects.create(video=video, stage_type=stage_type)

        protocol.target_videos = new_target
        protocol.save(update_fields=["target_videos", "updated_at"])

        return Response(MonthlyVideoProtocolSerializer(protocol).data)

    @action(detail=True, methods=["get"])
    def reports(self, request, pk=None):
        protocol = self.get_object()
        videos = protocol.videos.prefetch_related("stages__assigned_to").all()

        total_stages = videos.count() * VideoStage.STAGE_COUNT
        completed_stages = VideoStage.objects.filter(
            video__protocol=protocol,
            status=VideoStage.Status.COMPLETED,
        ).count()

        blocked_count = VideoStage.objects.filter(
            video__protocol=protocol,
            status=VideoStage.Status.BLOCKED,
        ).count()

        from django.utils import timezone as tz
        overdue_stages = VideoStage.objects.filter(
            video__protocol=protocol,
            status__in=[VideoStage.Status.NOT_STARTED, VideoStage.Status.IN_PROGRESS],
            due_date__lt=tz.localdate(),
        ).count()

        employee_stats = (
            User.objects.filter(
                video_stages__video__protocol=protocol,
                video_stages__status__in=[
                    VideoStage.Status.IN_PROGRESS,
                    VideoStage.Status.COMPLETED,
                ],
            )
            .annotate(
                total_assigned=Count(
                    "video_stages",
                    filter=Q(video_stages__video__protocol=protocol),
                ),
                completed=Count(
                    "video_stages",
                    filter=Q(
                        video_stages__video__protocol=protocol,
                        video_stages__status=VideoStage.Status.COMPLETED,
                    ),
                ),
                in_progress=Count(
                    "video_stages",
                    filter=Q(
                        video_stages__video__protocol=protocol,
                        video_stages__status=VideoStage.Status.IN_PROGRESS,
                    ),
                ),
            )
            .values("id", "numeric_id", "first_name", "last_name", "email",
                    "total_assigned", "completed", "in_progress")
        )

        counts = protocol.video_status_counts
        stage_counts = protocol.stage_counts

        return Response({
            "summary": {
                "target": protocol.target_videos,
                "posted": counts["posted"],
                "in_progress": counts["in_progress"],
                "not_started": counts["not_started"],
                "workflow_progress": protocol.workflow_progress,
                "fully_completed": protocol.fully_completed_videos,
                "total_stages": total_stages,
                "completed_stages": completed_stages,
                "blocked_stages": blocked_count,
                "overdue_stages": overdue_stages,
            },
            "stage_breakdown": stage_counts,
            "employee_productivity": list(employee_stats),
        })


class VideoRecordViewSet(NumericIdViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = VideoRecord.objects.select_related("protocol__client").prefetch_related("stages__assigned_to")
    serializer_class = VideoRecordSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        qs = super().get_queryset()
        protocol_id = self.request.query_params.get("protocol_id")
        if protocol_id:
            qs = qs.filter(protocol_id=protocol_id)
        return qs


class VideoStageViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    queryset = VideoStage.objects.select_related("video__protocol__client", "assigned_to")
    serializer_class = VideoStageSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        qs = super().get_queryset()
        video_id = self.request.query_params.get("video_id")
        stage_type = self.request.query_params.get("stage_type")
        assigned_to = self.request.query_params.get("assigned_to")
        protocol_id = self.request.query_params.get("protocol_id")

        if video_id:
            qs = qs.filter(video_id=video_id)
        if stage_type:
            qs = qs.filter(stage_type=stage_type)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)
        if protocol_id:
            qs = qs.filter(video__protocol_id=protocol_id)
        return qs

    def update(self, request, *args, **kwargs):
        stage = self.get_object()
        serializer = StageActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "assigned_to" in data:
            user_id = data["assigned_to"]
            if user_id:
                try:
                    user = User.objects.get(numeric_id=user_id, is_active=True)
                    stage.assigned_to = user
                except User.DoesNotExist:
                    return Response(
                        {"error": "User not found or inactive."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                stage.assigned_to = None

        if "notes" in data:
            stage.notes = data["notes"]
        if "due_date" in data:
            stage.due_date = data["due_date"]
        if "instagram_url" in data:
            stage.instagram_url = data["instagram_url"]
        if "caption" in data:
            stage.caption = data["caption"]

        stage.save()
        return Response(VideoStageSerializer(stage).data)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        stage = self.get_object()
        try:
            validated_stage = _validate_stage_transition(
                stage.video, stage.stage_type, "start"
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        validated_stage.status = VideoStage.Status.IN_PROGRESS
        validated_stage.started_at = timezone.now()
        validated_stage.save(update_fields=["status", "started_at", "updated_at"])

        video = validated_stage.video
        stages_data = VideoStageSerializer(video.stages.order_by("stage_type"), many=True).data
        return Response({
            "stage": VideoStageSerializer(validated_stage).data,
            "video": {
                "id": video.numeric_id,
                "numeric_id": video.numeric_id,
                "video_number": video.video_number,
                "current_status": video.current_status,
                "current_stage_name": video.current_stage_name,
                "stages": stages_data,
            },
        })

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        stage = self.get_object()
        try:
            validated_stage = _validate_stage_transition(
                stage.video, stage.stage_type, "complete"
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if validated_stage.stage_type == VideoStage.StageType.INSTAGRAM_POST:
            validated_stage.instagram_url = request.data.get("instagram_url", validated_stage.instagram_url)
            validated_stage.caption = request.data.get("caption", validated_stage.caption)

        drive_link = request.data.get("drive_link", "").strip()
        completion_notes = request.data.get("completion_notes", "").strip()
        import sys
        print(f"[DEBUG complete] stage={validated_stage.numeric_id} drive_link={repr(drive_link)} request.data={dict(request.data)}", file=sys.stderr)
        if drive_link:
            validated_stage.drive_link = drive_link
        if completion_notes:
            validated_stage.completion_notes = completion_notes

        validated_stage.status = VideoStage.Status.COMPLETED
        validated_stage.completed_at = timezone.now()
        validated_stage.save(update_fields=["status", "completed_at", "instagram_url", "caption", "drive_link", "completion_notes", "updated_at"])

        protocol = stage.video.protocol
        all_videos = protocol.videos.count()
        posted_videos = VideoStage.objects.filter(
            video__protocol=protocol,
            stage_type=VideoStage.StageType.INSTAGRAM_POST,
            status=VideoStage.Status.COMPLETED,
        ).count()

        if posted_videos >= all_videos and all_videos > 0:
            protocol.status = MonthlyVideoProtocol.Status.COMPLETED
            protocol.save(update_fields=["status", "updated_at"])

        video = validated_stage.video
        stages_data = VideoStageSerializer(video.stages.order_by("stage_type"), many=True).data
        return Response({
            "stage": VideoStageSerializer(validated_stage).data,
            "video": {
                "id": video.numeric_id,
                "numeric_id": video.numeric_id,
                "video_number": video.video_number,
                "current_status": video.current_status,
                "current_stage_name": video.current_stage_name,
                "stages": stages_data,
            },
            "protocol_completed": protocol.status == MonthlyVideoProtocol.Status.COMPLETED,
        })

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        stage = self.get_object()
        serializer = StageRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        stage.status = VideoStage.Status.REJECTED
        stage.rejection_reason = data["rejection_reason"]
        stage.save(update_fields=["status", "rejection_reason", "updated_at"])

        reject_to = data.get("reject_to_stage")
        if reject_to:
            target_stage = VideoStage.objects.filter(
                video=stage.video, stage_type=reject_to
            ).first()
            if target_stage:
                target_stage.status = VideoStage.Status.NOT_STARTED
                target_stage.completed_at = None
                target_stage.started_at = None
                target_stage.save(update_fields=["status", "completed_at", "started_at", "updated_at"])

        protocol = stage.video.protocol
        if protocol.status == MonthlyVideoProtocol.Status.COMPLETED:
            protocol.status = MonthlyVideoProtocol.Status.ACTIVE
            protocol.save(update_fields=["status", "updated_at"])

        from tasks.models import Task
        Task.objects.filter(
            video_stage=stage,
            status__in=[Task.Status.ASSIGNED, Task.Status.IN_PROGRESS],
        ).update(status=Task.Status.REJECTED, rejection_reason=stage.rejection_reason)

        video = stage.video
        stages_data = VideoStageSerializer(video.stages.order_by("stage_type"), many=True).data
        return Response({
            "stage": VideoStageSerializer(stage).data,
            "video": {
                "id": video.numeric_id,
                "numeric_id": video.numeric_id,
                "video_number": video.video_number,
                "current_status": video.current_status,
                "current_stage_name": video.current_stage_name,
                "stages": stages_data,
            },
        })

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        stage = self.get_object()
        user_id = request.data.get("assigned_to")
        due_date_raw = request.data.get("due_date")
        if not user_id:
            return Response(
                {"error": "assigned_to is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(numeric_id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stage.assigned_to = user
        if due_date_raw:
            parsed_date = parse_date(due_date_raw)
            if parsed_date:
                stage.due_date = parsed_date
        if stage.status == VideoStage.Status.NOT_STARTED:
            stage.status = VideoStage.Status.IN_PROGRESS
        if not stage.started_at:
            stage.started_at = timezone.now()
        stage.save(update_fields=["assigned_to", "due_date", "status", "started_at", "updated_at"])

        from tasks.models import Task
        from notifications.services import NotificationService
        protocol = stage.video.protocol
        stage_type_display = stage.get_stage_type_display()
        task_title = f"{stage_type_display} - Video {stage.video.video_number:02d} ({protocol.client.name} - {MONTHS[protocol.month - 1]} {protocol.year})"
        task = Task.objects.create(
            title=task_title,
            description=f"Auto-created from video protocol stage: {stage_type_display} for Video {stage.video.video_number:02d}",
            client=protocol.client,
            assigned_to=user,
            assigned_by=request.user,
            video_stage=stage,
            priority=Task.Priority.HIGH if stage.stage_type in (VideoStage.StageType.SHOOT, VideoStage.StageType.INSTAGRAM_POST) else Task.Priority.MEDIUM,
            status=Task.Status.ASSIGNED,
            due_date=stage.due_date,
            original_due_date=stage.due_date,
            task_type=f"video_protocol_{stage.stage_type}",
            notes=f"Video Protocol: {protocol.client.name} - {MONTHS[protocol.month - 1]} {protocol.year}",
        )
        NotificationService.notify(
            recipient=user,
            title="Task assigned",
            message=f'You were assigned "{task_title}".',
            notification_type="task_assigned",
            related_object_type="task",
            related_object_id=str(task.numeric_id),
        )

        video = stage.video
        video_stages = video.stages.select_related("assigned_to").order_by("stage_type")
        stages_data = VideoStageSerializer(video_stages, many=True).data

        return Response({
            "stage": VideoStageSerializer(stage).data,
            "video": {
                "id": video.numeric_id,
                "numeric_id": video.numeric_id,
                "video_number": video.video_number,
                "title": video.title,
                "current_status": video.current_status,
                "current_stage_name": video.current_stage_name,
                "stages": stages_data,
            },
        })

    @action(detail=False, methods=["get"])
    def my_tasks(self, request):
        qs = self.get_queryset().filter(assigned_to=request.user)
        stage_type = request.query_params.get("stage_type")
        status_filter = request.query_params.get("status")
        if stage_type:
            qs = qs.filter(stage_type=stage_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
