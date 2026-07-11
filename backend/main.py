from pathlib import Path
import logging
import sys

if __package__ is None:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from backend.settings import DEFAULT_SETTINGS, ensure_settings_file, load_settings, save_settings
from backend.pages.browse_files import list_files_api, delete_files_api, open_file_api
from backend.operations import get_operations_api
from backend.tools.rename import rename_api
from backend.tools.duplicates import duplicates_api
from backend.tools.convert import convert_api

BACKEND_DIR = Path(__file__).resolve().parent
if getattr(sys, 'frozen', False):
    STATIC_FOLDER = Path(sys._MEIPASS) / 'frontend'
else:
    STATIC_FOLDER = BACKEND_DIR.parent / 'frontend'
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
LOGGER = logging.getLogger(__name__)


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

@app.route('/api/files', methods=['GET'])
def list_files():
    """List files and directories at the given path"""
    return list_files_api(request, load_settings)

@app.route('/api/files/delete', methods=['POST'])
def delete_files():
    """Move a file or directory to the Recycle Bin"""
    return delete_files_api(request, load_settings)

@app.route('/api/files/open', methods=['POST'])
def open_file():
    """Open a file with the system default application."""
    return open_file_api(request, load_settings)

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


@app.route('/')
def index():
    return send_from_directory(STATIC_FOLDER, 'dashboard.html')


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

if __name__ == '__main__':
    from waitress import serve

    ensure_settings_file()
    serve(app, host='127.0.0.1', port=5000)