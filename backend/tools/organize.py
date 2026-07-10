"""
Smart Organize Tool
Organize files into category folders using extension-based rules.
"""

import shutil
from flask import jsonify

from backend.operations import log_operation
from backend.path_utils import sanitize_path, validate_path_access


EXTENSION_TO_CATEGORY = {
    # Images
    ".jpg": "Images", ".jpeg": "Images", ".png": "Images", ".gif": "Images", ".webp": "Images", ".svg": "Images", ".bmp": "Images",
    # Videos
    ".mp4": "Videos", ".mkv": "Videos", ".avi": "Videos", ".mov": "Videos", ".webm": "Videos",
    # Audio
    ".mp3": "Audio", ".wav": "Audio", ".flac": "Audio", ".m4a": "Audio", ".ogg": "Audio",
    # Documents
    ".pdf": "Documents", ".doc": "Documents", ".docx": "Documents", ".txt": "Documents", ".md": "Documents",
    ".xls": "Documents", ".xlsx": "Documents", ".ppt": "Documents", ".pptx": "Documents",
    # Archives
    ".zip": "Archives", ".rar": "Archives", ".7z": "Archives", ".tar": "Archives", ".gz": "Archives",
    # Code
    ".py": "Code", ".js": "Code", ".ts": "Code", ".tsx": "Code", ".jsx": "Code", ".html": "Code", ".css": "Code", ".json": "Code",
}


def _unique_destination_path(destination_path):
    if not destination_path.exists():
        return destination_path

    stem = destination_path.stem
    suffix = destination_path.suffix
    parent = destination_path.parent
    counter = 1
    while True:
        candidate = parent / f"{stem} ({counter}){suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def _category_for_file(file_path):
    extension = file_path.suffix.lower()
    return EXTENSION_TO_CATEGORY.get(extension, "Other")


def organize_api(request, load_settings):
    """
    API endpoint handler for smart organize.
    Body:
      {
        "path": "optional target directory",
        "dryRun": true
      }
    """
    data = request.get_json() or {}
    dry_run = bool(data.get("dryRun", True))
    path_param = data.get("path", "")

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

    items = sorted(
        [item for item in resolved.iterdir() if item.is_file()],
        key=lambda item: (_category_for_file(item), item.name.lower()),
    )
    operations = []
    moved_count = 0
    skipped_count = 0
    error_count = 0

    for source in items:
        category = _category_for_file(source)
        category_dir = resolved / category
        destination = _unique_destination_path(category_dir / source.name)

        # Skip if file is effectively already in the same location.
        if source.parent == destination.parent and source.name == destination.name:
            skipped_count += 1
            continue

        operation = {
            "name": source.name,
            "fromPath": str(source).replace("\\", "/"),
            "toPath": str(destination).replace("\\", "/"),
            "category": category,
            "status": "preview" if dry_run else "moved",
        }

        try:
            if not dry_run:
                category_dir.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source), str(destination))
            moved_count += 1
        except Exception as err:
            operation["status"] = "error"
            operation["message"] = str(err)
            error_count += 1

        operations.append(operation)

    if not dry_run and moved_count > 0:
        log_operation(
            'organize',
            f'Organized {moved_count} file{"s" if moved_count != 1 else ""}',
            detail=f'in {resolved}'.replace('\\', '/'),
        )

    return jsonify({
        "path": str(resolved).replace("\\", "/"),
        "dryRun": dry_run,
        "totalFiles": len(items),
        "movedCount": moved_count,
        "skippedCount": skipped_count,
        "errorCount": error_count,
        "operations": operations,
    })
