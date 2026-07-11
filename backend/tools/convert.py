"""
Convert Files Tool
Batch convert images via Pillow.
"""

from pathlib import Path
from flask import jsonify
from PIL import Image
from send2trash import send2trash
from backend.path_utils import sanitize_path, validate_path_access
from backend.operations import log_operation

IMAGE_INPUT_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tiff"}
IMAGE_OUTPUT_FORMATS = {"jpeg", "png", "webp"}


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


def _resolve_target_path(path_param, load_settings):
    settings = load_settings()
    default_path = settings.get("general", {}).get("defaultPath", "C:/Users")
    target_path = sanitize_path(path_param, default_path)
    resolved, error = validate_path_access(target_path, settings)
    if error:
        return None, error
    if not resolved.exists() or not resolved.is_dir():
        return None, ("Directory not found", 404)
    return resolved, None


def _resolve_output_dir(resolved, output_mode, custom_output_path, settings):
    if output_mode == "subfolder":
        return resolved / "_converted", None
    if output_mode == "custom" and custom_output_path:
        out_dir = Path(custom_output_path)
        out_resolved, out_error = validate_path_access(out_dir, settings)
        if out_error:
            return None, (f"Invalid output path: {out_error[0]}", out_error[1])
        return out_resolved, None
    return resolved, None


def _recycle_original(source_path, item_result):
    try:
        send2trash(str(source_path))
        item_result["originalRecycled"] = True
        return True
    except Exception as delete_error:
        item_result["originalRecycled"] = False
        item_result["message"] = f"Converted, but could not recycle original: {delete_error}"
        return False


def _convert_images(resolved, out_dir, options):
    output_format = options["output_format"]
    quality = options["quality"]
    max_width = options["max_width"]
    max_height = options["max_height"]
    strip_metadata = options["strip_metadata"]
    delete_originals = options["delete_originals"]
    dry_run = options["dry_run"]

    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(
        [f for f in resolved.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_INPUT_EXTS],
        key=lambda item: item.name.lower(),
    )
    results = []
    converted_count = 0
    deleted_count = 0
    error_count = 0
    skipped_count = 0

    for source in files:
        is_same_format = source.suffix.lower().lstrip(".") == output_format
        if output_format == "jpeg" and source.suffix.lower() in {".jpg", ".jpeg"}:
            is_same_format = True

        needs_processing = not is_same_format or max_width or max_height or strip_metadata
        target_ext = ".jpg" if output_format == "jpeg" else f".{output_format}"
        dest_path = out_dir / (source.stem + target_ext)
        if not dry_run:
            dest_path = _unique_destination_path(dest_path)

        item_result = {
            "name": source.name,
            "originalPath": str(source).replace("\\", "/"),
            "originalSize": source.stat().st_size,
            "outputPath": str(dest_path).replace("\\", "/"),
            "status": "pending",
        }

        if not needs_processing:
            item_result["status"] = "skipped"
            item_result["message"] = "Already in target format"
            skipped_count += 1
            results.append(item_result)
            continue

        if dry_run:
            item_result["status"] = "preview"
            results.append(item_result)
            continue

        try:
            with Image.open(source) as img:
                if max_width or max_height:
                    width, height = img.size
                    max_w = int(max_width) if max_width else width
                    max_h = int(max_height) if max_height else height
                    ratio = min(max_w / width, max_h / height)
                    if ratio < 1:
                        img = img.resize((int(width * ratio), int(height * ratio)), Image.Resampling.LANCZOS)

                if output_format == "jpeg" and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                save_args = {"quality": quality} if output_format in ("jpeg", "webp") else {}
                if not strip_metadata and "exif" in img.info:
                    save_args["exif"] = img.info["exif"]

                img.save(dest_path, format=output_format.upper(), **save_args)

            item_result["status"] = "completed"
            item_result["newSize"] = dest_path.stat().st_size
            converted_count += 1
            if delete_originals and _recycle_original(source, item_result):
                deleted_count += 1
        except Exception as exc:
            item_result["status"] = "error"
            item_result["message"] = str(exc)
            error_count += 1

        results.append(item_result)

    return {
        "convertedCount": converted_count,
        "deletedCount": deleted_count,
        "skippedCount": skipped_count,
        "errorCount": error_count,
        "operations": results,
    }


def convert_api(request, load_settings):
    data = request.get_json() or {}
    path_param = data.get("path", "")
    category = data.get("category", "images")
    output_format = data.get("outputFormat", "webp").lower()
    quality = int(data.get("quality", 85))
    max_width = data.get("maxWidth")
    max_height = data.get("maxHeight")
    strip_metadata = bool(data.get("stripMetadata", True))
    delete_originals = bool(data.get("deleteOriginals", False))
    output_mode = data.get("outputMode", "subfolder")
    custom_output_path = data.get("outputPath", "")
    dry_run = bool(data.get("dryRun", True))

    if category != "images":
        return jsonify({"error": f"Category '{category}' is not supported"}), 400

    if output_format not in IMAGE_OUTPUT_FORMATS:
        return jsonify({"error": f"Output format '{output_format}' is not supported"}), 400

    resolved, error = _resolve_target_path(path_param, load_settings)
    if error:
        return jsonify({"error": error[0]}), error[1]

    settings = load_settings()
    out_dir, out_error = _resolve_output_dir(resolved, output_mode, custom_output_path, settings)
    if out_error:
        return jsonify({"error": out_error[0]}), out_error[1]

    result = _convert_images(resolved, out_dir, {
        "output_format": output_format,
        "quality": quality,
        "max_width": max_width,
        "max_height": max_height,
        "strip_metadata": strip_metadata,
        "delete_originals": delete_originals,
        "dry_run": dry_run,
    })

    if not dry_run and result["convertedCount"] > 0:
        log_operation("convert", f"Converted {result['convertedCount']} images", f"Folder: {resolved}")

    return jsonify({
        "path": str(resolved).replace("\\", "/"),
        **result,
    })
