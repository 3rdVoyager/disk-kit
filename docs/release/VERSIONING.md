# Disk Kit Versioning Policy

Disk Kit uses semantic versioning (X.Y.Z).

## 0.x vs 1.0

Disk Kit stays on **0.x** until the toolkit is stable, broadly tested, and ready to promise a stable public API and UX. Version **1.0.0** is reserved for that milestone — not for "it basically works."

This is intentional. Many mature open-source tools remain on 0.x for years while shipping real features. A high version number should reflect user trust and stability, not internal commit count.

## Version Bump Rules (0.x)

- **Patch (0.x.Z)**: Bug fixes, small UI polish, docs, dependency updates.
- **Minor (0.X.0)**: New tools, notable features, meaningful UX or backend changes.
- **Major (1.0.0)**: First stable public release — breaking changes are allowed before this; after 1.0, semver applies in the usual way.

## Git tags

History is tagged at minor milestones from **v0.1.0** through the current release (**v0.8.0**). Tags mark development milestones, not every commit. Patch tags are added only when shipping patch releases.

| Tag | Milestone |
|-----|-----------|
| v0.1.0 | Initial project |
| v0.2.0 | Core layout and navigation |
| v0.3.0 | Frontend structure and file browsing utilities |
| v0.4.0 | Dashboard grid and page organization |
| v0.5.0 | Settings API and preferences |
| v0.6.0 | File browser API and desktop app |
| v0.7.0 | Core toolkit (convert, rename, duplicates) |
| v0.8.0 | First public release polish |

## Release checklist

When a new version is ready:

1. Update `APP_VERSION` in `backend/version.py`.
2. Sync version in `DiskKit.iss`.
3. Sync `frontend/dashboard.html` meta, `frontend/html/pages/settings.html` about display, and `docs/release/version.json`.
4. Update `docs/roadmap.md` and regenerate release notes via `scripts/prepare_release.py`.
5. Tag the release commit: `git tag vX.Y.Z`
6. Push tags: `git push origin --tags`
7. Upload `docs/release/version.json` with the GitHub release (required for in-app update checks).
