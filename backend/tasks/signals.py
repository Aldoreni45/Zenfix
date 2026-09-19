from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from tasks.models import Task


@receiver(post_save, sender=Task)
def sync_video_stage_on_task_complete(sender, instance, **kwargs):
    """When a video-protocol task is completed, auto-complete the linked VideoStage."""
    if not instance.video_stage_id:
        return
    if instance.status != Task.Status.COMPLETED:
        return

    from video_protocol.models import VideoStage

    stage = instance.video_stage
    if stage.status == VideoStage.Status.COMPLETED:
        return

    stage.status = VideoStage.Status.COMPLETED
    stage.completed_at = instance.completed_at or timezone.now()
    stage.save(update_fields=["status", "completed_at", "updated_at"])

    _unlock_next_stage(stage)


def _unlock_next_stage(completed_stage):
    """Start the next stage if it was not_started and is now unlocked."""
    from video_protocol.models import VideoStage

    stage_order = [s[0] for s in VideoStage.StageType.choices]
    current_idx = VideoStage.STAGE_ORDER.get(completed_stage.stage_type, 0)
    if current_idx >= len(stage_order) - 1:
        return

    next_type = stage_order[current_idx + 1]
    next_stage = VideoStage.objects.filter(
        video=completed_stage.video,
        stage_type=next_type,
    ).first()

    if next_stage and next_stage.status == VideoStage.Status.NOT_STARTED and not next_stage.is_locked:
        pass
