# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NbirdHttp is a personal web server written in Go, designed to run on a Raspberry Pi. It's a monorepo containing a Go backend (using only stdlib) and multiple frontend web applications (vanilla HTML/CSS/JS). The server runs on port 80 and is live at [nbird.dev](https://nbird.dev/).

## Running the Server

```bash
# Start the server (default port 80)
go run main.go

# The server accepts shutdown commands via stdin:
# - 'q' or 'Q': graceful shutdown
# - 'r' or 'R': graceful shutdown
# - Ctrl+C (SIGINT) or SIGTERM: graceful shutdown
```

## Testing

```bash
# Run all tests
go test ./...

# Run tests for specific package
go test ./auth
go test ./punch
go test ./books

# Run tests with verbose output
go test -v ./...

# Run specific test
go test -v -run TestFunctionName ./package-name
```

## Architecture

### Backend Structure

The Go backend follows a modular controller pattern where each feature module registers its own HTTP handlers:

- **main.go**: Entry point that initializes all controllers and handles graceful shutdown
- **auth/**: User authentication (custom, file-based persistence)
- **punch/**: Time-tracking/punch clock functionality
- **quick-pen/**: Writing sprint tracking application
- **books/**: Book inventory management with SQLite database

Each module exports a `*Controller()` function (e.g., `auth.AuthController()`, `books.BooksController()`) that registers HTTP routes in `main.go`.

### Database Architecture

**No Traditional Database**: The server primarily uses custom file-based persistence instead of databases, except for the books module which uses SQLite (`modernc.org/sqlite` - pure Go, no CGo).

- **books/**: Uses SQLite with schema in `books/db.go`
- **auth/**, **punch/**, **quick-pen/**: Custom plain-text file formats

### Frontend Structure

All frontend apps live in `/static` and use vanilla JavaScript with no frameworks:

**Shared Resources:**
- `/static/styles/`: Global styles, reusable component styles (cards, headers, footers, modals)
- `/static/scripts/`: Dynamic header/footer loading, authentication utilities
- `/static/assets/profile.json`: Central profile data used across homepage and resume

**Key Applications:**
- `/static/books/`: Book inventory app with ISBN scanning (html5-qrcode library)
- `/static/quick-pen/`: Writing sprint timer with dashboards
- `/static/resume/`: Dynamic online resume
- `/static/punch.html`: Time-tracking interface
- Various game implementations (back-alley, bank, dining-philosophers, mex-train-dominoes)

### HTTP Routing Pattern

Routes use Go 1.22+ enhanced routing with method prefixes and path parameters:

```go
http.HandleFunc("GET /api/items", handleListItems)
http.HandleFunc("GET /api/items/{id}", handleGetItem)
http.HandleFunc("POST /api/items", handleCreateItem)
```

Access path parameters with `r.PathValue("id")`. For more complex patterns, see existing modules.

## Module Examples

The monorepo contains several modules demonstrating different architectural patterns:

### Authentication Module (`/auth`)
- Custom file-based user persistence
- Session management
- Example of custom plain-text data format

### Punch Clock (`/punch`)
- Time-tracking functionality
- File-based data storage
- Simple CRUD operations

### Quick Pen (`/quick-pen`)
- Writing sprint timer
- Dashboard interface
- Example of interactive frontend without database

### Books Inventory (`/books`)
- SQLite database example (only module using a database)
- RESTful API with full CRUD operations
- External API integration (Open Library for ISBN lookup)
- File upload handling (cover images in `/books/covers/`)
- Barcode scanning (html5-qrcode library)
- Modal-based UI with grid/list view toggle

## Development Guidelines

### Go Backend

- **Standard Library Only**: Prefer Go stdlib; only exception is SQLite (`modernc.org/sqlite`) where relational database features are needed
- **Logging Convention**: Use `log.Printf` with prefixes: `[INFO]`, `[WARN]`, `[ERROR]`
- **Error Handling**: Always log errors before returning HTTP errors
- **File Paths**: Use `filepath.Join()` for cross-platform compatibility

### Frontend

- **No Frameworks**: Vanilla JavaScript, HTML, CSS only
- **Responsive Design**: Use media queries for different screen sizes; CSS approach varies by project
- **Shared Components**: Most pages use `/static/scripts/load-header.js` and `/static/scripts/load-footer.js` for consistency
- **Modal Pattern**: When using modals, add body class to prevent background scrolling
- **Form Data**: Use FormData API for file uploads; choose `multipart/form-data` or `application/json` based on needs
- **LocalStorage**: Used selectively for persisting user preferences and state

## Common Patterns

### Adding a New Module

1. Create a new package directory (e.g., `/mymodule`)
2. Implement handler functions for HTTP endpoints
3. Export a `*Controller()` function that registers routes
4. Call the controller in `main.go`
5. Add corresponding frontend under `/static/mymodule/` if needed
6. Follow existing logging and error handling patterns

### Creating a New Frontend App

1. Create directory under `/static/your-app/`
2. Use shared styles from `/static/styles/` and include `/styles/global.css`
3. Load header/footer with scripts from `/static/scripts/` for consistency
4. Add responsive design with media queries as appropriate
5. Register backend routes in module's `*Controller()` function if API endpoints are needed

### File Upload Handling

When implementing file uploads:
- Parse multipart form with reasonable size limit: `r.ParseMultipartForm(10 << 20)` (10MB)
- Validate file extensions and MIME types before saving
- Generate unique filenames (e.g., using timestamps) to prevent collisions
- Store files in module-specific directories
- Clean up old files on update/delete operations
- Example implementation: [books/books.go](books/books.go) `handleCreateBook()`

### Persistence Patterns

Choose appropriate data persistence based on requirements:
- **File-based**: Simple custom formats for straightforward data (auth, punch, quick-pen)
- **SQLite**: When you need relational queries, transactions, or complex data structures (books)
- Store module-specific data files within the module directory
- Use `filepath.Join()` for cross-platform path handling

## Port Configuration

Server runs on port 80 by default (requires sudo on Linux/Mac). Modify `main.go` line 68 to change port:

```go
server := &http.Server{Addr: ":8080"} // Example: port 8080
```
