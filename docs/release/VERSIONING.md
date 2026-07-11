# Disk Kit Versioning Policy

Disk Kit uses a semantic versioning scheme (X.Y.Z) derived from the project's commit history and feature impact.

## Version Bump Rules

- **Patch (+0.0.1)**: Small bug fixes, text edits, CSS tweaks, or documentation updates.
- **Minor (+0.1.0)**: Larger features, new tools, major UI refactors, or significant backend changes.
- **Major (+1.0.0)**: Milestone shifts, fundamental architecture changes, or major public releases.

## Historical Retagging

The git history was retagged in July 2026 to align with this policy, ensuring every commit has a meaningful semantic version.

## Release Process

When a new version is ready:
1. Update `APP_VERSION` in `backend/version.py`.
2. Sync version in `DiskKit.iss`.
3. Update `docs/roadmap.md` and `docs/release/release-notes.template.md`.
4. Run `scripts/prepare_release.py`.
5. Create a git tag for the final release commit: `git tag vX.Y.Z`.
6. Push tags to GitHub: `git push origin --tags`.
7. Upload `docs/release/version.json` alongside the installer in the GitHub release.
