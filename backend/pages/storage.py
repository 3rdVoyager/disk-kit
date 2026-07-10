"""Storage overview API — C: drive usage plus largest folders under the configured path."""

import os
import shutil
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from flask import jsonify

from backend.path_utils import get_folder_scan_root

FOLDER_SCAN_TIMEOUT_SEC = 4.0
MAX_FOLDER_BREAKDOWN = 5
MAX_FOLDER_BREAKDOWN_DETAIL = 20
MAX_SCAN_WORKERS = 4


def _system_drive_root():
    """Primary system drive used for total storage overview."""
    if sys.platform == 'win32':
        return 'C:/'
    return '/'


def _folder_size_with_timeout(folder_path, timeout=FOLDER_SCAN_TIMEOUT_SEC):
    result = {'size': 0, 'partial': False}
    stop = threading.Event()

    def worker():
        try:
            for root, _dirs, files in os.walk(folder_path, topdown=True, followlinks=False):
                if stop.is_set():
                    result['partial'] = True
                    return
                for filename in files:
                    if stop.is_set():
                        result['partial'] = True
                        return
                    file_path = Path(root) / filename
                    try:
                        result['size'] += file_path.stat().st_size
                    except (OSError, PermissionError, FileNotFoundError):
                        continue
        except OSError:
            return

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    thread.join(timeout)
    if thread.is_alive():
        stop.set()
        thread.join(0.25)
        result['partial'] = True
    return result['size'], result['partial']


def _top_level_folders(scan_root):
    root = Path(scan_root)
    folders = []
    try:
        for entry in root.iterdir():
            if entry.is_dir():
                folders.append(entry)
    except OSError:
        return []
    return folders


def _root_files_size(scan_root):
    size = 0
    try:
        for entry in Path(scan_root).iterdir():
            if entry.is_file():
                try:
                    size += entry.stat().st_size
                except (OSError, PermissionError, FileNotFoundError):
                    continue
    except OSError:
        return 0
    return size


def _scan_top_level_folders(scan_root):
    folders = _top_level_folders(scan_root)
    if not folders:
        return [], 0, False

    scanned = []
    partial = False
    workers = min(MAX_SCAN_WORKERS, len(folders))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(_folder_size_with_timeout, folder): folder
            for folder in folders
        }
        for future in as_completed(futures):
            folder = futures[future]
            try:
                size, timed_out = future.result()
            except Exception:
                continue
            if timed_out:
                partial = True
            if size <= 0:
                continue
            scanned.append({
                'name': folder.name,
                'path': str(folder).replace('\\', '/'),
                'size': size,
                'partial': timed_out,
            })

    total_size = sum(item['size'] for item in scanned) + _root_files_size(scan_root)
    return scanned, total_size, partial


def _folder_breakdown(scanned, path_used, folder_limit=MAX_FOLDER_BREAKDOWN):
    if not scanned:
        return [], False

    partial = any(item['partial'] for item in scanned)
    ranked = sorted(scanned, key=lambda item: item['size'], reverse=True)
    top = ranked[:folder_limit]
    if not top:
        return [], partial

    max_size = top[0]['size'] or 1
    used = path_used or max_size
    breakdown = []
    for item in top:
        breakdown.append({
            'name': item['name'],
            'path': item['path'],
            'size': item['size'],
            'partial': item['partial'],
            'barPercent': round((item['size'] / max_size) * 100),
            'usedPercent': round((item['size'] / used) * 100, 1) if used else 0,
        })

    return breakdown, partial


def storage_api(request, load_settings):

    settings = load_settings()
    default_path = settings.get('general', {}).get('defaultPath', 'C:/Users')
    folder_scan_root = get_folder_scan_root(settings)
    drive_root = _system_drive_root()
    folder_scan_root_display = str(folder_scan_root).replace('\\', '/')

    try:
        usage = shutil.disk_usage(drive_root)
    except OSError as err:
        return jsonify({'error': str(err)}), 500

    drive_free = usage.free
    drive_total = usage.total
    drive_used = usage.used

    scanned, _path_used, path_scan_partial = _scan_top_level_folders(folder_scan_root)

    try:
        folder_limit = int(request.args.get('folderLimit', MAX_FOLDER_BREAKDOWN))
    except (TypeError, ValueError):
        folder_limit = MAX_FOLDER_BREAKDOWN
    folder_limit = max(1, min(folder_limit, MAX_FOLDER_BREAKDOWN_DETAIL))

    folders, folder_scan_partial = _folder_breakdown(scanned, _path_used, folder_limit)

    used_percent = round((drive_used / drive_total) * 100, 1) if drive_total else 0

    return jsonify({
        'drive': drive_root.rstrip('/'),
        'path': default_path.replace('\\', '/'),
        'folderScanRoot': folder_scan_root_display,
        'total': drive_total,
        'used': drive_used,
        'free': drive_free,
        'usedPercent': used_percent,
        'pathScanPartial': path_scan_partial,
        'folders': folders,
        'folderScanPartial': folder_scan_partial,
    })
