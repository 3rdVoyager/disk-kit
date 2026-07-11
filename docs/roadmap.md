# Disk Kit Roadmap

Roadmap aligned to current implementation status and release posture.

---

## Current Position

### v0.7.0 (Current Version)

Safety and stability hardening for core file workflows.

**What exists now**
- Dashboard shell and navigation
- Browse Files with guarded Recycle Bin operations
- Convert Files, Batch Rename, Duplicate Finder
- Settings (theme, default path, blocked paths)
- Centralized path security (`validate_path_access`) across all file tools
- Waitress production server for desktop and dev modes
- Desktop wrapper (`pywebview`) + PyInstaller build
- Inno Setup packaging path and release automation scripts

---

## Milestones

### v0.7.0 - Stability and Safety (shipped)

Focus: make current features safer and more supportable.

**Delivered**
- Waitress replaces Flask development server
- Recycle Bin deletes via `send2trash`
- User-configurable blocked paths in Settings
- Symlink-resolved path access checks
- System path deny list (`C:/Windows`, `C:/Program Files`)

**Remaining for later patch releases**
- Smoke tests for core workflows (browse, delete, convert, rename, duplicates)
- Packaging reliability checks (install, launch, uninstall)
- Expanded-access / danger mode for system-level tools (post-v1)

---

### v0.8.0 - Workflow Completeness

Focus: round out practical daily-use workflows.

**Deliverables**
- History of operations and clear action outcomes
- More robust batch operations UX (progress, retries, conflict handling)
- Improve file browser ergonomics (selection, navigation polish, state restore)
- Documentation expansion for user and maintainer flows

---

### v0.9.0 - Release Candidate Phase

Focus: production-readiness and scale confidence.

**Deliverables**
- Test coverage baseline for backend and critical frontend paths
- CI checks for lint/build/tests
- Signed release process and repeatable release checklist
- Performance tuning and bug backlog burn-down

---

### v1.0.0 - Professional Production Release

A stable, trustworthy application ready for broad user adoption.

**Definition of done**
- Core scope complete and intentionally frozen
- Installer/update/uninstall flow validated
- Documentation fully aligned with actual behavior
- Regression test gates in place and passing
- Release process is repeatable by another maintainer