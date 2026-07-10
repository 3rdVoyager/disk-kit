import json
import os
import sys
from pathlib import Path

from backend.path_utils import GENERIC_USERS_ROOTS, normalize_path


def _settings_file_path():
    """Use a writable user directory when running as a packaged EXE."""
    if getattr(sys, 'frozen', False):
        base = Path(os.environ.get('LOCALAPPDATA', Path.home())) / 'DiskKit'
        base.mkdir(parents=True, exist_ok=True)
        return base / 'settings.json'
    return Path(__file__).parent / 'settings.json'


SETTINGS_FILE = _settings_file_path()


def _detect_default_path():
    """Detect the signed-in user's home directory."""
    return str(Path.home()).replace('\\', '/')


def default_settings():
    return {
        "general": {
            "theme": "dark",
            "defaultPath": _detect_default_path(),
            "folderScanPath": "",
        },
        "security": {
            "blockedPaths": [],
            "disablePathProtections": False,
        },
        "quickTools": []
    }


DEFAULT_SETTINGS = default_settings()


def _migrate_legacy_default_path(settings):
    """
    Upgrade legacy generic C:/Users defaultPath to the current user profile.
    Returns (settings, changed).
    """
    raw = settings.get('general', {}).get('defaultPath')
    if not raw:
        return settings, False
    try:
        candidate = normalize_path(raw)
    except (OSError, ValueError):
        return settings, False
    if candidate not in GENERIC_USERS_ROOTS:
        return settings, False
    migrated = deep_merge(settings, {
        'general': {'defaultPath': _detect_default_path()},
    })
    return migrated, True


def ensure_settings_file():
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.write_text(json.dumps(default_settings(), indent=2))


def load_settings():
    ensure_settings_file()
    try:
        loaded = json.loads(SETTINGS_FILE.read_text())
        clean_loaded = sanitize_settings_update(loaded, default_settings())
        merged = deep_merge(default_settings(), clean_loaded)
        migrated, changed = _migrate_legacy_default_path(merged)
        if changed:
            SETTINGS_FILE.write_text(json.dumps(migrated, indent=2))
        return migrated
    except Exception:
        return default_settings().copy()


def deep_merge(base, override):
    if not isinstance(override, dict) or not isinstance(base, dict):
        return override
    result = dict(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def coerce_leaf_value(default_value, incoming_value):
    """Coerce incoming value to expected type where safe."""
    if isinstance(default_value, bool):
        return bool(incoming_value)
    if isinstance(default_value, int) and not isinstance(default_value, bool):
        if isinstance(incoming_value, (int, float)):
            return int(incoming_value)
        return default_value
    if isinstance(default_value, str):
        if incoming_value is None:
            return default_value
        return str(incoming_value)
    if isinstance(default_value, list):
        return incoming_value if isinstance(incoming_value, list) else default_value
    return incoming_value


def sanitize_settings_update(update, schema):
    """
    Keep only known keys and expected value shapes from DEFAULT_SETTINGS.
    """
    if not isinstance(update, dict):
        return {}

    clean = {}
    for key, value in update.items():
        if key not in schema:
            continue
        default_value = schema[key]
        if isinstance(default_value, dict):
            nested = sanitize_settings_update(value, default_value) if isinstance(value, dict) else {}
            if nested:
                clean[key] = nested
        else:
            clean[key] = coerce_leaf_value(default_value, value)
    return clean


def save_settings(settings):
    current = load_settings()
    clean_update = sanitize_settings_update(settings, default_settings())
    merged = deep_merge(current, clean_update)
    SETTINGS_FILE.write_text(json.dumps(merged, indent=2))
