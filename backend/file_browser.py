"""
File Browser Module
Handles file system operations and directory listing for the Disk Kit application.
"""

from pathlib import Path
from flask import jsonify, request
import os
import shutil

ALLOWED_ROOTS = ['C:\\', 'D:\\', 'E:\\', 'F:\\']


def get_allowed_roots():
    """Return list of allowed root directories"""
    return ALLOWED_ROOTS


def is_path_allowed(target_path):
    """Check if the target path is within allowed roots"""
    target_str = str(target_path).upper()
    return any(target_str.startswith(root) for root in ALLOWED_ROOTS)


def sanitize_path(path_param, default_path):
    """
    Sanitize and build a safe target path from user input.
    Prevents directory traversal attacks.
    """
    if not path_param:
        return Path(default_path)
    
    # Normalize and sanitize the path
    clean_path = Path(path_param).as_posix().lstrip('/').replace('/', '\\')
    base_path = Path(default_path)
    target_path = base_path / clean_path
    
    return target_path


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
    
    # Get default path from settings
    settings = load_settings()
    default_path = settings.get('general', {}).get('defaultPath', 'C:/')
    
    # Build and sanitize target path
    target_path = sanitize_path(path_param, default_path)
    
    # Security check
    if not is_path_allowed(target_path):
        return jsonify({'error': 'Access denied'}), 403
    
    if not target_path.exists() or not target_path.is_dir():
        return jsonify({
            'error': 'Directory not found',
            'path': str(target_path).replace('\\', '/')
        }), 404
    
    items = get_directory_contents(target_path)
    
    return jsonify({
        'path': str(target_path).replace('\\', '/'),
        'items': items
    })


def delete_files_api(request):
    """
    API endpoint handler for deleting a file or directory.
    Expects JSON body with a 'path' field.
    """
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Missing path field'}), 400

        target_path = Path(data['path'])

        # Security check: ensure path is allowed
        if not is_path_allowed(target_path):
            return jsonify({'error': 'Access denied'}), 403

        if not target_path.exists():
            return jsonify({'error': 'Path not found'}), 404

        # Prevent deletion of drive roots
        if target_path.resolve().parent == target_path.resolve():
            return jsonify({'error': 'Cannot delete drive root'}), 403

        # Perform deletion
        if target_path.is_dir():
            shutil.rmtree(target_path)
        else:
            os.remove(target_path)

        return jsonify({'success': True, 'path': str(target_path).replace('\\', '/')})

    except PermissionError:
        return jsonify({'error': 'Permission denied'}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500
