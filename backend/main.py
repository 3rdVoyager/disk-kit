import json
import os
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BACKEND_DIR = Path(__file__).resolve().parent
STATIC_FOLDER = BACKEND_DIR.parent / 'frontend'
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
CORS(app)

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
    }
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

@app.route('/')
def index():
    return send_from_directory(STATIC_FOLDER, 'dashboard.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(STATIC_FOLDER, path)

@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON'}), 400
        save_settings(data)
        return jsonify({'success': True, 'settings': load_settings()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/reset', methods=['POST'])
def reset_settings():
    save_settings(DEFAULT_SETTINGS)
    return jsonify({'success': True, 'settings': DEFAULT_SETTINGS})

@app.route('/api/settings/defaults', methods=['GET'])
def get_defaults():
    return jsonify(DEFAULT_SETTINGS)

if __name__ == '__main__':
    ensure_settings_file()
    app.run(debug=True, port=5000)