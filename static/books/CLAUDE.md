# CLAUDE.md - Books Inventory Project

This file provides guidance to Claude Code (claude.ai/code) when working with the Books Inventory application.

## Project Overview

A full-stack book inventory management system with ISBN barcode scanning, cover image management, and responsive grid/list views. Backend uses Go + SQLite, frontend is vanilla JavaScript with mobile-first design.

## Architecture

### Backend (Go)
- **Location**: `/books/*.go` (sibling to `/static/books/`)
- **Database**: SQLite via `modernc.org/sqlite` (pure Go, no CGo)
- **API Base**: `/api/books`
- **Cover Images**: Served from `/books/covers/`, stored in `/books/covers/` directory

### Frontend (Vanilla JS)
- **Location**: `/static/books/`
- **Entry Point**: `index.html`
- **JavaScript**: `js/app.js` (~650 lines)
- **Styles**: `css/styles.css` (~860 lines)
- **External Library**: html5-qrcode (CDN) for ISBN barcode scanning

## Database Schema

```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT,
    read_status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'reading', 'read'
    cover_image TEXT,
    is_signed INTEGER DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]', -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/books` | List all books (supports filtering via query params) |
| GET | `/api/books/{id}` | Get single book |
| POST | `/api/books` | Create new book (multipart/form-data or application/json) |
| PUT | `/api/books/{id}` | Update book (multipart/form-data) |
| DELETE | `/api/books/{id}` | Delete book and its cover image |
| GET | `/api/books/meta/tags` | Get all unique tags |
| GET | `/api/books/meta/genres` | Get all unique genres |
| GET | `/api/isbn/{isbn}` | Lookup book by ISBN from Open Library API |
| GET | `/books/covers/{filename}` | Serve cover image files |

### Query Parameters for GET `/api/books`

- `search`: Search in title and author (case-insensitive LIKE)
- `genre`: Filter by exact genre match
- `read_status`: Filter by status ('unread', 'reading', 'read')
- `is_signed`: Filter by signed status ('true' or 'false')
- `tag`: Filter by tag (uses JSON LIKE matching)

## Frontend Architecture

### State Management (`app.js`)

```javascript
// Global state variables
let books = [];              // All books data
let genres = [];             // Available genres
let allTags = [];            // All unique tags
let currentTags = [];        // Tags for add/edit modal
let previewTags = [];        // Tags for ISBN preview modal
let editingBookId = null;    // Current book being edited
let deleteBookId = null;     // Book pending deletion
let html5QrCode = null;      // Scanner instance
let isScanning = false;      // Scanner active state
let currentView = 'grid';    // View mode ('grid' or 'list')
```

### Modal System

Four modals with body class `.modal-open` to prevent background scrolling:

1. **Add/Edit Book Modal** (`#bookModal`): Form with cover upload, tags, metadata
2. **Delete Confirmation Modal** (`#deleteModal`): Simple yes/no confirmation
3. **ISBN Scanner Modal** (`#scanModal`): Camera view with html5-qrcode scanner
4. **ISBN Preview Modal** (`#previewModal`): Edit fetched ISBN data before saving

### View Toggle System

- **Grid View** (default): Vertical cards with cover images, text buttons
- **List View**: Horizontal rows, no covers, icon-only buttons (pencil/trash)
- Toggle via button in header, persists to localStorage key `bookView`
- CSS uses body class `.list-view` for all list-specific styling

### ISBN Scanning Flow

```
User clicks "Scan ISBN"
  → openScanModal()
  → startScanner() (html5QrCode.start with EAN/UPC formats)
  → onScanSuccess(isbn)
  → fetch `/api/isbn/{isbn}`
  → openPreviewModal(bookData)
  → User edits/confirms
  → handlePreviewSubmit()
  → POST `/api/books` with JSON
```

**Scanner Configuration** (`app.js` lines 411-442):
- Formats: `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E` (ISBN barcodes)
- Dynamic qrbox sizing: 80% width × 40% height (rectangular for barcodes)
- Aspect ratio: 16:9 for mobile camera compatibility
- Back camera preferred: `{ facingMode: 'environment' }`

## CSS Architecture

### Mobile-First Approach

Base styles target mobile, desktop overrides in `@media (min-width: 601px)` at end of file.

### Key CSS Classes

**Grid View:**
- `.books__grid`: CSS Grid with `auto-fill` and `minmax(150px, 1fr)`
- `.book-card`: Vertical layout with cover → body → actions
- `.book-card__cover`: 2:3 aspect ratio for cover images

**List View:**
- `body.list-view .books__grid`: Flexbox column layout
- `body.list-view .book-card`: Horizontal flex layout
- `body.list-view .book-card__cover`: Hidden (`display: none`)
- `body.list-view .book-card__actions .btn-text`: Hidden (shows icons only)
- `body.list-view .book-card__actions .btn-icon`: Visible

### Design Tokens (CSS variables)

```css
--color-bg: #1a1a1f         /* Main background */
--color-bg-elevated: #252530 /* Cards, header */
--color-bg-card: #2a2a35     /* Book cards */
--color-accent: #c9a227      /* Gold accent */
--color-success: #4a9d6e     /* Success/read status */
--color-danger: #c75a5a      /* Delete button */
--font-display: 'Crimson Pro' /* Serif for titles */
--font-body: 'Outfit'        /* Sans-serif body text */
```

## Development Workflow

### Adding a New Feature

1. **Backend**: Add handler in `/books/books.go`, register in `BooksController()`
2. **Frontend**: Update `app.js` with new function, add UI in `index.html`
3. **Styling**: Follow mobile-first pattern, add to `styles.css`

### Testing ISBN Scanner Locally

1. Run server: `go run main.go`
2. Navigate to `http://localhost/books/`
3. Click "Scan ISBN", allow camera access
4. Point at ISBN barcode (back of book, usually EAN-13)
5. Check browser console for scan results and API responses

### Modifying Scanner Configuration

Edit `startScanner()` in `app.js` (lines 406-449):
- Change `formatsToSupport` to add/remove barcode types
- Adjust `qrbox` function for different scan area sizing
- Modify `fps` (default: 10) for scan frequency vs performance

### Cover Image Handling

**Upload Flow:**
1. User selects file → `handleImageChange()` shows preview
2. Form submit → `handleSubmit()` creates FormData
3. Backend validates extension + MIME type
4. Saves to `/books/covers/{timestamp}-{timestamp}.{ext}`
5. Stores path as `/books/covers/{filename}` in database

**Update Flow:**
1. Old cover deleted from filesystem if exists
2. New cover saved with new timestamp filename
3. Database updated with new path

**Delete Flow:**
1. Cover path retrieved from database
2. File deleted from `/books/covers/`
3. Book record deleted from database

## Common Tasks

### Add a New Filter

1. **HTML**: Add filter input/select in `index.html` filters section
2. **JavaScript**:
   - Add event listener in `setupEventListeners()`
   - Update `loadBooks()` to read filter value and add to query params
3. **Backend**: Add query parameter handling in `handleListBooks()`

### Add a New Book Field

1. **Database**: Add column to schema in `books/db.go` (run migration)
2. **Backend**:
   - Update `Book` struct in `books/books.go`
   - Update INSERT/UPDATE SQL in handlers
   - Update Scan() calls to include new field
3. **Frontend**:
   - Add input to forms in `index.html`
   - Update `openModal()` to populate field when editing
   - Update `handleSubmit()` to include field in FormData
   - Update `renderBooks()` to display field in cards

### Change View Toggle Behavior

- View state stored in localStorage key `bookView` ('grid' or 'list')
- Toggle function: `toggleView()` in `app.js` (lines 381-385)
- CSS scoped with `body.list-view` selector
- Icons in toggle button switch via CSS display rules (lines 44-63 in styles.css)

## Troubleshooting

### Scanner Not Working

1. Check HTTPS (required for camera access) or localhost
2. Verify camera permissions in browser
3. Check console for scanner errors
4. Ensure barcode is EAN-13/EAN-8/UPC format (other formats filtered out)

### Cover Images Not Loading

1. Verify `/books/covers/` directory exists (created in `init()`)
2. Check file permissions on covers directory
3. Verify path format: `/books/covers/{filename}` in database
4. Check network tab for 404s on cover URLs

### ISBN Lookup Failing

1. Check Open Library API status (backend dependency)
2. Verify ISBN format is valid
3. Check backend logs for API response errors
4. Note: Not all ISBNs have data in Open Library

## External Dependencies

- **html5-qrcode**: Loaded via CDN in `index.html` line 12
  - Version: Latest from `unpkg.com`
  - Used for: Camera-based barcode scanning
  - Docs: https://github.com/mebjas/html5-qrcode

- **Open Library API**: Used by backend for ISBN lookup
  - Endpoint: `https://openlibrary.org/api/books`
  - Rate limiting: Be respectful, no auth required
  - Coverage: Not all books have full metadata
