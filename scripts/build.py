#!/usr/bin/env python3
# Disk Kit Build Script
# This script builds Disk Kit as a standalone executable using PyInstaller

import os
import sys
from pathlib import Path
import subprocess
import shutil

# Resolve project root (one level up from scripts/)
ROOT_DIR = Path(__file__).resolve().parents[1]
os.chdir(ROOT_DIR)

PINNED_PYINSTALLER = "6.21.0"

def check_python():
    """Check if Python is available"""
    try:
        subprocess.run([sys.executable, "--version"], check=True, capture_output=True)
        return True
    except:
        return False


def install_dependencies():
    """Install required build dependencies"""
    print("Installing build dependencies...")

    # Install pinned build dependency.
    subprocess.run([
        sys.executable, "-m", "pip", "install",
        f"pyinstaller=={PINNED_PYINSTALLER}"
    ], check=True)

    # Install pinned runtime dependencies.
    requirements_file = Path("backend/requirements.txt")
    if requirements_file.exists():
        subprocess.run([
            sys.executable, "-m", "pip", "install",
            "-r", str(requirements_file)
        ], check=True)

    print(f"Dependencies installed (PyInstaller {PINNED_PYINSTALLER})")


def clean_build():
    """Clean previous build artifacts"""
    print("Cleaning previous build...")
    
    build_dirs = ["build", "dist"]
    for dir_name in build_dirs:
        build_path = Path(dir_name)
        if build_path.exists():
            shutil.rmtree(build_path)
            print(f"   Removed {dir_name}")
    
    # Remove spec file if exists
    spec_file = Path("DiskKit.spec")
    if spec_file.exists():
        spec_file.unlink()
        print("   Removed DiskKit.spec")


def build_exe():
    """Build the EXE using PyInstaller"""
    print("Building EXE with PyInstaller...")
    
    # Get the absolute path to the icon
    icon_path = Path("icon.ico")
    if not icon_path.exists():
        print("Warning: icon.ico not found, using default")
        icon_path = None
    
    # Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--windowed",
        "--name=DiskKit",
        "--clean",
    ]
    
    if icon_path:
        cmd.extend(["--icon", str(icon_path)])
    
    # Add data files
    cmd.extend([
        "--add-data", "frontend;frontend",
        "--add-data", "backend/settings.json;backend",
        "--add-data", "frontend/css;frontend/css",
        "--add-data", "frontend/js;frontend/js",
        "--add-data", "frontend/html;frontend/html",
        "diskkit_app.py"
    ])
    
    print(f"   Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    
    print("Build complete!")


def verify_build():
    """Verify the build was successful"""
    dist_dir = Path("dist")
    if not dist_dir.exists():
        print("Build failed: dist directory not found")
        return False
    
    exe_file = dist_dir / "DiskKit.exe"
    if not exe_file.exists():
        # Try alternative naming
        exe_files = list(dist_dir.glob("*.exe"))
        if exe_files:
            exe_file = exe_files[0]
        else:
            print("Build failed: DiskKit.exe not found")
            return False
    
    file_size = exe_file.stat().st_size / (1024 * 1024)  # Size in MB
    print(f"Build successful!")
    print(f"   File: {exe_file}")
    print(f"   Size: {file_size:.2f} MB")
    return True


def main():
    """Main build process"""
    print("=" * 60)
    print("        Disk Kit Build Script")
    print("=" * 60)
    print()
    
    # Check Python
    if not check_python():
        print("❌ Python not found")
        return
    
    # Clean previous build
    clean_build()
    
    # Install dependencies
    install_dependencies()
    
    # Build EXE
    build_exe()
    
    # Verify build
    if verify_build():
        print()
        print("=" * 60)
        print("        Build Complete!")
        print("=" * 60)
        print()
        print("To run Disk Kit:")
        print("   Double-click: dist/DiskKit.exe")
        print()
        print("To test without building:")
        print("   python diskkit_app.py")
    else:
        print("\n❌ Build failed")


if __name__ == '__main__':
    main()
