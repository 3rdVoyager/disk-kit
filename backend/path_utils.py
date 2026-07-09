"""
Path Utilities
Shared path normalization and access-control helpers used by the file
browser and all backend tools.
"""

from pathlib import Path

FALLBACK_ALLOWED_ROOT = Path('C:/Users')


def normalize_path(raw_path):
    """Normalize path separators and resolve to an absolute path."""
    return Path(str(raw_path).replace('/', '\\')).resolve(strict=False)


def is_path_within(target_path, root_path):
    """Check whether target_path is within root_path."""
    try:
        target_path.relative_to(root_path)
        return True
    except ValueError:
        return False


def get_allowed_roots(settings):
    """
    Resolve allowed roots from settings.
    Falls back to C:/Users when no valid root exists.
    """
    raw_root = settings.get('general', {}).get('defaultPath')
    candidate = normalize_path(raw_root) if raw_root else None
    if candidate and candidate.exists() and candidate.is_dir():
        return [candidate]
    return [normalize_path(FALLBACK_ALLOWED_ROOT)]


def is_path_allowed(target_path, allowed_roots):
    """Check if target_path is inside any configured root."""
    target = normalize_path(target_path)
    return any(is_path_within(target, root) for root in allowed_roots)


def sanitize_path(path_param, default_path):
    """
    Sanitize and build a safe target path from user input.
    Prevents directory traversal attacks.
    """
    base_path = normalize_path(default_path)

    if not path_param:
        return base_path

    raw = Path(str(path_param).replace('/', '\\'))
    if raw.is_absolute():
        return normalize_path(raw)

    return normalize_path(base_path / raw)
