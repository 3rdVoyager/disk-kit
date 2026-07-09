# Disk Kit

Disk Kit is a locally hosted desktop-style file toolkit with a Flask backend and a web UI.

## Current v1 Scope

Implemented and supported now:
- Dashboard shell UI
- Browse Files (list directories, inspect files, delete files/folders within configured root)
- Large Files scanner
- Batch Rename (preview/apply)
- Duplicate Finder
- Smart Organize (preview/apply)
- Settings (theme + default root path)
- Quick Tools customization

Planned items shown in older docs/UI are not part of shipped v1 unless listed above.

## Security Model (Current)

- Backend serves local UI and API on `http://127.0.0.1:5000`.
- File operations are restricted to `general.defaultPath` (fallback `C:/Users`).
- Settings schema is allowlisted; unknown keys are dropped.
- API errors return safe user-facing messages instead of raw exceptions.

## Installation

### Prerequisites
- Python 3.9+
- `pip`

### Setup

```bash
pip install -r backend/requirements.txt
python backend/main.py
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
  "quickTools": [
    "large-files",
    "rename",
    "duplicates",
    "organize"
  ]
}
```

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

- Server default is `debug=False`.
- Frontend lives under `frontend/`.
- Backend tool handlers live under `backend/tools/`; core modules (file browser, settings, path utilities) live directly in `backend/`.

## License

Licensed under the MIT License.
