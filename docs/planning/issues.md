# Disk Kit Production-Readiness Audit

Date: 2026-07-08  
Scope: Full repository review of backend, frontend, scripts, and docs.

## Implementation Update (Applied)

The following items from this audit have now been implemented in code:
- Removed permissive CORS from backend and switched default server run mode to `debug=False`.
- Hardened file access/deletion to the configured `general.defaultPath` root (with fallback), instead of whole-drive allowlists.
- Fixed frontend runtime bug by importing `apiFetch` in `frontend/js/file-browser.js`.
- Fixed duplicate SPA history pushes and removed duplicate quick-tool toggle save behavior.
- Reduced v1 surface to implemented tools (`browse-files`, `settings`) and removed placeholder tool HTML pages.
- Removed inactive icon abstraction files and stale references.
- Updated quick tool defaults in `backend/settings.py` and `backend/settings.json`.
- Updated docs to better reflect current implementation status and cleaned outdated build instructions.

## Executive Findings

The project has a solid UI foundation, but it is currently a scaffold rather than a production-ready app. The biggest risks are:

1. A **critical local API security issue** (unauthenticated destructive endpoint + permissive CORS).
2. A **runtime frontend bug** that can break file browsing and deletion.
3. A large amount of **placeholder/inactive tooling** that creates a mismatch between UI promises and actual functionality.
4. Missing production engineering basics (tests, error handling standards, release hardening).

---

## Critical Issues (Fix First)

### 1) Local API can be abused by arbitrary websites
- Files: `backend/main.py`, `backend/file_browser.py`
- `CORS(app)` is enabled without restrictions while destructive endpoints are exposed (`POST /api/files/delete`).
- `delete_files_api()` accepts any allowed-drive path and permanently deletes recursively with `shutil.rmtree`.
- Combined impact: a malicious website opened in the user browser can issue cross-origin requests to `localhost:5000` and trigger filesystem deletion.

**Recommended actions**
- Restrict CORS to trusted origin(s) only, or disable CORS entirely for desktop/local mode.
- Add request authentication (token/session) for all write endpoints.
- Add explicit path allowlist rooted to configured safe directories, not whole drives.
- Add deletion protections: block system folders, require explicit dry-run + confirmation token.

### 2) Frontend file browser uses undefined API helper
- File: `frontend/js/file-browser.js`
- `apiFetch(...)` is called, but only `escapeHtml` is imported from `utils.js`.
- This will throw at runtime when loading/deleting files.

**Recommended actions**
- Import `apiFetch` in `file-browser.js`.
- Add smoke tests for `browse-files` load and delete workflow.

---

## High Severity Issues

### 3) Double history entries for navigation
- File: `frontend/js/main.js`
- `navigateTo()` calls `loadContent(toolName)` and then also calls `history.pushState(...)`.
- `loadContent()` already pushes history when `pushHistory=true`.

**Impact**
- Back button behavior becomes noisy and inconsistent.

**Recommended actions**
- Only push history in one place (prefer `navigateTo` OR `loadContent`, not both).

### 4) Quick-tool checkbox changes can trigger duplicate saves
- File: `frontend/js/main.js`
- Global delegated change handler (`setupToggleListeners`) and per-toggle listeners (`attachToggleListeners`) both call `toggleQuickTool(...)`.

**Impact**
- Duplicate API writes and unnecessary re-renders.

**Recommended actions**
- Keep only one listener strategy.
- Add debounce or pending-state lock for write calls.

### 5) Dangerous deletion scope is too broad for “default path” model
- File: `backend/file_browser.py`
- `is_path_allowed()` allows any path under `C:\`, `D:\`, `E:\`, `F:\`.
- This conflicts with UI/settings language implying safer workspace-like behavior (`general.defaultPath`).

**Impact**
- User can unintentionally delete outside intended workspace.

**Recommended actions**
- Replace drive-level allowlist with explicit, user-approved roots.
- Canonicalize and resolve paths before checks.

### 6) Dev configuration left enabled in server entrypoint
- File: `backend/main.py`
- `app.run(debug=True, port=5000)` in CLI path.

**Impact**
- Debug mode should never be enabled for production distribution.

**Recommended actions**
- Use env-based config (`FLASK_ENV`/custom config object).
- Default to `debug=False`.

---

## Medium Severity Issues

### 7) Tool inventory mismatch and orphan tool IDs
- File: `frontend/js/main.js`
- `TOOL_META` / `TOOL_CATEGORIES` include `ai-rename`, but there is no matching HTML page.
- If navigated, app attempts to load a missing file and renders “Load Failed.”

**Recommended actions**
- Remove orphan entries or add corresponding page and feature wiring.
- Generate tool manifest from filesystem to avoid manual drift.

### 8) Most tools are placeholders but represented as available features
- Files: almost all `frontend/html/**` tool pages
- Only `browse-files`, `alltools`, and `system/settings` have substantial implementation.
- Other tool pages are 1-2 line stubs.

**Impact**
- Product trust gap; users think actions exist when they do not.

**Recommended actions**
- For v1: explicitly mark unsupported tools as “Coming soon” and disable navigation/action.
- Or remove from sidebar/all-tools until implemented.

### 9) Inactive icon architecture
- Files: `frontend/js/config/icons.js`, `frontend/css/components/icon-mappings.css`
- Rich icon abstraction exists, but runtime mostly hardcodes icons directly in HTML and `TOOL_META`.
- `icons.js` is imported in `main.js` only for a presence check; helper functions are otherwise unused.
- `icon-mappings.css` appears unreferenced by actual class usage.

**Recommended actions**
- Either:
  - fully adopt icon helpers and classes, or
  - remove unused abstraction files to reduce maintenance overhead.

### 10) Docs overstate completed functionality
- Files: `README.md`, `ROADMAP.md`, `BUILD_INSTRUCTIONS.md`
- `README.md` presents many advanced features as complete.
- Actual implementation currently supports mainly navigation scaffolding + file browser + settings persistence.

**Recommended actions**
- Add “Current Status” section with implemented vs planned.
- Rename roadmap milestones to reflect current baseline honestly.

### 11) Build instructions reference non-existent artifacts
- File: `BUILD_INSTRUCTIONS.md`
- Mentions `diskkit.spec` workflow and `backend/version.py` update flow, but these files are absent.

**Recommended actions**
- Remove or add missing artifacts.
- Keep one canonical build path (`build.py`) unless spec-based flow is truly supported.

---

## Low Severity / Cleanup Opportunities

### 12) Unused imports/vars and duplicated concepts
- File: `frontend/js/main.js`
- Imports many file-browser exports that are not directly used.
- Similar navigation concerns implemented in both `main.js` and `file-browser.js`.

**Recommended actions**
- Reduce import surface.
- Keep one authoritative navigation module.

### 13) Settings schema lacks validation
- Files: `backend/settings.py`, `backend/main.py`
- Arbitrary payload keys are merged/persisted.

**Recommended actions**
- Add schema validation (e.g., Pydantic, marshmallow, or manual schema check).
- Reject unknown keys in production mode.

### 14) `.gitignore` is generic and noisy for this project
- File: `.gitignore`
- Very broad template includes many unrelated ecosystems.

**Recommended actions**
- Trim to project-relevant patterns for clarity.

### 15) Build script could be safer/more deterministic
- File: `build.py`
- Installs dependencies at build-time dynamically, no lockfile.

**Recommended actions**
- Add pinned dependency lock strategy (`requirements.txt` with exact versions for release builds).
- Separate build environment bootstrap from actual build command.

---

## Inactive/Placeholder Tool Pages (Candidates to Remove for v1)

The following are currently placeholder stubs and can be removed/hidden in first release if you want a smaller, trustworthy surface:

- `frontend/html/file-operations/rename.html`
- `frontend/html/file-operations/move.html`
- `frontend/html/file-operations/copy.html`
- `frontend/html/file-operations/delete.html`
- `frontend/html/file-operations/split.html`
- `frontend/html/file-operations/merge.html`
- `frontend/html/conversion/convert.html`
- `frontend/html/conversion/image-convert.html`
- `frontend/html/conversion/video-convert.html`
- `frontend/html/conversion/audio-convert.html`
- `frontend/html/conversion/doc-convert.html`
- `frontend/html/compression/compress.html`
- `frontend/html/compression/extract.html`
- `frontend/html/compression/iso-mount.html`
- `frontend/html/cleanup/cleanup.html`
- `frontend/html/cleanup/duplicates.html`
- `frontend/html/cleanup/empty-folders.html`
- `frontend/html/cleanup/large-files.html`
- `frontend/html/cleanup/old-files.html`
- `frontend/html/cleanup/temp-files.html`
- `frontend/html/cleanup/ai-cleanup.html`
- `frontend/html/organization/organize.html`
- `frontend/html/organization/sort.html`
- `frontend/html/organization/deduplicate.html`
- `frontend/html/organization/tag.html`
- `frontend/html/media/resize.html`
- `frontend/html/media/watermark.html`
- `frontend/html/media/thumbnail.html`
- `frontend/html/media/metadata.html`
- `frontend/html/advanced/checksum.html`
- `frontend/html/advanced/encrypt.html`
- `frontend/html/advanced/sync.html`
- `frontend/html/advanced/secure-delete.html`
- `frontend/html/system/history.html`
- `frontend/html/system/trash.html`
- `frontend/html/system/storage-details.html`

---

## What Appears Functionally Implemented Today

- Core shell/navigation: `frontend/dashboard.html`, `frontend/js/main.js`, `frontend/css/**`
- File browsing + delete API path: `frontend/html/browse-files.html`, `frontend/js/file-browser.js`, `backend/file_browser.py`
- Settings persistence API + UI: `backend/settings.py`, `backend/settings.json`, `frontend/html/system/settings.html`
- Build/desktop app wrapper: `diskkit_app.py`, `build.py`

---

## Organization Actions for First Production Cut

### Recommended v1 Scope Freeze
Keep only:
- Dashboard
- Browse Files
- Settings
- Minimal “About/Help”

Hide/remove all other tools until implemented.

### Suggested cleanup sequence
1. Fix critical security + runtime bugs.
2. Remove or disable placeholder tools from `alltools` and quick tools.
3. Delete orphan mappings (`ai-rename`) and dead icon abstractions.
4. Align docs to actual state.
5. Add baseline testing and release checks.

---

## Engineering Hardening Checklist

- [ ] Add API auth boundary for write operations.
- [ ] Restrict CORS and path access scope.
- [ ] Fix `file-browser.js` API import.
- [ ] Add browser smoke test for file listing and delete flow.
- [ ] Add unit tests for path sanitization and deletion guardrails.
- [ ] Centralize and validate settings schema.
- [ ] Implement structured logging and standardized API errors.
- [ ] Introduce pinned dependencies for release builds.
- [ ] Add CI checks (lint, tests, build verification).
- [ ] Update README to distinguish implemented vs planned features.

---

## Per-File Review Notes

### Root
- `README.md`: Good vision doc; currently overstates implemented functionality.
- `BUILD_INSTRUCTIONS.md`: Useful structure; contains outdated references (`diskkit.spec`, `backend/version.py`).
- `ROADMAP.md`: Coherent milestones; needs alignment with current real implementation status.
- `LICENSE`: Standard MIT; no issues.
- `.gitignore`: Functional but too broad/noisy for project scope.
- `build.py`: Works as bootstrap-oriented build script; improve determinism and release safety.
- `diskkit_app.py`: Clean desktop wrapper; no auth model between UI and local API.
- `get_icon.bat`: Harmless helper, optional.

### Backend
- `backend/main.py`: API structure is clear; debug mode and open CORS are major production blockers.
- `backend/file_browser.py`: Clear separation of list/delete handlers; deletion and path policy need hardening.
- `backend/settings.py`: Good deep merge utility; lacks schema validation and strict mode.
- `backend/settings.json`: Reasonable defaults.
- `backend/requirements.txt`: Minimal and readable; versions are broad rather than pinned.

### Frontend JavaScript
- `frontend/js/main.js`: Strong central metadata pattern; currently has navigation/history and listener duplication issues.
- `frontend/js/file-browser.js`: Good UI-state decomposition; missing `apiFetch` import causes runtime errors.
- `frontend/js/utils.js`: Clean utility helpers.
- `frontend/js/config/icons.js`: Overbuilt vs current usage; mostly inactive abstraction.
- `frontend/js/config/ICONS.md`: Good docs for icon system, but currently not reflected in runtime architecture.

### Frontend HTML
- `frontend/dashboard.html`: Strong shell layout; many dashboard values are static mock values.
- `frontend/html/alltools.html`: Well-organized tool catalog UI; currently advertises mostly non-functional tools.
- `frontend/html/browse-files.html`: Most complete functional page.
- `frontend/html/system/settings.html`: Most complete form-based page.
- `frontend/html/system/history.html`: Placeholder.
- `frontend/html/system/trash.html`: Placeholder.
- `frontend/html/system/storage-details.html`: Placeholder.
- All files under:
  - `frontend/html/file-operations/`
  - `frontend/html/conversion/`
  - `frontend/html/compression/`
  - `frontend/html/cleanup/`
  - `frontend/html/organization/`
  - `frontend/html/media/`
  - `frontend/html/advanced/`
  are currently placeholder pages.

### Frontend CSS / Data
- `frontend/css/variables.css`: Solid token foundation.
- `frontend/css/base.css`: Minimal reset/base styling; fine.
- `frontend/css/layout.css`: Comprehensive shell/sidebar/header styling; generally good.
- `frontend/css/tabs/dashboard.css`: Rich card and dashboard styles; assumes mostly static content.
- `frontend/css/tabs/browse-files.css`: Detailed file browser + details panel styles; strong base.
- `frontend/css/tabs/all-tools.css`: Good card-grid system.
- `frontend/css/tabs/settings.css`: Functional settings form styling.
- `frontend/css/components/help-dialog.css`: Nicely structured modal styles.
- `frontend/css/components/icon-mappings.css`: Appears largely unused in current markup.
- `frontend/help/tips.json`: Helpful content; includes shortcuts/command palette claims not implemented.

