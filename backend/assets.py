"""Shared helpers for app logo files in assets/."""

from __future__ import annotations

from pathlib import Path

LOGO_FILENAME = 'logo.png'
ORIGINAL_LOGO_CANDIDATES = (
    'logo-original.png',
    'logo-original.webp',
    'logo-original.jpg',
    'logo-original.jpeg',
)


def assets_dir(app_root: Path) -> Path:
    return app_root / 'assets'


def resolve_original_logo_path(app_root: Path) -> Path | None:
    base = assets_dir(app_root)
    for name in ORIGINAL_LOGO_CANDIDATES:
        candidate = base / name
        if candidate.is_file():
            return candidate
    return None


def _crop_to_content(image):
    from PIL import Image

    rgba = image.convert('RGBA')
    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def ensure_logo(app_root: Path) -> Path | None:
    """Ensure assets/logo.png exists, regenerating from logo-original when needed."""
    logo_path = assets_dir(app_root) / LOGO_FILENAME
    original_path = resolve_original_logo_path(app_root)

    if original_path is None:
        return logo_path if logo_path.is_file() else None

    if (
        logo_path.is_file()
        and logo_path.stat().st_mtime >= original_path.stat().st_mtime
    ):
        return logo_path

    try:
        from PIL import Image
    except ImportError:
        return logo_path if logo_path.is_file() else original_path

    cropped = _crop_to_content(Image.open(original_path))
    logo_path.parent.mkdir(exist_ok=True)
    cropped.save(logo_path, format='PNG')
    return logo_path


def resolve_logo_path(app_root: Path) -> Path | None:
    return ensure_logo(app_root)


def sync_frontend_logo(app_root: Path) -> Path | None:
    """Copy assets/logo.png into frontend/ for static file serving."""
    logo_path = ensure_logo(app_root)
    if logo_path is None:
        return None

    frontend_logo = app_root / 'frontend' / LOGO_FILENAME
    if (
        frontend_logo.is_file()
        and frontend_logo.stat().st_mtime >= logo_path.stat().st_mtime
    ):
        return frontend_logo

    frontend_logo.parent.mkdir(exist_ok=True)
    frontend_logo.write_bytes(logo_path.read_bytes())
    return frontend_logo


def ensure_windows_icon(app_root: Path) -> Path | None:
    """Build a minimal Windows .ico from assets/logo.png when needed."""
    logo_path = ensure_logo(app_root)
    if logo_path is None:
        return None

    ico_path = assets_dir(app_root) / 'icon.ico'
    if (
        ico_path.is_file()
        and ico_path.stat().st_mtime >= logo_path.stat().st_mtime
    ):
        return ico_path

    try:
        from PIL import Image
    except ImportError:
        return ico_path if ico_path.is_file() else None

    image = Image.open(logo_path).convert('RGBA')
    image.thumbnail((256, 256), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    offset_x = (256 - image.width) // 2
    offset_y = (256 - image.height) // 2
    canvas.paste(image, (offset_x, offset_y), image)

    ico_path.parent.mkdir(exist_ok=True)
    canvas.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    return ico_path
