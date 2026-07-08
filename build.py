#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path

print("!" * 60)
print("DEPRECATION WARNING: build.py has moved to scripts/build.py")
print("Please update your commands to use: python scripts/build.py")
print("!" * 60)
print()

# Resolve the path to the new build script
script_dir = Path(__file__).resolve().parent
new_build_script = script_dir / "scripts" / "build.py"

if new_build_script.exists():
    # Delegate to the new build script
    result = subprocess.run([sys.executable, str(new_build_script)] + sys.argv[1:])
    sys.exit(result.returncode)
else:
    print(f"Error: Could not find the new build script at {new_build_script}")
    sys.exit(1)
