from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from settings import DEFAULT_SETTINGS, ensure_settings_file, load_settings, save_settings

BACKEND_DIR = Path(__file__).resolve().parent
STATIC_FOLDER = BACKEND_DIR.parent / 'frontend'
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
CORS(app)
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

if __name__ == '__main__':
    ensure_settings_file()
    app.run(debug=True, port=5000)