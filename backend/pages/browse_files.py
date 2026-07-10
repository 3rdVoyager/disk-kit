"""
File Browser Module
Core file system browsing and deletion handlers for the Disk Kit application.
"""

import errno
import logging
import os
import sys

from flask import jsonify

from backend.operations import log_operation
from send2trash import send2trash

from backend.path_utils import (
    get_allowed_roots,
    get_default_working_path,
    is_protections_disabled,
    sanitize_path,
    validate_path_access,
)

LOGGER = logging.getLogger(__name__)


def _access_error_message(error):
    message, _status = error
    if message == 'Access denied':
        return (
            'Access denied. This item is outside your configured default folder, '
            'or it resolves to a restricted system location.'
        )
    if message == 'Path is blocked by settings':
        return 'This path is blocked in Settings.'
    return message


def get_directory_contents(target_path):
    """
    Get a list of files and directories at the target path.
    Returns a list of dicts with file/directory information.
    """
    items = []

    try:
        for item in target_path.iterdir():
            try:
                item_stat = item.stat()
                is_dir = item.is_dir()

                items.append({
                    'name': item.name,
                    'path': str(item.relative_to(target_path.parent)).replace('\\', '/'),
                    'fullPath': str(item).replace('\\', '/'),
                    'type': 'directory' if is_dir else 'file',
                    'size': item_stat.st_size if not is_dir else 0,
                    'modified': int(item_stat.st_mtime * 1000),
                    'created': int(item_stat.st_ctime * 1000),
                })
            except (PermissionError, OSError, FileNotFoundError):
                # Skip files we can't access
                continue
    except Exception:
        # If we can't read the directory at all, return empty list
        pass

    # Sort directories first, then files, both alphabetically
    items.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))

    return items


def list_files_api(request, load_settings):
    """
    API endpoint handler for listing files.
    This function is designed to be registered as a Flask route.
    """
    path_param = request.args.get('path', '')

    settings = load_settings()
    default_path = str(get_default_working_path(settings)).replace('\\', '/')

    target_path = sanitize_path(path_param, default_path)
    resolved, error = validate_path_access(target_path, settings)
    if error:
        return jsonify({'error': error[0]}), error[1]

    if not resolved.exists() or not resolved.is_dir():
        return jsonify({
            'error': 'Directory not found',
            'path': str(resolved).replace('\\', '/')
        }), 404

    items = get_directory_contents(resolved)
    protections_off = is_protections_disabled(settings)
    for item in items:
        if protections_off:
            item['accessRestricted'] = False
        else:
            _, item_error = validate_path_access(item['fullPath'], settings)
            item['accessRestricted'] = bool(item_error)

    if protections_off:
        root = ''
    else:
        allowed_roots = get_allowed_roots(settings)
        root = str(allowed_roots[0]).replace('\\', '/') if allowed_roots else default_path

    return jsonify({
        'path': str(resolved).replace('\\', '/'),
        'root': root,
        'protectionsDisabled': protections_off,
        'items': items
    })


def delete_files_api(request, load_settings):
    """
    API endpoint handler for moving a file or directory to the Recycle Bin.
    Expects JSON body with a 'path' field.
    """
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Missing path field'}), 400

        settings = load_settings()
        default_path = settings.get('general', {}).get('defaultPath', 'C:/Users')
        target_path = sanitize_path(data['path'], default_path)
        resolved, error = validate_path_access(target_path, settings)
        if error:
            return jsonify({'error': _access_error_message(error)}), error[1]

        if not resolved.exists():
            return jsonify({'error': 'Path not found'}), 404

        if not is_protections_disabled(settings):
            allowed_roots = get_allowed_roots(settings)
            if any(resolved == root for root in allowed_roots):
                return jsonify({'error': 'Cannot delete allowed root'}), 403

        send2trash(str(resolved))

        display_path = str(resolved).replace('\\', '/')
        log_operation(
            'delete',
            f'Moved to Recycle Bin: {resolved.name}',
            detail=f'in {resolved.parent}'.replace('\\', '/'),
        )

        return jsonify({'success': True, 'path': display_path})

    except PermissionError as err:
        return jsonify({'error': f'Permission denied: {err}'}), 403
    except OSError as err:
        winerror = getattr(err, 'winerror', None)
        if err.errno in (errno.EACCES, errno.EPERM) or winerror in (5, 13):
            return jsonify({'error': f'Permission denied: {err.strerror or err}'}), 403
        LOGGER.exception('Failed to move path to Recycle Bin')
        return jsonify({'error': str(err) or 'Failed to move to Recycle Bin'}), 500


def open_file_api(request, load_settings):
    """Open a file with the system default application."""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Missing path field'}), 400

        settings = load_settings()
        default_path = settings.get('general', {}).get('defaultPath', 'C:/Users')
        target_path = sanitize_path(data['path'], default_path)
        resolved, error = validate_path_access(target_path, settings)
        if error:
            return jsonify({'error': _access_error_message(error)}), error[1]

        if not resolved.exists():
            return jsonify({'error': 'Path not found'}), 404
        if resolved.is_dir():
            return jsonify({'error': 'Cannot open a folder with Open'}), 400

        if sys.platform == 'win32':
            os.startfile(str(resolved))
        else:
            import subprocess
            opener = 'open' if sys.platform == 'darwin' else 'xdg-open'
            subprocess.run([opener, str(resolved)], check=False)

        return jsonify({'success': True, 'path': str(resolved).replace('\\', '/')})
    except OSError as err:
        return jsonify({'error': str(err)}), 500
    except Exception:
        LOGGER.exception('Failed to open file')
        return jsonify({'error': 'Failed to open file'}), 500
