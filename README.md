# Disk Kit

Disk Kit is a locally hosted desktop-style file toolkit with a Flask backend and a web UI.

## Current v1 Scope

Implemented and supported now:
- Dashboard with tool shortcuts and future roadmap
- Browse Files (list directories, inspect files, move items to Recycle Bin within configured root)
- Convert Files (batch images to WebP/JPG/PNG)
- Batch Rename (preview/apply with collision detection)
- Duplicate Finder (exact match)
- Settings (theme, default root path, blocked paths, version check)

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

Settings are stored in:
- **Development:** `backend/settings.json` (auto-created on first run)
- **Packaged App:** `%LOCALAPPDATA%\DiskKit\settings.json`

```json
{
  "general": {
    "theme": "dark",
    "defaultPath": "C:/Users/YourName"
  },
  "security": {
    "blockedPaths": [],
    "disablePathProtections": false
  }
}
```

`security.blockedPaths` accepts an array of absolute paths (one per line in the Settings UI). Tools cannot browse, scan, or move items to the Recycle Bin inside blocked paths.

## API Endpoints

- `GET /api/version`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/settings/reset`
- `GET /api/files`
- `POST /api/files/delete`
- `POST /api/files/open`
- `GET /api/operations`
- `POST /api/convert`
- `POST /api/batch-rename`
- `GET /api/duplicates`

## Development Notes

- Server runs via Waitress on `127.0.0.1:5000` with `debug=False`.
- Runtime dependencies include `flask`, `waitress`, `send2trash`, `Pillow`, and `pywebview`.
- Frontend lives under `frontend/`.
- Backend tool handlers live under `backend/tools/`; core modules (file browser, settings, path utilities) live directly in `backend/`.

## License

Licensed under the MIT License.
