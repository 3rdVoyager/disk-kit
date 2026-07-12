# Disk Kit - Browser development preview
# Serves the UI locally and opens it in your default browser.

import sys
import webbrowser
from pathlib import Path

from waitress import serve

APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from backend.main import app
from backend.settings import ensure_settings_file

HOST = '127.0.0.1'
PORT = 5000
URL = f'http://{HOST}:{PORT}'


def main():
    ensure_settings_file()
    print(f'Disk Kit dev preview at {URL}')
    print('Native folder browse is disabled in browser mode — paste paths manually.')
    webbrowser.open(URL)
    serve(app, host=HOST, port=PORT)


if __name__ == '__main__':
    main()
