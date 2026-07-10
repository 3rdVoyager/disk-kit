# Disk Kit

Disk Kit is a locally hosted desktop-style file toolkit with a Flask backend and a web UI.

## Current v1 Scope

Implemented and supported now:
- Dashboard shell UI
- Browse Files (list directories, inspect files, move items to Recycle Bin within configured root)
- Large Files scanner
- Batch Rename (preview/apply)
- Duplicate Finder
- Smart Organize (preview/apply)
- Settings (theme, default root path, blocked paths)
- Quick Tools customization

Planned items shown in older docs/UI are not part of shipped v1 unless listed above.

## Security Model (Current)

- Backend serves local UI and API on `http://127.0.0.1:5000` via Waitress (production WSGI server).
- File operations are restricted to `general.defaultPath` (fallback `C:/Users`).
- Paths are resolved before access checks so symlinks/junctions cannot escape the sandbox.
- User-configurable `security.blockedPaths` denies browse, scan, and delete inside listed folders.
- System paths (`C:/Windows`, `C:/Program Files`) are always blocked.
- Deletes move items to the Recycle Bin (`send2trash`), not permanent removal.
- Settings schema is allowlisted; unknown keys are dropped.
- API errors return safe user-facing messages instead of raw exceptions.
- The frontend is not trusted for security; all path checks run in Python on every request.

## Installation

### Prerequisites
- Python 3.9+
- `pip`

### Setup

```bash
pip install -r backend/requirements.txt
python -m backend.main
```

Open `http://127.0.0.1:5000`.

## Desktop App (PyWebView)

Run desktop mode without building:

```bash
python diskkit_app.py
```

## Build and Release

Installer-first release flow:

```bash
python scripts/prepare_release.py
```

## Settings

Settings are stored in `backend/settings.json`:

```json
{
  "general": {
    "theme": "dark",
    "defaultPath": "C:/Users"
  },
  "security": {
    "blockedPaths": []
  },
  "quickTools": [
    "large-files",
    "rename",
    "duplicates",
    "organize"
  ]
}
```

`security.blockedPaths` accepts an array of absolute paths (one per line in the Settings UI). Tools cannot browse, scan, or move items to the Recycle Bin inside blocked paths.

## API Endpoints

- `GET /api/settings`
- `POST /api/settings`
- `POST /api/settings/reset`
- `GET /api/settings/defaults`
- `GET /api/quick-tools`
- `POST /api/quick-tools`
- `GET /api/files`
- `POST /api/files/delete`
- `GET /api/large-files`
- `POST /api/batch-rename`
- `GET /api/duplicates`
- `POST /api/organize`

## Development Notes

- Server runs via Waitress on `127.0.0.1:5000` with `debug=False`.
- Runtime dependencies include `flask`, `waitress`, `send2trash`, and `pywebview`.
- Frontend lives under `frontend/`.
- Backend tool handlers live under `backend/tools/`; core modules (file browser, settings, path utilities) live directly in `backend/`.

## License

Licensed under the MIT License.
