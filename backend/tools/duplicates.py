"""
Duplicate Finder Tool
Find exact duplicate files by size and SHA-256 hash.
"""

from pathlib import Path
from collections import defaultdict
import hashlib
import os
from flask import jsonify

from backend.path_utils import sanitize_path, get_blocked_paths, is_path_blocked, validate_path_access


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


def _sha256_for_file(file_path, chunk_size=1024 * 1024):
    digest = hashlib.sha256()
    with open(file_path, "rb") as file_handle:
        while True:
            chunk = file_handle.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def duplicates_api(request, load_settings):
    """
    API endpoint handler for duplicate finder.
    Query params:
      - path: optional directory to scan
      - minSizeMB: minimum file size to include (default 1)
      - groupLimit: max groups to return (default 200)
    """
    path_param = request.args.get("path", "")
    min_size_mb = _parse_positive_float(request.args.get("minSizeMB"), 1.0, 10240.0)
    min_size_bytes = int(min_size_mb * 1024 * 1024)
    group_limit = _parse_positive_int(request.args.get("groupLimit"), 200, 1000)

    settings = load_settings()
    default_path = settings.get("general", {}).get("defaultPath", "C:/Users")
    target_path = sanitize_path(path_param, default_path)
    resolved, error = validate_path_access(target_path, settings)
    if error:
        return jsonify({"error": error[0]}), error[1]

    if not resolved.exists() or not resolved.is_dir():
        return jsonify({
            "error": "Directory not found",
            "path": str(resolved).replace("\\", "/")
        }), 404

    blocked_paths = get_blocked_paths(settings)
    files_by_size = defaultdict(list)
    scanned_files = 0
    scanned_dirs = 0

    for root, dirs, files in os.walk(resolved, topdown=True, followlinks=False):
        dirs[:] = [
            d for d in dirs
            if not is_path_blocked(Path(root) / d, blocked_paths)
        ]
        scanned_dirs += 1
        for filename in files:
            file_path = Path(root) / filename
            try:
                stat = file_path.stat()
            except (PermissionError, OSError, FileNotFoundError):
                continue

            scanned_files += 1
            if stat.st_size < min_size_bytes:
                continue
            files_by_size[stat.st_size].append(file_path)

    duplicate_groups = []
    total_duplicate_files = 0
    wasted_bytes = 0

    for size, candidate_paths in files_by_size.items():
        if len(candidate_paths) < 2:
            continue

        by_hash = defaultdict(list)
        for file_path in candidate_paths:
            try:
                file_hash = _sha256_for_file(file_path)
                by_hash[file_hash].append(file_path)
            except (PermissionError, OSError, FileNotFoundError):
                continue

        for file_hash, hashed_paths in by_hash.items():
            if len(hashed_paths) < 2:
                continue

            entries = []
            for path_obj in sorted(hashed_paths, key=lambda p: str(p).lower()):
                entries.append({
                    "name": path_obj.name,
                    "fullPath": str(path_obj).replace("\\", "/"),
                    "directory": str(path_obj.parent).replace("\\", "/"),
                })

            duplicate_groups.append({
                "hash": file_hash,
                "size": size,
                "count": len(entries),
                "files": entries,
            })
            total_duplicate_files += len(entries)
            wasted_bytes += size * (len(entries) - 1)

    duplicate_groups.sort(key=lambda group: (group["size"] * (group["count"] - 1)), reverse=True)
    total_groups = len(duplicate_groups)
    truncated = total_groups > group_limit
    duplicate_groups = duplicate_groups[:group_limit]

    return jsonify({
        "path": str(resolved).replace("\\", "/"),
        "minSizeMB": min_size_mb,
        "groupLimit": group_limit,
        "totalGroups": total_groups,
        "truncated": truncated,
        "scannedFiles": scanned_files,
        "scannedDirs": scanned_dirs,
        "totalDuplicateFiles": total_duplicate_files,
        "wastedBytes": wasted_bytes,
        "groups": duplicate_groups,
    })
