"""Operation history persistence for Disk Kit dashboard."""

import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from backend.settings import SETTINGS_FILE

MAX_STORED_OPERATIONS = 100


def _operations_file_path():
    return SETTINGS_FILE.parent / 'operations.json'


def _load_operations():
    path = _operations_file_path()
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_operations(operations):
    path = _operations_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(operations, indent=2))


def log_operation(op_type, title, detail='', status='completed'):
    """Append an operation entry (newest first in storage)."""
    entry = {
        'id': str(uuid.uuid4()),
        'type': op_type,
        'title': title,
        'detail': detail,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'status': status,
    }
    operations = _load_operations()
    operations.insert(0, entry)
    del operations[MAX_STORED_OPERATIONS:]
    _save_operations(operations)
    return entry


def get_operations_api(request):
    limit = 20
    try:
        limit = min(int(request.args.get('limit', 20)), 50)
    except (TypeError, ValueError):
        limit = 20
    operations = _load_operations()[:limit]
    return {'operations': operations}
