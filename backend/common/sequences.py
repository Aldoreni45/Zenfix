"""Atomic numeric id allocator using MongoDB findOneAndUpdate."""

from __future__ import annotations

from django.db import connection
from pymongo import ReturnDocument


def next_numeric_id(sequence_name: str) -> int:
    collection = connection.get_collection("zenfix_sequences")
    doc = collection.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(doc["value"])
