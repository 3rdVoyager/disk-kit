# Disk Kit Roadmap

Roadmap aligned to current implementation status and release posture.

---

## Current Position

### v1.7.0 (Current Version)

Toolkit-first release with image conversion, batch rename, and duplicate finder.

**What exists now**
- Dashboard with tool shortcuts and "On the Roadmap" future-view
- Browse Files with guarded Recycle Bin operations
- Convert Files (Batch Image to WebP, JPEG, PNG)
- Batch Rename with preview and collision detection
- Duplicate Finder (Exact size/hash match)
- Settings (theme, default path, blocked paths)
- Automated version check notifications
- Centralized path security across all tools
- Waitress production server for desktop and dev modes
- Inno Setup packaging path and release automation

---

## Milestones

### v1.7.0 - Toolkit Foundation (shipped)

Focus: Ship the core three tools with professional UX and safety.

**Delivered**
- Batch Image Conversion (Pillow)
- Enhanced Batch Rename UI
- Update check notification system
- Coming Soon placeholders for future tools
- Semantic git history retagging (v0.1.0 to v1.6.0)

### v1.8.0 - Workflow Polish

Focus: Round out practical daily-use workflows.

**Deliverables**
- Operation history polish (more detail on converted/renamed items)
- Improve file browser ergonomics (selection, state restore)
- **Archive & Extract** (ZIP) tool implementation
- **Empty Folder Finder** tool implementation

---

### v2.0.0 - Advanced Toolkit

Focus: Professional-grade features and scale.

**Deliverables**
- **Smart Sort** rules (auto-organize)
- **Storage Insights** dashboard
- **Global Search** (cross-tree)
- Performance tuning for multi-terabyte drives
- Signed release process and repeatable release checklist
