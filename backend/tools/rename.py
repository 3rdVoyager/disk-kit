"""
Batch Rename Tool
Preview and apply deterministic file renaming rules.
"""

from flask import jsonify

from backend.path_utils import sanitize_path, validate_path_access


def _safe_int(value, default_value, min_value=1, max_value=999999):
    try:
        parsed = int(value)
        if parsed < min_value:
            return default_value
        return min(parsed, max_value)
    except (TypeError, ValueError):
        return default_value


def _build_new_name(item_path, index, payload):
    mode = payload.get("mode", "replace")
    stem = item_path.stem
    suffix = item_path.suffix

    if mode == "replace":
        find_text = payload.get("findText", "")
        replace_text = payload.get("replaceText", "")
        if not find_text:
            return None
        new_stem = stem.replace(find_text, replace_text)
    elif mode == "prefix-suffix":
        prefix = payload.get("prefix", "")
        suffix_text = payload.get("suffixText", "")
        new_stem = f"{prefix}{stem}{suffix_text}"
    elif mode == "numbering":
        base_name = payload.get("baseName", "file").strip() or "file"
        start_index = _safe_int(payload.get("startIndex"), 1)
        pad_width = _safe_int(payload.get("padWidth"), 3, 1, 8)
        current_number = start_index + index
        new_stem = f"{base_name}_{str(current_number).zfill(pad_width)}"
    else:
        return None

    if new_stem == stem:
        return None
    return f"{new_stem}{suffix}"


def rename_api(request, load_settings):
    """
    API endpoint handler for batch rename operations.
    Body:
      {
        "path": "optional path",
        "mode": "replace|prefix-suffix|numbering",
        "... rule fields ...",
        "dryRun": true
      }
    """
    data = request.get_json() or {}
    settings = load_settings()
    default_path = settings.get("general", {}).get("defaultPath", "C:/Users")
    target_path = sanitize_path(data.get("path", ""), default_path)
    resolved, error = validate_path_access(target_path, settings)
    if error:
        return jsonify({"error": error[0]}), error[1]
    dry_run = bool(data.get("dryRun", True))

    if not resolved.exists() or not resolved.is_dir():
        return jsonify({
            "error": "Directory not found",
            "path": str(resolved).replace("\\", "/")
        }), 404

    files = [item for item in resolved.iterdir() if item.is_file()]
    files.sort(key=lambda item: item.name.lower())

    results = []
    rename_count = 0
    skipped_count = 0
    error_count = 0

    for index, item in enumerate(files):
        try:
            new_name = _build_new_name(item, index, data)
            if not new_name:
                skipped_count += 1
                continue

            destination = item.with_name(new_name)
            if destination.exists():
                results.append({
                    "oldName": item.name,
                    "newName": new_name,
                    "status": "conflict",
                    "message": "Destination already exists",
                })
                error_count += 1
                continue

            if not dry_run:
                item.rename(destination)

            rename_count += 1
            results.append({
                "oldName": item.name,
                "newName": new_name,
                "status": "renamed" if not dry_run else "preview",
            })
        except Exception as err:
            error_count += 1
            results.append({
                "oldName": item.name,
                "newName": item.name,
                "status": "error",
                "message": str(err),
            })

    return jsonify({
        "path": str(resolved).replace("\\", "/"),
        "dryRun": dry_run,
        "mode": data.get("mode", "replace"),
        "totalFiles": len(files),
        "renamedCount": rename_count,
        "skippedCount": skipped_count,
        "errorCount": error_count,
        "items": results,
    })
