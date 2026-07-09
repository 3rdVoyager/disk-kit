import json
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / 'settings.json'

DEFAULT_SETTINGS = {
    "general": {
        "theme": "dark",
        "defaultPath": "C:/Users"
    },
    "quickTools": []
}


def ensure_settings_file():
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.write_text(json.dumps(DEFAULT_SETTINGS, indent=2))


def load_settings():
    ensure_settings_file()
    try:
        loaded = json.loads(SETTINGS_FILE.read_text())
        clean_loaded = sanitize_settings_update(loaded, DEFAULT_SETTINGS)
        return deep_merge(DEFAULT_SETTINGS, clean_loaded)
    except Exception:
        return DEFAULT_SETTINGS.copy()


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
    clean_update = sanitize_settings_update(settings, DEFAULT_SETTINGS)
    merged = deep_merge(current, clean_update)
    SETTINGS_FILE.write_text(json.dumps(merged, indent=2))