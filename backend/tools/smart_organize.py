"""
Smart Organize Tool
Organize files into category folders using extension-based rules.
"""

import shutil
from flask import jsonify

from .file_browser import sanitize_path, get_allowed_roots, is_path_allowed


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


def smart_organize_api(request, load_settings):
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
    allowed_roots = get_allowed_roots(settings)

    if not is_path_allowed(target_path, allowed_roots):
        return jsonify({"error": "Access denied"}), 403

    if not target_path.exists() or not target_path.is_dir():
        return jsonify({
            "error": "Directory not found",
            "path": str(target_path).replace("\\", "/")
        }), 404

    items = sorted([item for item in target_path.iterdir() if item.is_file()], key=lambda item: item.name.lower())
    operations = []
    moved_count = 0
    skipped_count = 0
    error_count = 0

    for source in items:
        category = _category_for_file(source)
        category_dir = target_path / category
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

    return jsonify({
        "path": str(target_path).replace("\\", "/"),
        "dryRun": dry_run,
        "totalFiles": len(items),
        "movedCount": moved_count,
        "skippedCount": skipped_count,
        "errorCount": error_count,
        "operations": operations,
    })
