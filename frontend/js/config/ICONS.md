# Icon Configuration

Centralized system for managing Material Symbols icons across the application.

## Files

- **`icons.js`** - JavaScript configuration for dynamic icon rendering
- **`icon-mappings.css`** - CSS classes for static HTML icon mapping

## Usage

### In JavaScript (Dynamic)

```javascript
import { getIconHTML, ICONS } from './config/icons.js';

// Get full HTML string
getIconHTML('rename'); // <span class="material-symbols-rounded">edit</span>

// Use in templates
const icon = getIconHTML('compress');
return `<div class="tool-icon">${icon}</div>`;
```

### In HTML (Static)

```html
<!-- Option 1: Use CSS class (auto-mapped) -->
<span class="icon-rename"></span>
<span class="icon-compress"></span>
<span class="icon-folder"></span>

<!-- Option 2: Direct Material Symbols class -->
<span class="material-symbols-rounded">edit</span>
```

## Adding New Icons

### 1. Add to `icons.js`

```javascript
export const ICONS = {
  // ... existing icons
  myNewAction: 'my_icon_name',
};
```

### 2. Add CSS mapping (optional, for HTML usage)

```css
.icon-my-new-action::before {
  content: 'my_icon_name';
}
```

### 3. Use anywhere

```javascript
// JS
getIconHTML('myNewAction');

// HTML
<span class="icon-my-new-action"></span>
```

## Naming Conventions

- Use camelCase for JavaScript keys
- Use kebab-case for CSS classes
- Group related icons with prefixes:
  - Tools: `rename`, `compress`, etc.
  - Actions: `organizeDownloads`, `compressProjects`
  - File types: `folder`, `image`, `video`

## Finding Icons

Browse available Material Symbols:
https://fonts.google.com/icons

## Color Variants

Use CSS classes for colored icon containers:
- `.tool-icon.blue` - Primary actions
- `.tool-icon.purple` - Secondary tools
- `.tool-icon.green` - Success/completion
- `.tool-icon.orange` - Warnings/storage
- `.tool-icon.gray` - Neutral/misc