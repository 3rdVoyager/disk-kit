# Disk Kit Roadmap

Roadmap aligned to current implementation status and release posture.

---

## Current Position

### v0.6.0 (Current Version)

A real, usable app with core workflows and installer prep, but still pre-1.0 in hardening and scope completeness.

**What exists now**
- Dashboard shell and navigation
- Browse Files with guarded delete operations
- Large Files, Batch Rename, Duplicate Finder, Smart Organize
- Settings and quick-tools persistence
- Desktop wrapper (`pywebview`) + PyInstaller build
- Inno Setup packaging path and release automation scripts

---

## Milestones

### v0.7.0 - Stability and Safety

Focus: make current features safer and more supportable.

**Deliverables**
- Consistent API error model and structured logging
- Better failure handling and user feedback across all tools
- Smoke tests for core workflows (browse, delete, large files, rename, duplicates, organize)
- Packaging reliability checks (install, launch, uninstall)

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