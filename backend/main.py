from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from settings import DEFAULT_SETTINGS, ensure_settings_file, load_settings, save_settings
from tools.file_browser import list_files_api, delete_files_api
from tools.large_files import list_large_files_api
from tools.batch_rename import batch_rename_api
from tools.duplicate_finder import find_duplicates_api
from tools.smart_organize import smart_organize_api

BACKEND_DIR = Path(__file__).resolve().parent
STATIC_FOLDER = BACKEND_DIR.parent / 'frontend'
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
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

@app.route('/api/quick-tools', methods=['GET'])
def get_quick_tools():
    settings = load_settings()
    return jsonify({'quickTools': settings.get('quickTools', DEFAULT_SETTINGS.get('quickTools', []))})

@app.route('/api/quick-tools', methods=['POST'])
def update_quick_tools():
    try:
        data = request.get_json()
        if not data or 'quickTools' not in data:
            return jsonify({'error': 'Missing quickTools field'}), 400
        
        # Update only the quickTools field
        current_settings = load_settings()
        current_settings['quickTools'] = data['quickTools']
        save_settings(current_settings)
        return jsonify({'success': True, 'quickTools': current_settings['quickTools']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    """List files and directories at the given path"""
    return list_files_api(request, load_settings)

@app.route('/api/files/delete', methods=['POST'])
def delete_files():
    """Delete a file or directory"""
    return delete_files_api(request, load_settings)

@app.route('/api/large-files', methods=['GET'])
def large_files():
    """Scan for files above a minimum size threshold."""
    return list_large_files_api(request, load_settings)

@app.route('/api/batch-rename', methods=['POST'])
def batch_rename():
    """Preview/apply batch file rename in a directory."""
    return batch_rename_api(request, load_settings)

@app.route('/api/duplicates', methods=['GET'])
def find_duplicates():
    """Find duplicate files by size and hash."""
    return find_duplicates_api(request, load_settings)

@app.route('/api/organize', methods=['POST'])
def smart_organize():
    """Preview/apply smart organization rules."""
    return smart_organize_api(request, load_settings)

if __name__ == '__main__':
    ensure_settings_file()
    app.run(debug=False, port=5000)