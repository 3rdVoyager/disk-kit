from pathlib import Path
import json
import logging
import sys

if __package__ is None:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from backend.assets import assets_dir, ensure_logo, resolve_logo_path
from backend.settings import DEFAULT_SETTINGS, ensure_settings_file, load_settings, save_settings
from backend.operations import get_operations_api
from backend.tools.rename import rename_api
from backend.tools.duplicates import duplicates_api
from backend.tools.convert import convert_api
from backend.version import APP_VERSION

BACKEND_DIR = Path(__file__).resolve().parent
if getattr(sys, 'frozen', False):
    STATIC_FOLDER = Path(sys._MEIPASS) / 'frontend'
    APP_ROOT = Path(sys._MEIPASS)
else:
    STATIC_FOLDER = BACKEND_DIR.parent / 'frontend'
    APP_ROOT = BACKEND_DIR.parent
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
LOGGER = logging.getLogger(__name__)


def _app_root() -> Path:
    return APP_ROOT if getattr(sys, 'frozen', False) else BACKEND_DIR.parent


def _send_asset(path: Path):
    response = send_from_directory(path.parent, path.name)
    response.headers['Cache-Control'] = 'no-store'
    return response


def api_error(message, status_code):
    return jsonify({'error': message}), status_code

@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(load_settings())

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        data = request.get_json()
        if not data:
            return api_error('Invalid JSON', 400)
        save_settings(data)
        return jsonify({'success': True, 'settings': load_settings()})
    except Exception:
        LOGGER.exception('Failed to update settings')
        return api_error('Internal server error', 500)

@app.route('/api/settings/reset', methods=['POST'])
def reset_settings():
    save_settings(DEFAULT_SETTINGS)
    return jsonify({'success': True, 'settings': DEFAULT_SETTINGS})

@app.route('/api/operations', methods=['GET'])
def get_operations():
    """Return recent operation history."""
    return jsonify(get_operations_api(request))

@app.route('/api/batch-rename', methods=['POST'])
def batch_rename():
    """Preview/apply batch file rename in a directory."""
    return rename_api(request, load_settings)

@app.route('/api/duplicates', methods=['GET'])
def find_duplicates():
    """Find duplicate files by size and hash."""
    return duplicates_api(request, load_settings)

@app.route('/api/convert', methods=['POST'])
def convert_files():
    """Batch convert files."""
    return convert_api(request, load_settings)


@app.route('/api/version', methods=['GET'])
def get_version():
    """Return the current application version."""
    return jsonify({'version': APP_VERSION})


def _update_manifest_path():
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS) / 'docs' / 'release' / 'version.json'
    return BACKEND_DIR.parent / 'docs' / 'release' / 'version.json'


@app.route('/api/update-manifest', methods=['GET'])
def get_update_manifest():
    """Return the bundled update manifest for local/dev fallback."""
    manifest_path = _update_manifest_path()
    if manifest_path.exists():
        return jsonify(json.loads(manifest_path.read_text(encoding='utf-8')))
    return jsonify({
        'version': APP_VERSION,
        'downloadUrl': 'https://github.com/3rdVoyager/disk-kit/releases/latest',
        'notes': '',
    })


@app.route('/')
def index():
    return send_from_directory(STATIC_FOLDER, 'dashboard.html')


@app.route('/assets/<path:filename>')
def asset_files(filename):
    directory = assets_dir(_app_root())
    file_path = (directory / filename).resolve()
    if not file_path.is_file() or directory.resolve() not in file_path.parents:
        return '', 404
    return _send_asset(file_path)


@app.route('/logo')
def logo():
    logo_path = ensure_logo(_app_root())
    if logo_path is None:
        return '', 404
    return _send_asset(logo_path)


@app.route('/favicon.ico')
def favicon():
    logo_path = ensure_logo(_app_root())
    if logo_path is None:
        return '', 404
    return _send_asset(logo_path)


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(STATIC_FOLDER, path)


@app.errorhandler(Exception)
def handle_unexpected_error(err):
    """Return safe JSON for unexpected API errors."""
    if isinstance(err, HTTPException):
        return err
    LOGGER.exception('Unhandled error on %s', request.path)
    if request.path.startswith('/api/'):
        return api_error('Internal server error', 500)
    return 'Internal server error', 500
