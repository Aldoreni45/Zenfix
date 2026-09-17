#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path


def main() -> None:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "zenfix.settings.development")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Activate the virtual environment and install requirements.txt."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
