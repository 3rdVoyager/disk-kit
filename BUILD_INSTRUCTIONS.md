# Disk Kit Build Instructions

This guide explains how to build Disk Kit as a standalone desktop application using PyWebView.

## Prerequisites

- Python 3.7 or higher
- pip (Python package manager)
- Windows (for EXE builds)

## Quick Start

### Method 1: Using the Build Script (Recommended)

```bash
# Run the build script
python build.py
```

The script will:
1. Install all dependencies
2. Clean previous builds
3. Create a standalone EXE in the `dist` folder
4. Verify the build

### Method 2: Manual Build with PyInstaller

```bash
# Install dependencies
pip install -r backend/requirements.txt
pip install pyinstaller

# Build the EXE
pyinstaller --onefile --windowed --icon=icon.ico --name=DiskKit diskkit_app.py
```

### Method 3: Using the Spec File

```bash
# First, ensure dependencies are installed
pip install -r backend/requirements.txt
pip install pyinstaller

# Then build using the spec file
pyinstaller diskkit.spec
```

## Development Testing

To test the application without building an EXE:

```bash
# Install PyWebView
pip install pywebview

# Run the application
python diskkit_app.py
```

This will open Disk Kit in a native window without any browser chrome.

## Build Output

After a successful build, you'll find:
- `dist/DiskKit.exe` - The standalone executable
- `build/` - Build artifacts (can be deleted)

## Running the Application

### From the Build
1. Navigate to the `dist` folder
2. Double-click `DiskKit.exe`
3. The application will open in a native window

### What to Expect
- A native window opens (no browser address bar or tabs)
- Your Disk Kit interface loads automatically
- Window title: "Disk Kit"
- Default size: 1200x800 pixels (resizable)
- Minimum size: 1000x700 pixels

## Customization

### Change Window Settings

Edit `diskkit_app.py` and modify the `create_window()` function:

```python
def create_window():
    window = webview.create_window(
        title='Disk Kit',           # Window title
        url='http://127.0.0.1:5000',
        width=1200,                # Initial width
        height=800,                # Initial height
        min_size=(1000, 700),      # Minimum size
        resizable=True,            # Allow resizing
        easy_drag=False,           # Drag from anywhere in window
        frameless=False,          # Keep native window frame
        text_select=True,          # Allow text selection
    )
    return window
```

### Add a System Tray Icon

To add a tray icon, modify `diskkit_app.py`:

```python
import webview

def create_window():
    window = webview.create_window(
        title='Disk Kit',
        url='http://127.0.0.1:5000',
        width=1200,
        height=800
    )
    
    # Add tray icon
    tray = webview.tray(
        icon='icon.ico',
        tooltip='Disk Kit',
        window=window
    )
    
    return window, tray

if __name__ == '__main__':
    server_thread = threading.Thread(target=run_flask_server, daemon=True)
    server_thread.start()
    
    window, tray = create_window()
    webview.start(tray=tray)
```

## Icon File

The build expects an `icon.ico` file in the project root. If you don't have one:

1. **Create a custom icon**:
   - Use [icoconverter.com](https://icoconverter.com)
   - Upload a PNG image and download as ICO
   - Save as `icon.ico` in the project root

2. **Use a placeholder**:
   - The build will work without an icon (uses default PyInstaller icon)
   - But a custom icon looks more professional

## Troubleshooting

### Common Issues

1. **Build fails with "module not found"**
   - Ensure all dependencies are installed: `pip install -r backend/requirements.txt`
   - Check that PyInstaller and PyWebView are installed

2. **EXE doesn't start**
   - Try running from command line to see error messages: `cd dist && DiskKit.exe`
   - Check that all frontend files are included in the build

3. **White screen or loading forever**
   - Flask server might not be starting properly
   - Check that the port (5000) is not blocked
   - Add `print` statements in `run_flask_server()` to debug

4. **Large EXE file size**
   - This is normal for PyWebView/PyInstaller builds
   - Expected size: 30-50MB
   - The size includes Python runtime and all dependencies

### Debug Mode

To see what's happening during startup, modify `diskkit_app.py`:

```python
def run_flask_server():
    from main import app
    from settings import ensure_settings_file
    ensure_settings_file()
    
    print("Starting Flask server...")
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
```

Then run from command line: `python diskkit_app.py`

## Updating the Application

When you make changes to your code:

1. Update the version in `backend/version.py` (if you have one)
2. Test locally: `python diskkit_app.py`
3. Rebuild: `python build.py`
4. Test the new EXE in `dist/`

## Distribution

To share your application with users:

1. Build the EXE: `python build.py`
2. Compress the `dist` folder into a ZIP file
3. Share `DiskKit.zip` with users
4. Users extract and double-click `DiskKit.exe`

### For a More Professional Distribution:

1. Create an installer using Inno Setup or NSIS
2. Include the EXE and any additional files
3. Create desktop/start menu shortcuts
4. Add uninstall support

## Notes

- PyWebView uses the system's native web rendering engine (Edge on Windows, WebKit on Mac, WebKitGTK on Linux)
- The application runs a local Flask server that only accepts connections from localhost
- All data stays on the user's machine (no internet connection required for basic functionality)
- The window behaves like a native application, not a browser tab
