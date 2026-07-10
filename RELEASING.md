# Disk Kit Releasing Guide

This guide defines the official v1 release process.

## Release Policy

- Primary distribution artifact: **Inno Setup installer**
- Secondary artifact: **portable ZIP**
- Official release entrypoint: `scripts/prepare_release.py`

## Prerequisites

- Python 3.14+
- Inno Setup 6+ or 7 installed (`ISCC.exe`)
  - Download: [https://jrsoftware.org/isdl.php](https://jrsoftware.org/isdl.php)

## One Command Release Build

```bash
python scripts/prepare_release.py
```

This command will:
1. Clean build/release artifacts
2. Build `dist/DiskKit.exe` with PyInstaller
3. Build installer from `DiskKit.iss` (when Inno Setup is installed)
4. Create portable ZIP
5. Generate release notes
6. Remove intermediate `dist/`, `build/`, and `installer/` folders (final artifacts stay in `releases/`)

## Output Artifacts

All publishable files end up in `releases/`:

- `releases/DiskKit-Setup-<version>.exe`
- `releases/DiskKit-Portable-<version>-<date>.zip`
- `releases/RELEASE_NOTES_v<version>.txt`

Intermediate folders (`dist/`, `build/`, `installer/`) are removed automatically at the end of the release script.

## Release Priority

1. `DiskKit-Setup-<version>.exe` (primary)
2. `DiskKit-Portable-<version>-<date>.zip` (secondary fallback)

## Publish Folder

Publish files from `releases/`:
- installer EXE
- portable ZIP
- release notes

## Release Notes Workflow

Release notes are generated from a template file, not edited in Python.

**Source template (edit this):**
- `docs/release/release-notes.template.md`

**Generated output (do not edit by hand):**
- `releases/RELEASE_NOTES_v<version>.txt`

### How to update release notes

1. Edit `docs/release/release-notes.template.md`
   - Update the **What's New** bullets
   - Update **Known Issues** if needed
2. Bump version in:
   - `APP_VERSION` in `scripts/prepare_release.py`
   - `#define AppVersion` in `DiskKit.iss`
3. Run:
   ```bash
   python scripts/prepare_release.py
   ```
4. Review generated file in `releases/` before publishing

### Template placeholders

The release script replaces these automatically:
- `{{version}}` -> current `APP_VERSION`
- `{{date}}` -> build date (for example: `July 08, 2026`)

## Version Bump Checklist

Before each release:
- Update `APP_VERSION` in `scripts/prepare_release.py`
- Update `#define AppVersion` in `DiskKit.iss`
- Update `docs/release/release-notes.template.md`
- **Do not change** `AppId` in `DiskKit.iss` (required for in-place upgrades)

## Updates (How Users Upgrade)

### Installer users (recommended)

**Yes — running a newer installer upgrades the existing install.**

Disk Kit uses a stable Inno `AppId` in `DiskKit.iss`. When a user already has Disk Kit installed and runs a newer `DiskKit-Setup-<version>.exe`:

1. Inno detects the existing installation
2. The old app files are replaced in the same install folder
3. Shortcuts and the Installed Apps entry are updated to the new version
4. Uninstall still works from Windows Settings

**User steps to update:**
1. Download the latest `DiskKit-Setup-<version>.exe` from GitHub Releases
2. Run the installer
3. Follow the wizard (no need to uninstall first)

### What is not included yet

- No automatic “check for updates” inside the app
- No background download/install of updates
- `AppUpdatesURL` in `DiskKit.iss` is informational only

For now, updates are **manual**: publish a new installer and tell users to download it.

### Portable ZIP users

Portable users must update manually:
1. Close Disk Kit
2. Replace `DiskKit.exe` (or extract the new portable ZIP over the old folder)
3. Run the new EXE

### Maintainer rule for upgrades

Keep the same `AppId` across all releases. If you change `AppId`, Windows treats it as a different app and users may end up with duplicate installs.

### Future option (not implemented)

If you want in-app updates later, add a “Check for updates” action that reads GitHub Releases and prompts users to download the latest installer.

## Validation Checklist

- Install from setup EXE
- Confirm app appears in Installed Apps
- Launch from Start Menu shortcut
- Uninstall and confirm cleanup
- Smoke-test core tools after install

## Code Signing (Recommended)

Sign both installer and EXE:

```bash
signtool.exe sign /f certificate.pfx /p "<password>" /tr http://timestamp.digicert.com /td sha256 /fd sha256 dist/DiskKit.exe
signtool.exe sign /f certificate.pfx /p "<password>" /tr http://timestamp.digicert.com /td sha256 /fd sha256 releases/DiskKit-Setup-0.6.0.exe
```

## Publishing

Upload to GitHub Releases:
- Installer EXE (primary)
- Portable ZIP (secondary)
- Release notes text file
