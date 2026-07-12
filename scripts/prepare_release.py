#!/usr/bin/env python3
"""
Disk Kit - Release Preparation Script
This script automates building the EXE, creating distribution packages,
and setting up for release.
"""

import os
import sys
import shutil
import zipfile
import subprocess
from pathlib import Path
from datetime import datetime

# Resolve project root
ROOT_DIR = Path(__file__).resolve().parents[1]
os.chdir(ROOT_DIR)

# Add project root to sys.path to allow backend imports
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.version import APP_VERSION
from backend.assets import ensure_windows_icon, resolve_logo_path, resolve_original_logo_path, sync_frontend_logo
PINNED_PYINSTALLER = "6.21.0"
RELEASE_NOTES_TEMPLATE = ROOT_DIR / "docs" / "release" / "release-notes.template.md"


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def clean_build_artifacts():
    """Remove intermediate build folders after release artifacts are created."""
    print("Cleaning intermediate build folders...")
    for dir_name in ("dist", "build", "installer"):
        dir_path = ROOT_DIR / dir_name
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"  [OK] Removed {dir_name}/")
        else:
            print(f"  - {dir_name}/ doesn't exist")

    for spec_file in ROOT_DIR.glob("*.spec"):
        spec_file.unlink()
        print(f"  [OK] Removed {spec_file.name}")

    print()


def clean_dist():
    """Clean distribution directories"""
    print("Cleaning distribution directories...")
    dirs_to_clean = ["dist", "build", "installer", "releases"]
    
    for dir_name in dirs_to_clean:
        dir_path = Path(dir_name)
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"  [OK] Removed {dir_name}/")
        else:
            print(f"  - {dir_name}/ doesn't exist")
    
    # Remove spec files
    for spec_file in ROOT_DIR.glob("*.spec"):
        spec_file.unlink()
        print(f"  [OK] Removed {spec_file.name}")
    
    print()


def check_python():
    """Check if Python is available."""
    try:
        subprocess.run([sys.executable, "--version"], check=True, capture_output=True)
        return True
    except Exception:
        return False


def install_dependencies():
    """Install required build/runtime dependencies."""
    print("Installing build dependencies...")
    subprocess.run([
        sys.executable, "-m", "pip", "install",
        f"pyinstaller=={PINNED_PYINSTALLER}"
    ], check=True)

    requirements_file = ROOT_DIR / "backend" / "requirements.txt"
    if requirements_file.exists():
        subprocess.run([
            sys.executable, "-m", "pip", "install",
            "-r", str(requirements_file)
        ], check=True)

    print(f"[OK] Dependencies installed (PyInstaller {PINNED_PYINSTALLER})")


def build_exe():
    """Build the EXE with PyInstaller."""
    print_header("Building Disk Kit EXE")

    if not check_python():
        print("[ERROR] Python not found!")
        return False

    try:
        install_dependencies()
    except subprocess.CalledProcessError:
        print("[ERROR] Dependency installation failed!")
        return False

    print("Building EXE with PyInstaller...")
    logo_path = resolve_original_logo_path(ROOT_DIR) or resolve_logo_path(ROOT_DIR)
    icon_path = None
    if logo_path:
        print(f"Using logo asset: assets/{logo_path.name}")
        synced_logo = sync_frontend_logo(ROOT_DIR)
        if synced_logo:
            print(f"  [OK] Synced {synced_logo.relative_to(ROOT_DIR)} for UI")
        icon_path = ensure_windows_icon(ROOT_DIR)
        if icon_path:
            print(f"  [OK] Prepared {icon_path.relative_to(ROOT_DIR)} for Windows builds")
    else:
        icon_path = ROOT_DIR / "assets" / "icon.ico"
        if icon_path.exists():
            print(f"Using existing {icon_path.relative_to(ROOT_DIR)}")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name=DiskKit",
        "--clean",
    ]

    if icon_path and icon_path.exists():
        cmd.extend(["--icon", str(icon_path), "--add-data", "assets;assets"])
    elif logo_path:
        cmd.extend(["--add-data", "assets;assets"])
        print("[WARN] Could not build icon.ico; EXE will use the default Windows icon")
    else:
        print("[WARN] No logo found in assets/; using default icon")

    cmd.extend([
        "--paths", str(ROOT_DIR),
        "--collect-submodules", "backend",
        "--hidden-import", "waitress",
        "--hidden-import", "send2trash",
        "--hidden-import", "backend.main",
        "--hidden-import", "backend.settings",
        "--hidden-import", "backend.pages.browse_files",
        "--hidden-import", "backend.operations",
        "--hidden-import", "backend.path_utils",
        "--hidden-import", "backend.tools.convert",
        "--hidden-import", "backend.tools.rename",
        "--hidden-import", "backend.tools.duplicates",
        "--add-data", "frontend;frontend",
        "--add-data", "frontend/css;frontend/css",
        "--add-data", "frontend/js;frontend/js",
        "--add-data", "frontend/html;frontend/html",
        "--add-data", "docs/release/version.json;docs/release",
        "diskkit_app.py"
    ])

    print(f"  Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("[ERROR] Build failed!")
        return False

    exe_path = ROOT_DIR / "dist" / "DiskKit.exe"
    if not exe_path.exists():
        print("[ERROR] EXE not found after build!")
        return False

    size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"[OK] Build successful! DiskKit.exe ({size_mb:.1f} MB)\n")
    return True


def create_portable_zip():
    """Create a portable ZIP distribution"""
    print_header("Creating Portable ZIP Distribution")
    
    # Create releases directory
    releases_dir = ROOT_DIR / "releases"
    releases_dir.mkdir(exist_ok=True)
    
    # Create versioned ZIP filename
    date_str = datetime.now().strftime("%Y%m%d")
    zip_name = f"DiskKit-Portable-{APP_VERSION}-{date_str}.zip"
    zip_path = releases_dir / zip_name
    
    print(f"Creating {zip_name}...")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add the EXE
        exe_path = ROOT_DIR / "dist" / "DiskKit.exe"
        zipf.write(exe_path, "DiskKit.exe")
        print("  [OK] Added DiskKit.exe")

        # Add LICENSE
        license_file = ROOT_DIR / "LICENSE"
        if license_file.exists():
            zipf.write(license_file, "LICENSE.txt")
            print("  [OK] Added LICENSE.txt")

        # Add README
        readme_file = ROOT_DIR / "README.md"
        if readme_file.exists():
            zipf.write(readme_file, "README.txt")
            print("  [OK] Added README.txt")
    
    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"\n[OK] Portable ZIP created: {zip_path} ({size_mb:.1f} MB)")
    return zip_path


def create_installer():
    """Create Inno Setup installer (requires Inno Setup to be installed)"""
    print_header("Creating Inno Setup Installer")

    def resolve_iscc():
        from shutil import which
        candidate = which("ISCC.exe") or which("ISCC")
        if candidate:
            return candidate
        fallback_paths = [
            r"C:\Program Files (x86)\Inno Setup 7\ISCC.exe",
            r"C:\Program Files\Inno Setup 7\ISCC.exe",
            r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
            r"C:\Program Files\Inno Setup 6\ISCC.exe",
            r"C:\Program Files (x86)\Inno Setup 5\ISCC.exe",
            r"C:\Program Files\Inno Setup 5\ISCC.exe",
        ]
        for path in fallback_paths:
            if Path(path).exists():
                return path
        return None

    iscc = resolve_iscc()

    if not iscc:
        print("[WARN] Inno Setup not found!")
        print("   Download from: https://jrsoftware.org/isdl.php")
        print("   Install Inno Setup 6 or 7 and run this script again.")
        print("   Note: the portable ZIP never includes an install wizard.")
        print("   Only DiskKit-Setup-<version>.exe is the full installer.")
        return None

    print(f"Found Inno Setup: {iscc}")

    # Create installer output directory
    installer_dir = ROOT_DIR / "installer"
    installer_dir.mkdir(exist_ok=True)

    # Compile the installer
    iss_file = ROOT_DIR / "DiskKit.iss"
    if not iss_file.exists():
        print("[ERROR] DiskKit.iss not found!")
        return None

    print("Compiling installer...")
    result = subprocess.run([iscc, str(iss_file)])

    if result.returncode != 0:
        print("[ERROR] Installer compilation failed!")
        return None

    # Find the created installer
    installer_files = list(installer_dir.glob("*.exe"))
    if installer_files:
        installer_path = installer_files[0]
        releases_dir = ROOT_DIR / "releases"
        releases_dir.mkdir(exist_ok=True)
        release_copy_path = releases_dir / installer_path.name
        shutil.copy2(installer_path, release_copy_path)
        size_mb = installer_path.stat().st_size / (1024 * 1024)
        print(f"[OK] Installer created: {installer_path} ({size_mb:.1f} MB)")
        print(f"[OK] Copied installer to releases/: {release_copy_path.name}")
        return release_copy_path
    else:
        print("[ERROR] Installer not found after build!")
        return None


def create_release_notes():
    """Render release notes from the markdown template."""
    print_header("Creating Release Notes")

    if not RELEASE_NOTES_TEMPLATE.exists():
        print(f"[ERROR] Release notes template not found: {RELEASE_NOTES_TEMPLATE}")
        return False

    date_str = datetime.now().strftime("%B %d, %Y")
    template = RELEASE_NOTES_TEMPLATE.read_text(encoding="utf-8")
    release_notes = (
        template
        .replace("{{version}}", APP_VERSION)
        .replace("{{date}}", date_str)
    )

    releases_dir = ROOT_DIR / "releases"
    releases_dir.mkdir(exist_ok=True)

    notes_file = releases_dir / f"RELEASE_NOTES_v{APP_VERSION}.txt"
    notes_file.write_text(release_notes, encoding="utf-8")
    print(f"[OK] Created {notes_file}")
    return True


def main():
    """Main release preparation process"""
    print_header("Disk Kit - Release Preparation")
    
    print("This script will:")
    print("  1. Clean previous build and release artifacts")
    print("  2. Build DiskKit.exe")
    print("  3. Create portable ZIP distribution")
    print("  4. Optionally create Inno Setup installer")
    print("  5. Generate release notes")
    print("  6. Remove intermediate dist/, build/, and installer/ folders")
    print()
    
    # Step 1: Clean
    clean_dist()
    
    # Step 2: Build EXE
    if not build_exe():
        print("[ERROR] Build failed. Aborting.")
        return
    
    # Step 3: Create portable ZIP
    zip_path = create_portable_zip()
    
    # Step 4: Create installer
    installer_path = create_installer()
    
    # Step 5: Create release notes
    create_release_notes()

    # Step 6: Remove intermediate build output (keeps releases/)
    clean_build_artifacts()
    
    # Summary
    print_header("Release Preparation Complete!")
    print("Created files:")
    
    releases_dir = ROOT_DIR / "releases"
    if releases_dir.exists():
        for file_path in sorted(releases_dir.glob("*")):
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"  * {file_path.name} ({size_mb:.1f} MB)")
    
    print("\nNext steps:")
    if installer_path:
        print(f"  1. Test the installer (setup wizard): releases/DiskKit-Setup-{APP_VERSION}.exe")
        print(f"  2. Optional portable test: extract releases/DiskKit-Portable-{APP_VERSION}-*.zip")
    else:
        print("  1. Install Inno Setup 7, rerun this script, then test releases/DiskKit-Setup-*.exe")
        print("  2. Portable ZIP has no wizard — extract and run DiskKit.exe directly")
    print("  3. Upload artifacts from releases/ to GitHub Releases")
    print("  4. Update APP_VERSION, DiskKit.iss, and docs/release/release-notes.template.md if needed")
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[ERROR] Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)