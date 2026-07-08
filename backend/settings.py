import json
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / 'settings.json'

DEFAULT_SETTINGS = {
    "general": {
        "theme": "dark",
        "language": "en",
        "defaultPath": "C:/Users"
    },
    "tools": {
        "defaultCompressionFormat": "zip",
        "batchSizeLimit": 100,
        "confirmBeforeDelete": True
    },
    "performance": {
        "maxConcurrentOperations": 4,
        "cacheSize": "512MB",
        "showProgressDetails": True
    },
    "ai": {
        "autoSuggestions": False,
        "apiEndpoint": "",
        "apiKey": ""
    },
    "quickTools": ["rename", "convert", "compress", "cleanup"]
}


def ensure_settings_file():
    if not SETTINGS_FILE.exists():
        SETTINGS_FILE.write_text(json.dumps(DEFAULT_SETTINGS, indent=2))


def load_settings():
    ensure_settings_file()
    try:
        return json.loads(SETTINGS_FILE.read_text())
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


def save_settings(settings):
    current = load_settings()
    merged = deep_merge(current, settings)
    SETTINGS_FILE.write_text(json.dumps(merged, indent=2))