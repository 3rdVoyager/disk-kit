"""File search API — recursive filename and folder-name search under a validated path."""

import os
from pathlib import Path

from flask import jsonify

from backend.path_utils import sanitize_path, validate_path_access

MAX_SEARCH_RESULTS = 500
DEFAULT_SEARCH_LIMIT = 100


def _append_match(results, path_obj, item_type):
    try:
        stat = path_obj.stat()
        results.append({
            'name': path_obj.name,
            'fullPath': str(path_obj).replace('\\', '/'),
            'type': item_type,
            'size': 0 if item_type == 'directory' else stat.st_size,
            'modified': int(stat.st_mtime * 1000),
        })
    except (PermissionError, OSError):
        pass


def _search_directory(root, query, settings, limit, results):
    query_lower = query.lower()
    try:
        for dirpath, dirnames, filenames in os.walk(root):
            if len(results) >= limit:
                return

            # Match folders before pruning blocked subtrees so names still appear.
            matched_dirs = []
            kept_dirs = []
            for dirname in dirnames:
                if _is_blocked_join(dirpath, dirname, settings):
                    continue
                kept_dirs.append(dirname)
                if query_lower in dirname.lower() and len(results) < limit:
                    matched_dirs.append(dirname)

            dirnames[:] = kept_dirs

            for dirname in matched_dirs:
                if len(results) >= limit:
                    return
                _append_match(results, Path(dirpath) / dirname, 'directory')

            for name in filenames:
                if len(results) >= limit:
                    return
                if query_lower not in name.lower():
                    continue
                _append_match(results, Path(dirpath) / name, 'file')
    except (PermissionError, OSError):
        pass


def _is_blocked_join(dirpath, dirname, settings):
    candidate = Path(dirpath) / dirname
    _, error = validate_path_access(str(candidate), settings)
    return bool(error)


def search_files_api(request, load_settings):
    query = (request.args.get('q') or '').strip()
    if not query:
        return jsonify({'error': 'Missing search query'}), 400

    settings = load_settings()
    default_path = settings.get('general', {}).get('defaultPath', 'C:/Users')
    path_param = request.args.get('path', default_path)

    try:
        limit = min(int(request.args.get('limit', DEFAULT_SEARCH_LIMIT)), MAX_SEARCH_RESULTS)
    except (TypeError, ValueError):
        limit = DEFAULT_SEARCH_LIMIT

    target_path = sanitize_path(path_param, default_path)
    resolved, error = validate_path_access(target_path, settings)
    if error:
        return jsonify({'error': error[0]}), error[1]

    if not resolved.exists() or not resolved.is_dir():
        return jsonify({'error': 'Directory not found'}), 404

    results = []
    _search_directory(str(resolved), query, settings, limit, results)
    results.sort(key=lambda item: (item['type'] != 'directory', item['name'].lower()))

    return jsonify({
        'query': query,
        'path': str(resolved).replace('\\', '/'),
        'items': results,
        'truncated': len(results) >= limit,
    })
