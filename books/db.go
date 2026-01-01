package books

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func init() {
	dataDir := filepath.Join(".", "books", "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("[ERROR] Failed to create data directory: %v\n", err)
		return
	}

	dbPath := filepath.Join(dataDir, "books.db")
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Printf("[ERROR] Failed to open database: %v\n", err)
		return
	}

	// Create books table
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			author TEXT NOT NULL,
			genre TEXT,
			read_status TEXT DEFAULT 'unread',
			cover_image TEXT,
			is_signed INTEGER DEFAULT 0,
			tags TEXT DEFAULT '[]',
			created_at TEXT DEFAULT (datetime('now'))
		)
	`)
	if err != nil {
		log.Printf("[ERROR] Failed to create books table: %v\n", err)
	}
}
