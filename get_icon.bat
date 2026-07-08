@echo off
:: This script helps you create an icon.ico file for Disk Kit
::
:: Option 1: Download a free icon from the internet
:: Option 2: Create a custom icon using online tools
::
:: RECOMMENDED: Use icoconverter.com
:: 1. Go to https://icoconverter.com
:: 2. Upload any image (PNG, JPG, etc.)
:: 3. Download the .ico file
:: 4. Save it as icon.ico in this folder
::
:: ALTERNATIVE: Use favicon.io
:: 1. Go to https://favicon.io/favicon-converter/
:: 2. Upload an image
:: 3. Select ICO format
:: 4. Download and save as icon.ico
::
:: If you don't create an icon.ico file, the build will still work
:: but will use the default PyInstaller icon.
::
:: Press any key to open the browser and go to icoconverter.com
::
pause
start "" "https://icoconverter.com"
