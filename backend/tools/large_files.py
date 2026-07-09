"""
Large Files Tool
Scans a directory tree and returns files larger than a configured threshold.
"""

from pathlib import Path
import os
from flask import jsonify

from path_utils import sanitize_path, get_allowed_roots, is_path_allowed


def _parse_positive_int(raw_value, default_value, max_value):
    try:
        parsed = int(raw_value)
        if parsed <= 0:
            return default_value
        return min(parsed, max_value)
    except (TypeError, ValueError):
        return default_value


def _parse_positive_float(raw_value, default_value, max_value):
    try:
        parsed = float(raw_value)
        if parsed <= 0:
            return default_value
        return min(parsed, max_value)
    except (TypeError, ValueError):
        return default_value


def list_large_files_api(request, load_settings):
    """
    API endpoint handler for scanning large files.
    Query params:
      - path: optional start directory (relative or absolute within allowed root)
      - minSizeMB: minimum size in MB (default 100, max 10240)
      - limit: max number of results (default 200, max 1000)
    """
    path_param = request.args.get("path", "")
    min_size_mb = _parse_positive_float(request.args.get("minSizeMB"), 100.0, 10240.0)
    limit = _parse_positive_int(request.args.get("limit"), 200, 1000)
    min_size_bytes = int(min_size_mb * 1024 * 1024)

    settings = load_settings()
    default_path = settings.get("general", {}).get("defaultPath", "C:/Users")
    target_path = sanitize_path(path_param, default_path)
    allowed_roots = get_allowed_roots(settings)

    if not is_path_allowed(target_path, allowed_roots):
        return jsonify({"error": "Access denied"}), 403

    if not target_path.exists() or not target_path.is_dir():
        return jsonify({
            "error": "Directory not found",
            "path": str(target_path).replace("\\", "/")
        }), 404

    scanned_files = 0
    scanned_dirs = 0
    items = []

    for root, dirs, files in os.walk(target_path, topdown=True, followlinks=False):
        scanned_dirs += 1
        scanned_files += len(files)

        for filename in files:
            file_path = Path(root) / filename
            try:
                stat = file_path.stat()
            except (PermissionError, OSError, FileNotFoundError):
                continue

            if stat.st_size < min_size_bytes:
                continue

            items.append({
                "name": file_path.name,
                "fullPath": str(file_path).replace("\\", "/"),
                "directory": str(file_path.parent).replace("\\", "/"),
                "size": stat.st_size,
                "modified": int(stat.st_mtime * 1000),
            })

    items.sort(key=lambda item: item["size"], reverse=True)
    total_matches = len(items)
    truncated = total_matches > limit
    items = items[:limit]

    return jsonify({
        "path": str(target_path).replace("\\", "/"),
        "minSizeMB": min_size_mb,
        "limit": limit,
        "totalMatches": total_matches,
        "truncated": truncated,
        "scannedFiles": scanned_files,
        "scannedDirs": scanned_dirs,
        "items": items,
    })
