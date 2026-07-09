# Disk Kit Releasing Guide

This guide defines the official v1 release process.

## Release Policy

- Primary distribution artifact: **Inno Setup installer**
- Secondary artifact: **portable ZIP**
- Official release entrypoint: `scripts/prepare_release.py`

## Prerequisites

- Python 3.14+
- Inno Setup 6+ installed (`ISCC.exe`)
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

## Output Artifacts

- `installer/DiskKit-Setup-<version>.exe`
- `releases/DiskKit-Setup-<version>.exe` (copied for publishing)
- `releases/DiskKit-Portable-<version>-<date>.zip`
- `releases/RELEASE_NOTES_v<version>.txt`

## Release Priority

1. `DiskKit-Setup-<version>.exe` (primary)
2. `DiskKit-Portable-<version>-<date>.zip` (secondary fallback)

## Publish Folder

Publish files from `releases/`:
- installer EXE
- portable ZIP
- release notes

## Version Bump Checklist

Before each release:
- Update `APP_VERSION` in `scripts/prepare_release.py`
- Update `#define AppVersion` in `DiskKit.iss`
- Update release notes/changelog text as needed

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
signtool.exe sign /f certificate.pfx /p "<password>" /tr http://timestamp.digicert.com /td sha256 /fd sha256 installer/DiskKit-Setup-0.6.0.exe
```

## Publishing

Upload to GitHub Releases:
- Installer EXE (primary)
- Portable ZIP (secondary)
- Release notes text file
