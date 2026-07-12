# Disk Kit - Desktop Application Entry Point
# This file launches Disk Kit as a native desktop app using PyWebView

import ctypes
import sys
import threading
import webview
from pathlib import Path
from waitress import serve

# Project root: source tree in dev, PyInstaller extract dir when frozen
APP_DIR = Path(__file__).resolve().parent
ROOT_DIR = Path(getattr(sys, '_MEIPASS', APP_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.main import app
from backend.assets import ensure_windows_icon, sync_frontend_logo


def _resolve_icon_path() -> Path | None:
    icon = ensure_windows_icon(APP_DIR)
    return icon.resolve() if icon else None


def _prepare_brand_assets() -> None:
    sync_frontend_logo(APP_DIR)


def _set_windows_app_id() -> None:
    if sys.platform != 'win32':
        return
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID('3rdVoyager.DiskKit')
    except Exception:
        pass


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
    _set_windows_app_id()
    _prepare_brand_assets()

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    window = create_window()
    start_kwargs = {}
    icon_path = _resolve_icon_path()
    if icon_path:
        start_kwargs['icon'] = str(icon_path)
    webview.start(**start_kwargs)
