from __future__ import annotations

from pathlib import Path
from typing import BinaryIO
from uuid import uuid4

from django.conf import settings


class StorageService:
    """Local filesystem today; swap implementation for object storage later."""

    def save(self, folder: str, filename: str, stream: BinaryIO) -> str:
        backend = getattr(settings, "STORAGE_BACKEND", "local")
        if backend != "local":
            raise RuntimeError("Only local storage is configured.")
        safe_name = f"{uuid4().hex}_{Path(filename).name}"
        dest_dir = Path(settings.MEDIA_ROOT) / folder
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / safe_name
        with dest.open("wb") as handle:
            handle.write(stream.read())
        return f"{settings.MEDIA_URL}{folder}/{safe_name}"
