# HyperNote (Web Annotator Chrome Extension)

## Overview
The Web Annotator Chrome extension provides users with powerful annotation capabilities for webpages. It allows users to highlight text, add notes, customize highlight colors, search and filter annotations, export annotated pages, and use keyboard shortcuts for efficient annotation.

## Features
- **Highlight Content:** Easily select and highlight text (Ctrl+Shift+H) on any webpage using customizable color-coded highlights.
- **Add Notes:** Attach contextual notes to highlighted content (Ctrl+Shift+K) for personal insights or additional information.
- **Persistence:** Annotations persist across browser sessions, ensuring annotations remain intact even after closing and reopening the browser.
- **Customization Options:** Customize highlight colors and styles to suit individual preferences.
- **Search and Filter:** Search for specific annotations or filter annotations based on date or keyword.
- **Export and Share:** Export annotated pages with highlights and notes to share with others or save for offline reference.
- **Keyboard Shortcuts:** Use keyboard shortcuts for efficient annotation (Ctrl+Shift+K), highlighting (Ctrl+Shift+H), and navigation within the extension.

## Installation
1. Download the extension files from the repository.
2. Open Google Chrome.
3. Navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the upper-right corner.
5. Click on "Load unpacked" and select the downloaded extension folder.

## Usage
1. Once installed, click on the extension icon in the Chrome toolbar to open the Web Annotator popup.
2. Use the provided options to highlight content(Ctrl+Shift+H), add notes(Ctrl+Shift+K), customize highlight colors, search annotations, and export annotated pages as pdf.
3. Access your annotations by clicking on the HyperNote icon in the Chrome toolbar.

## Files and Structure
- **manifest.json:** Configuration file for the Chrome extension.
- **background.js:** Handles background tasks and keyboard shortcuts.
- **contentScript.js:** Contains logic for highlighting text and adding notes on webpages.
- **popup.html:** The HTML structure of the popup window.
- **popup.css:** Styling for the popup window.
- **popup.js:** Logic for handling user interactions in the popup window.
- **assets** Contains the icons used for the extension.
