# Disk Kit - Desktop Application Entry Point
# This file launches Disk Kit as a native desktop app using PyWebView

import sys
import threading
import webview
from pathlib import Path
from waitress import serve

# Project root: source tree in dev, PyInstaller extract dir when frozen
ROOT_DIR = Path(getattr(sys, '_MEIPASS', Path(__file__).parent))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app


def run_server():
    """Run Flask server in a background thread on localhost:5000"""
    from backend.settings import ensure_settings_file
    ensure_settings_file()

    serve(app, host='127.0.0.1', port=5000)


def create_window():
    """Create and configure the PyWebView window"""
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
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    window = create_window()
    webview.start()
