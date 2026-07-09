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
APP_VERSION = "0.6.0"


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def clean_dist():
    """Clean distribution directories"""
    print("Cleaning distribution directories...")
    dirs_to_clean = ["dist", "build", "installer"]
    
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


def build_exe():
    """Build the EXE using the build script"""
    print_header("Building Disk Kit EXE")
    
    build_script = ROOT_DIR / "scripts" / "build.py"
    if not build_script.exists():
        print("[ERROR] Build script not found!")
        return False
    
    result = subprocess.run([sys.executable, str(build_script)])
    if result.returncode != 0:
        print("[ERROR] Build failed!")
        return False
    
    # Verify the EXE was created
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
        print("   Install and run this script again to create the installer.")
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
    """Create a release notes file"""
    print_header("Creating Release Notes")
    
    date_str = datetime.now().strftime("%B %d, %Y")
    
    release_notes = f"""Disk Kit v{APP_VERSION} - Release Notes
Released: {date_str}

## Installation

### Option 1: Installer (Recommended)
1. Run DiskKit-Setup-{APP_VERSION}.exe
2. Follow the installation wizard
3. Launch from Start Menu or Desktop shortcut

### Option 2: Portable
1. Extract DiskKit-Portable-{APP_VERSION}.zip to any folder
2. Run DiskKit.exe

## System Requirements
- Windows 7 or later (64-bit)
- No additional software required

## What's New in v{APP_VERSION}
- Initial release
- Dashboard with storage overview
- Browse Files tool
- Large Files finder
- Batch Rename tool
- Duplicate Finder
- Smart Organize
- Settings management

## Known Issues
- None at this time

## Support
- GitHub Issues: https://github.com/3rdVoyager/disk-kit/issues
- Documentation: https://github.com/3rdVoyager/disk-kit
"""
    
    releases_dir = ROOT_DIR / "releases"
    releases_dir.mkdir(exist_ok=True)
    
    notes_file = releases_dir / f"RELEASE_NOTES_v{APP_VERSION}.txt"
    notes_file.write_text(release_notes)
    print(f"[OK] Created {notes_file}")


def main():
    """Main release preparation process"""
    print_header("Disk Kit - Release Preparation")
    
    print("This script will:")
    print("  1. Clean previous build artifacts")
    print("  2. Build DiskKit.exe")
    print("  3. Create portable ZIP distribution")
    print("  4. Optionally create Inno Setup installer")
    print("  5. Generate release notes")
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
    
    # Summary
    print_header("Release Preparation Complete!")
    print("Created files:")
    
    releases_dir = ROOT_DIR / "releases"
    if releases_dir.exists():
        for file_path in sorted(releases_dir.glob("*")):
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"  * {file_path.name} ({size_mb:.1f} MB)")
    
    print("\nNext steps:")
    print("  1. Test the EXE: dist/DiskKit.exe")
    print(f"  2. Test the installer: installer/DiskKit-Setup-{APP_VERSION}.exe")
    print("  3. Upload to GitHub Releases or your distribution platform")
    print("  4. Update APP_VERSION in scripts/prepare_release.py and DiskKit.iss if needed")
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