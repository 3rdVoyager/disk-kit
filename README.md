# Disk Kit

A comprehensive, locally-hosted file management toolkit with a modern web interface. Disk Kit provides a complete suite of tools for organizing, converting, compressing, and managing files on your system.

## Features

### Core Functionality
- **File Operations**: Rename, move, copy, delete files in bulk
- **Conversion Tools**: Format conversion for images, videos, audio, and documents
- **Compression**: Create and extract ZIP, RAR, 7z archives
- **Storage Analysis**: View disk usage, find large/old files, detect duplicates
- **Organization**: Smart file sorting, tagging, and deduplication
- **Media Tools**: Image resizing, watermarking, thumbnail generation, metadata editing

### Advanced Features
- **Batch Processing**: Handle multiple files at once
- **AI-Powered Tools**: Smart rename and cleanup suggestions
- **Secure Operations**: Encryption, secure deletion with overwrite
- **File Synchronization**: Sync files between directories
- **Checksum Verification**: Calculate MD5, SHA-256 hashes

### User Interface
- **Modern Dashboard**: Overview of storage, suggested actions, and quick access to tools
- **Quick Tools**: Customizable sidebar with your most-used tools
- **All Tools Page**: Complete toolkit with checkbox selection for quick access
- **Responsive Design**: Works on various screen sizes
- **Theme Support**: Dark and light themes

## Installation

### Prerequisites
- Python 3.7+
- pip (Python package manager)
- Modern web browser

### Setup

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/your-username/disk-kit.git
   cd disk-kit
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Start the application**
   ```bash
   python backend/main.py
   ```

4. **Access the application**
   Open your browser and navigate to: `http://localhost:5000`

## Usage

### Starting the Server
```bash
cd backend
python main.py
```

The server will start on port 5000 by default. You can change the port by modifying `main.py`.

### Navigation
- **Dashboard**: Home page with storage overview and quick access to tools
- **Browse Files**: File explorer interface
- **All Tools**: Complete list of all available tools with checkbox selection
- **Settings**: Configure application preferences

### Customizing Quick Tools
1. Go to **All Tools** page
2. Check the boxes next to the tools you want in your quick access list
3. These will appear in the sidebar and dashboard for quick access
4. Changes are automatically saved to the backend

## Configuration

### Settings File
Application settings are stored in `backend/settings.json` and include:

```json
{
  "general": {
    "theme": "dark",
    "language": "en",
    "defaultPath": "C:/Users"
  },
  "tools": {
    "defaultCompressionFormat": "zip",
    "batchSizeLimit": 100,
    "confirmBeforeDelete": true
  },
  "performance": {
    "maxConcurrentOperations": 4,
    "cacheSize": "512MB",
    "showProgressDetails": true
  },
  "ai": {
    "autoSuggestions": false,
    "apiEndpoint": "",
    "apiKey": ""
  },
  "quickTools": ["rename", "convert", "compress", "cleanup"]
}
```

### Theme Settings
Toggle between dark and light themes using the theme button in the header. Theme preference is saved automatically.

## Project Structure

```
disk-kit/
├── backend/
│   ├── main.py              # Flask application and API endpoints
│   ├── settings.py          # Settings management utilities
│   ├── settings.json        # Application configuration
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── dashboard.html       # Main HTML entry point
│   ├── css/
│   │   ├── base.css         # Base styles
│   │   ├── variables.css     # CSS variables (colors, spacing, etc.)
│   │   ├── layout.css        # Layout and navigation styles
│   │   └── tabs/            # Tab-specific CSS
│   │       ├── dashboard.css
│   │       ├── all-tools.css
│   │       ├── browse-files.css
│   │       └── settings.css
│   │
│   ├── js/
│   │   ├── main.js          # Main JavaScript application
│   │   └── config/          # Configuration files
│   │       └── icons.js      # Icon mappings
│   │
│   └── html/
│       ├── alltools.html    # All Tools page
│       ├── browse-files.html
│       └── system/          # System tool pages
│           ├── settings.html
│           └── ...
│
└── README.md
```

## API Endpoints

### Settings API
- `GET /api/settings` - Get all current settings
- `POST /api/settings` - Update settings (full or partial)
- `POST /api/settings/reset` - Reset settings to defaults
- `GET /api/settings/defaults` - Get default settings

### Quick Tools API
- `GET /api/quick-tools` - Get the list of quick tools
- `POST /api/quick-tools` - Update the quick tools list

### Response Format
All API responses return JSON with appropriate HTTP status codes.

## Available Tools

### File Operations
- **Batch Rename** - Rename multiple files at once
- **Move Files** - Transfer files between folders
- **Copy Files** - Duplicate files to another location
- **Delete Files** - Permanently remove selected files
- **Split Files** - Divide large files into smaller parts
- **Merge Files** - Combine multiple files into one

### Conversion
- **Format Converter** - General file format conversion
- **Image Converter** - Convert between JPG, PNG, WebP
- **Video Converter** - Convert video formats and codecs
- **Audio Converter** - Convert between MP3, FLAC, WAV
- **Document Converter** - Convert PDF, DOCX, TXT files

### Compression
- **Compress Files** - Create ZIP, RAR, or 7z archives
- **Extract Archives** - Unzip and extract compressed files
- **Mount ISO** - Mount disk image files

### Cleanup & Optimization
- **System Cleanup** - Remove temporary and cache files
- **Duplicate Finder** - Find and remove duplicate files
- **Empty Folders** - Remove empty directories
- **Large Files** - Find files taking up space
- **Old Files** - Identify files not accessed recently
- **Temp Files** - Clean up temporary system files

### Organization
- **Smart Organize** - Auto-sort files into folders
- **Sort Files** - Sort by name, date, size, type
- **Deduplicate** - Remove exact file duplicates
- **Tag Files** - Add tags and labels to files

### Media
- **Resize Images** - Batch resize and crop images
- **Watermark** - Add watermarks to images
- **Thumbnail Generator** - Generate image thumbnails
- **Metadata Viewer** - View and edit EXIF and file metadata

### Advanced
- **Checksum** - Calculate MD5, SHA-256 hashes
- **Encrypt Files** - Secure files with encryption
- **File Sync** - Sync files between directories
- **Secure Delete** - Permanently erase with overwrite

### System
- **History** - View operation history
- **Settings** - Configure application settings
- **Trash** - View deleted files
- **Storage Details** - View detailed storage information

## Technology Stack

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables for theming
- **Icons**: Material Symbols Rounded (Google Fonts)
- **Data Storage**: JSON files for settings persistence

## Customization

### Adding New Tools
1. Add tool metadata to `TOOL_META` in `frontend/js/main.js`
2. Add tool category mapping to `TOOL_CATEGORIES`
3. Add dashboard color mapping to `DASHBOARD_CARD_COLORS`
4. Create HTML file in appropriate category folder under `frontend/html/`
5. Add CSS styles if needed

### Theming
Edit `frontend/css/variables.css` to customize colors, spacing, borders, and other design tokens.

## Development

### Running in Development Mode
```bash
cd backend
python main.py
```

The Flask server will start with debug mode enabled, auto-reloading on code changes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

*Licensed under the MIT License*

---

**Disk Kit** - Your complete file management toolkit
