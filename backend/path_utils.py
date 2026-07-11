"""
Path Utilities
Shared path normalization and access-control helpers used by the file
browser and all backend tools.
"""

from pathlib import Path

FALLBACK_ALLOWED_ROOT = Path('C:/Users')
GENERIC_USERS_ROOTS = {
    FALLBACK_ALLOWED_ROOT,
    Path('C:/Users/'),
}

# Always denied regardless of sandbox or user blocklist settings.
SYSTEM_BLOCKED_ROOTS = [
    Path('C:/Windows'),
    Path('C:/Program Files'),
    Path('C:/Program Files (x86)'),
]


def normalize_path(raw_path):
    """Normalize path separators and resolve to an absolute path."""
    return Path(str(raw_path).replace('/', '\\')).resolve(strict=False)


def resolve_path_for_access(target_path):
    """
    Resolve symlinks/junctions to a canonical path for access checks.
    A path inside the sandbox that resolves outside it will fail is_path_allowed.
    """
    return normalize_path(target_path)


def is_path_within(target_path, root_path):
    """Check whether target_path is within root_path."""
    try:
        target_path.relative_to(root_path)
        return True
    except ValueError:
        return False


def get_user_home():
    """Return the current user's home directory."""
    return normalize_path(Path.home())


def get_default_working_path(settings):
    """
    Resolve the configured default path for scans and file tools.
    Legacy generic Users roots map to the signed-in user's profile.
    """
    raw_root = settings.get('general', {}).get('defaultPath')
    candidate = normalize_path(raw_root) if raw_root else None
    home = get_user_home()

    if candidate and candidate.exists() and candidate.is_dir():
        if candidate in GENERIC_USERS_ROOTS:
            return home
        return candidate
    return home


def get_allowed_roots(settings):
    """
    Resolve allowed roots from settings.
    Falls back to the current user's home when no valid root exists.
    """
    raw_root = settings.get('general', {}).get('defaultPath')
    candidate = normalize_path(raw_root) if raw_root else None
    if candidate and candidate.exists() and candidate.is_dir():
        if candidate in GENERIC_USERS_ROOTS:
            return [get_user_home()]
        return [candidate]
    return [get_user_home()]


def is_protections_disabled(settings):
    """Whether the user has opted out of sandbox and blocklist protections."""
    return bool(settings.get('security', {}).get('disablePathProtections'))


def get_blocked_paths(settings):
    """
    User-configured blocked paths plus always-on system blocked roots.
    """
    if is_protections_disabled(settings):
        return []

    blocked = []
    for raw in settings.get('security', {}).get('blockedPaths', []):
        if not raw or not str(raw).strip():
            continue
        try:
            blocked.append(normalize_path(raw))
        except (OSError, ValueError):
            continue
    for system_root in SYSTEM_BLOCKED_ROOTS:
        blocked.append(normalize_path(system_root))
    return blocked


def is_path_blocked(target_path, blocked_paths):
    """Check if target_path is inside any blocked path."""
    target = resolve_path_for_access(target_path)
    return any(
        is_path_within(target, blocked) or target == blocked
        for blocked in blocked_paths
    )


def is_path_allowed(target_path, allowed_roots):
    """Check if target_path is inside any configured root."""
    target = resolve_path_for_access(target_path)
    return any(is_path_within(target, root) for root in allowed_roots)


def validate_path_access(target_path, settings):
    """
    Single security gate for all file tools.
    Returns (resolved_path, None) on success or (None, (error_message, status_code)).
    """
    resolved = resolve_path_for_access(target_path)
    if is_protections_disabled(settings):
        return resolved, None

    allowed_roots = get_allowed_roots(settings)
    blocked_paths = get_blocked_paths(settings)

    if not is_path_allowed(resolved, allowed_roots):
        return None, ('Access denied', 403)

    if is_path_blocked(resolved, blocked_paths):
        return None, ('Path is blocked by settings', 403)

    return resolved, None


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
