# The Ark - Photo Gallery Metadata Editor

A lightweight, browser-based tool for viewing and editing metadata in your photos.

## Features

- Upload images via drag-and-drop or file selector
- Supports folders and batch uploads
- Edit EXIF metadata (description and photo credit)
- Save metadata directly to your JPEG images
- Download individual or batch edited images
- Recent credits history for faster workflows
- No server uploads - all processing happens in your browser
- Dark mode interface for photo editing

## Usage

1. Visit [https://arkeditor.github.io/photo-metadata-editor/](https://arkeditor.github.io/photo-metadata-editor/)
2. Drag and drop photos or folders onto the gallery area
3. Select a photo to view and edit its metadata
4. Add description and photo credit information
5. Click "Apply Changes" to save metadata to the image
6. Download your edited images

## Supported Formats

- JPG/JPEG (full metadata support)
- PNG, TIFF (limited metadata support)

## Development

This project is a static HTML/CSS/JavaScript application using the [piexifjs](https://github.com/hMatoba/piexifjs) library for EXIF metadata manipulation.

### Local Development

To run this project locally:

1. Clone the repository
   ```
   git clone https://github.com/arkeditor/photo-metadata-editor.git
   cd photo-metadata-editor
   ```

2. Open index.html in your browser or use a local server
   ```
   # Using Python's built-in server
   python -m http.server
   ```

## License

MIT License - Feel free to use, modify, and distribute this software.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
