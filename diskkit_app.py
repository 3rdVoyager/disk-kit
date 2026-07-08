# Disk Kit - Desktop Application Entry Point
# This file launches Disk Kit as a native desktop app using PyWebView

import os
import sys
import threading
import webview
from pathlib import Path

# Add backend directory to Python path
BACKEND_DIR = Path(__file__).parent / 'backend'
sys.path.insert(0, str(BACKEND_DIR))

# Import Flask app from backend.main
from backend.main import app


def run_flask_server():
    """Run Flask server in a background thread on localhost:5000"""
    # Ensure settings file exists before starting
    from backend.settings import ensure_settings_file
    ensure_settings_file()
    
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


def create_window():
    """Create and configure the PyWebView window"""
    
    # Get the absolute path to the icon
    icon_path = str(Path(__file__).parent / 'icon.ico')
    
    # Create window with custom settings
    window = webview.create_window(
        title='Disk Kit',
        url='http://127.0.0.1:5000',
        width=1200,
        height=800,
        min_size=(1000, 700),
        resizable=True,
        easy_drag=False,
        frameless=False,
        text_select=True,
    )
    
    return window


if __name__ == '__main__':
    # Start Flask server in a background thread
    server_thread = threading.Thread(target=run_flask_server, daemon=True)
    server_thread.start()
    
    # Create and start the webview window
    window = create_window()
    
    # Start the webview application
    webview.start()
