"""Optional MongoDB transaction helper. Atlas replica sets support transactions."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import TypeVar

from django_mongodb_backend.transaction import atomic

logger = logging.getLogger("zenfix")
T = TypeVar("T")


def run_in_transaction(fn: Callable[[], T]) -> T:
    try:
        with atomic():
            return fn()
    except Exception as exc:  # noqa: BLE001
        # Standalone MongoDB or unsupported topology: run without a transaction.
        message = str(exc).lower()
        if "transaction" in message or "replica set" in message or "mongos" in message:
            logger.warning("MongoDB transaction unavailable, continuing without atomicity.")
            return fn()
        raise
