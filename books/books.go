package books

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type Book struct {
	ID         int      `json:"id"`
	Title      string   `json:"title"`
	Author     string   `json:"author"`
	Genre      *string  `json:"genre"`
	ReadStatus string   `json:"read_status"`
	CoverImage *string  `json:"cover_image"`
	IsSigned   bool     `json:"is_signed"`
	Tags       []string `json:"tags"`
	CreatedAt  string   `json:"created_at"`
}

var coversDir string

func init() {
	coversDir = filepath.Join(".", "books", "covers")
	if err := os.MkdirAll(coversDir, 0755); err != nil {
		log.Printf("[ERROR] Failed to create covers directory: %v\n", err)
	}
}

func BooksController() {
	// Serve cover images
	http.HandleFunc("GET /books/covers/", serveCoverImage)

	// API routes
	http.HandleFunc("GET /api/books", handleListBooks)
	http.HandleFunc("GET /api/books/{id}", handleGetBook)
	http.HandleFunc("POST /api/books", handleCreateBook)
	http.HandleFunc("PUT /api/books/{id}", handleUpdateBook)
	http.HandleFunc("DELETE /api/books/{id}", handleDeleteBook)
	http.HandleFunc("GET /api/books/meta/tags", handleGetTags)
	http.HandleFunc("GET /api/books/meta/genres", handleGetGenres)

	// ISBN lookup
	http.HandleFunc("GET /api/isbn/{isbn}", handleISBNLookup)
}

func serveCoverImage(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/books/covers/")
	if filename == "" {
		http.Error(w, "Filename required", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(coversDir, filename)
	http.ServeFile(w, r, filePath)
}

func handleListBooks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	search := query.Get("search")
	genre := query.Get("genre")
	readStatus := query.Get("read_status")
	isSignedStr := query.Get("is_signed")
	tag := query.Get("tag")

	sql := "SELECT * FROM books WHERE 1=1"
	var args []interface{}

	if search != "" {
		sql += " AND (title LIKE ? OR author LIKE ?)"
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern)
	}
	if genre != "" {
		sql += " AND genre = ?"
		args = append(args, genre)
	}
	if readStatus != "" {
		sql += " AND read_status = ?"
		args = append(args, readStatus)
	}
	if isSignedStr != "" {
		isSigned := 0
		if isSignedStr == "true" {
			isSigned = 1
		}
		sql += " AND is_signed = ?"
		args = append(args, isSigned)
	}
	if tag != "" {
		sql += " AND tags LIKE ?"
		args = append(args, `%"`+tag+`"%`)
	}

	sql += " ORDER BY created_at DESC"

	rows, err := DB.Query(sql, args...)
	if err != nil {
		log.Printf("[ERROR] Failed to query books: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	books := make([]Book, 0)
	for rows.Next() {
		var book Book
		var tagsJSON string
		var isSignedInt int
		err := rows.Scan(
			&book.ID, &book.Title, &book.Author, &book.Genre,
			&book.ReadStatus, &book.CoverImage, &isSignedInt,
			&tagsJSON, &book.CreatedAt,
		)
		if err != nil {
			log.Printf("[ERROR] Failed to scan book: %v\n", err)
			continue
		}

		book.IsSigned = isSignedInt == 1
		if err := json.Unmarshal([]byte(tagsJSON), &book.Tags); err != nil {
			book.Tags = []string{}
		}

		// Update cover image path to use /books/covers/ prefix
		if book.CoverImage != nil && *book.CoverImage != "" {
			if !strings.HasPrefix(*book.CoverImage, "/books/covers/") {
				// Extract filename from path
				filename := filepath.Base(*book.CoverImage)
				newPath := "/books/covers/" + filename
				book.CoverImage = &newPath
			}
		}

		books = append(books, book)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

func handleGetBook(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var book Book
	var tagsJSON string
	var isSignedInt int
	err := DB.QueryRow(
		"SELECT * FROM books WHERE id = ?", id,
	).Scan(
		&book.ID, &book.Title, &book.Author, &book.Genre,
		&book.ReadStatus, &book.CoverImage, &isSignedInt,
		&tagsJSON, &book.CreatedAt,
	)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		log.Printf("[ERROR] Failed to get book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	book.IsSigned = isSignedInt == 1
	if err := json.Unmarshal([]byte(tagsJSON), &book.Tags); err != nil {
		book.Tags = []string{}
	}

	// Update cover image path
	if book.CoverImage != nil && *book.CoverImage != "" {
		if !strings.HasPrefix(*book.CoverImage, "/books/covers/") {
			filename := filepath.Base(*book.CoverImage)
			newPath := "/books/covers/" + filename
			book.CoverImage = &newPath
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(book)
}

func handleCreateBook(w http.ResponseWriter, r *http.Request) {
	var title, author, genre, readStatus, isSignedStr, tagsStr, existingCover string

	// Check content type
	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "application/json") {
		// Handle JSON request (from ISBN preview)
		var jsonData map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&jsonData); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		if val, ok := jsonData["title"].(string); ok {
			title = val
		}
		if val, ok := jsonData["author"].(string); ok {
			author = val
		}
		if val, ok := jsonData["genre"].(string); ok {
			genre = val
		}
		if val, ok := jsonData["read_status"].(string); ok {
			readStatus = val
		}
		if val, ok := jsonData["is_signed"].(bool); ok {
			if val {
				isSignedStr = "true"
			} else {
				isSignedStr = "false"
			}
		}
		if val, ok := jsonData["tags"].(string); ok {
			tagsStr = val
		}
		if val, ok := jsonData["cover_image"].(string); ok {
			existingCover = val
		}
	} else {
		// Parse multipart form (max 10MB)
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		title = r.FormValue("title")
		author = r.FormValue("author")
		genre = r.FormValue("genre")
		readStatus = r.FormValue("read_status")
		isSignedStr = r.FormValue("is_signed")
		tagsStr = r.FormValue("tags")
		existingCover = r.FormValue("cover_image")
	}

	if title == "" || author == "" {
		http.Error(w, "Title and author are required", http.StatusBadRequest)
		return
	}

	var coverImage *string

	// Handle file upload (only for multipart)
	if !strings.HasPrefix(contentType, "application/json") {
		file, header, err := r.FormFile("cover_image")
		if err == nil {
			defer file.Close()

			// Validate file extension and MIME type
			ext := filepath.Ext(header.Filename)
			allowedExts := regexp.MustCompile(`(?i)\.(jpeg|jpg|png|gif|webp)$`)
			if !allowedExts.MatchString(ext) {
				http.Error(w, "Invalid file type. Allowed: jpeg, jpg, png, gif, webp", http.StatusBadRequest)
				return
			}

			// Check MIME type
			mimeType := header.Header.Get("Content-Type")
			allowedMimes := regexp.MustCompile(`(?i)^image/(jpeg|jpg|png|gif|webp)$`)
			if !allowedMimes.MatchString(mimeType) {
				http.Error(w, "Invalid MIME type", http.StatusBadRequest)
				return
			}

			// Generate unique filename
			filename := fmt.Sprintf("%d-%d%s", time.Now().UnixNano(), time.Now().Unix(), ext)
			filePath := filepath.Join(coversDir, filename)

			// Save file
			dst, err := os.Create(filePath)
			if err != nil {
				log.Printf("[ERROR] Failed to create file: %v\n", err)
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			if _, err := io.Copy(dst, file); err != nil {
				log.Printf("[ERROR] Failed to save file: %v\n", err)
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}

			coverPath := "/books/covers/" + filename
			coverImage = &coverPath
		} else if existingCover != "" {
			// Use existing cover from ISBN lookup
			coverImage = &existingCover
		}
	} else if existingCover != "" {
		// Use existing cover from JSON request (ISBN lookup)
		coverImage = &existingCover
	}

	// Parse tags
	var tagsJSON string
	if tagsStr != "" {
		var tags []string
		if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil {
			// Try parsing as string array directly
			tagsJSON = tagsStr
		} else {
			tagsJSONBytes, _ := json.Marshal(tags)
			tagsJSON = string(tagsJSONBytes)
		}
		// Validate JSON
		if !json.Valid([]byte(tagsJSON)) {
			tagsJSON = "[]"
		}
	} else {
		tagsJSON = "[]"
	}

	// Handle is_signed
	isSigned := 0
	if isSignedStr == "true" || isSignedStr == "1" {
		isSigned = 1
	}

	// Set defaults
	if readStatus == "" {
		readStatus = "unread"
	}

	var genrePtr *string
	if genre != "" {
		genrePtr = &genre
	}

	// Insert book
	result, err := DB.Exec(`
		INSERT INTO books (title, author, genre, read_status, cover_image, is_signed, tags)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, title, author, genrePtr, readStatus, coverImage, isSigned, tagsJSON)
	if err != nil {
		log.Printf("[ERROR] Failed to insert book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("[ERROR] Failed to get last insert ID: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch created book
	var book Book
	var tagsJSONResult string
	var isSignedInt int
	err = DB.QueryRow(
		"SELECT * FROM books WHERE id = ?", id,
	).Scan(
		&book.ID, &book.Title, &book.Author, &book.Genre,
		&book.ReadStatus, &book.CoverImage, &isSignedInt,
		&tagsJSONResult, &book.CreatedAt,
	)
	if err != nil {
		log.Printf("[ERROR] Failed to fetch created book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	book.IsSigned = isSignedInt == 1
	if err := json.Unmarshal([]byte(tagsJSONResult), &book.Tags); err != nil {
		book.Tags = []string{}
	}

	// Update cover image path
	if book.CoverImage != nil && *book.CoverImage != "" {
		if !strings.HasPrefix(*book.CoverImage, "/books/covers/") {
			filename := filepath.Base(*book.CoverImage)
			newPath := "/books/covers/" + filename
			book.CoverImage = &newPath
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(book)
}

func handleUpdateBook(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Check if book exists
	var existing Book
	var tagsJSON string
	var isSignedInt int
	err := DB.QueryRow(
		"SELECT * FROM books WHERE id = ?", id,
	).Scan(
		&existing.ID, &existing.Title, &existing.Author, &existing.Genre,
		&existing.ReadStatus, &existing.CoverImage, &isSignedInt,
		&tagsJSON, &existing.CreatedAt,
	)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		log.Printf("[ERROR] Failed to get book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	existing.IsSigned = isSignedInt == 1
	if err := json.Unmarshal([]byte(tagsJSON), &existing.Tags); err != nil {
		existing.Tags = []string{}
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	author := r.FormValue("author")
	genre := r.FormValue("genre")
	readStatus := r.FormValue("read_status")
	isSignedStr := r.FormValue("is_signed")
	tagsStr := r.FormValue("tags")

	// Use existing values if not provided
	if title == "" {
		title = existing.Title
	}
	if author == "" {
		author = existing.Author
	}
	if readStatus == "" {
		readStatus = existing.ReadStatus
	}

	var genrePtr *string
	if genre != "" {
		genrePtr = &genre
	} else if existing.Genre != nil {
		genrePtr = existing.Genre
	}

	coverImage := existing.CoverImage

	// Handle file upload
	file, header, err := r.FormFile("cover_image")
	if err == nil {
		defer file.Close()

		// Delete old cover if exists
		if existing.CoverImage != nil && *existing.CoverImage != "" {
			oldPath := strings.TrimPrefix(*existing.CoverImage, "/books/covers/")
			if oldPath != *existing.CoverImage {
				oldFilePath := filepath.Join(coversDir, oldPath)
				if err := os.Remove(oldFilePath); err != nil && !os.IsNotExist(err) {
					log.Printf("[WARN] Failed to remove old cover: %v\n", err)
				}
			}
		}

		// Validate file
		ext := filepath.Ext(header.Filename)
		allowedExts := regexp.MustCompile(`(?i)\.(jpeg|jpg|png|gif|webp)$`)
		if !allowedExts.MatchString(ext) {
			http.Error(w, "Invalid file type", http.StatusBadRequest)
			return
		}

		mimeType := header.Header.Get("Content-Type")
		allowedMimes := regexp.MustCompile(`(?i)^image/(jpeg|jpg|png|gif|webp)$`)
		if !allowedMimes.MatchString(mimeType) {
			http.Error(w, "Invalid MIME type", http.StatusBadRequest)
			return
		}

		// Save new file
		filename := fmt.Sprintf("%d-%d%s", time.Now().UnixNano(), time.Now().Unix(), ext)
		filePath := filepath.Join(coversDir, filename)

		dst, err := os.Create(filePath)
		if err != nil {
			log.Printf("[ERROR] Failed to create file: %v\n", err)
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			log.Printf("[ERROR] Failed to save file: %v\n", err)
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}

		coverPath := "/books/covers/" + filename
		coverImage = &coverPath
	}

	// Parse tags
	var tagsJSONResult string
	if tagsStr != "" {
		var tags []string
		if err := json.Unmarshal([]byte(tagsStr), &tags); err != nil {
			tagsJSONResult = tagsStr
		} else {
			tagsJSONBytes, _ := json.Marshal(tags)
			tagsJSONResult = string(tagsJSONBytes)
		}
		if !json.Valid([]byte(tagsJSONResult)) {
			tagsJSONResult = tagsJSON
		}
	} else {
		tagsJSONResult = tagsJSON
	}

	// Handle is_signed
	isSigned := existing.IsSigned
	if isSignedStr != "" {
		isSigned = (isSignedStr == "true" || isSignedStr == "1")
	}

	isSignedInt = 0
	if isSigned {
		isSignedInt = 1
	}

	// Update book
	_, err = DB.Exec(`
		UPDATE books SET
			title = ?,
			author = ?,
			genre = ?,
			read_status = ?,
			cover_image = ?,
			is_signed = ?,
			tags = ?
		WHERE id = ?
	`, title, author, genrePtr, readStatus, coverImage, isSignedInt, tagsJSONResult, id)
	if err != nil {
		log.Printf("[ERROR] Failed to update book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch updated book
	var book Book
	var tagsJSONFinal string
	var isSignedIntFinal int
	err = DB.QueryRow(
		"SELECT * FROM books WHERE id = ?", id,
	).Scan(
		&book.ID, &book.Title, &book.Author, &book.Genre,
		&book.ReadStatus, &book.CoverImage, &isSignedIntFinal,
		&tagsJSONFinal, &book.CreatedAt,
	)
	if err != nil {
		log.Printf("[ERROR] Failed to fetch updated book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	book.IsSigned = isSignedIntFinal == 1
	if err := json.Unmarshal([]byte(tagsJSONFinal), &book.Tags); err != nil {
		book.Tags = []string{}
	}

	// Update cover image path
	if book.CoverImage != nil && *book.CoverImage != "" {
		if !strings.HasPrefix(*book.CoverImage, "/books/covers/") {
			filename := filepath.Base(*book.CoverImage)
			newPath := "/books/covers/" + filename
			book.CoverImage = &newPath
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(book)
}

func handleDeleteBook(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Get book to check existence and get cover image path
	var coverImage *string
	err := DB.QueryRow("SELECT cover_image FROM books WHERE id = ?", id).Scan(&coverImage)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		log.Printf("[ERROR] Failed to get book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Delete cover image if exists
	if coverImage != nil && *coverImage != "" {
		// Extract filename from path
		filename := strings.TrimPrefix(*coverImage, "/books/covers/")
		if filename != *coverImage {
			filePath := filepath.Join(coversDir, filename)
			if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
				log.Printf("[WARN] Failed to remove cover image: %v\n", err)
			}
		}
	}

	// Delete book
	_, err = DB.Exec("DELETE FROM books WHERE id = ?", id)
	if err != nil {
		log.Printf("[ERROR] Failed to delete book: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func handleGetTags(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query("SELECT tags FROM books")
	if err != nil {
		log.Printf("[ERROR] Failed to query tags: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tagSet := make(map[string]bool)
	for rows.Next() {
		var tagsJSON string
		if err := rows.Scan(&tagsJSON); err != nil {
			continue
		}

		var tags []string
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err != nil {
			continue
		}

		for _, tag := range tags {
			tagSet[tag] = true
		}
	}

	tags := make([]string, 0, len(tagSet))
	for tag := range tagSet {
		tags = append(tags, tag)
	}

	// Sort tags
	for i := 0; i < len(tags)-1; i++ {
		for j := i + 1; j < len(tags); j++ {
			if tags[i] > tags[j] {
				tags[i], tags[j] = tags[j], tags[i]
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func handleGetGenres(w http.ResponseWriter, r *http.Request) {
	rows, err := DB.Query("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL")
	if err != nil {
		log.Printf("[ERROR] Failed to query genres: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	genres := make([]string, 0)
	for rows.Next() {
		var genre string
		if err := rows.Scan(&genre); err != nil {
			continue
		}
		genres = append(genres, genre)
	}

	// Sort genres
	for i := 0; i < len(genres)-1; i++ {
		for j := i + 1; j < len(genres); j++ {
			if genres[i] > genres[j] {
				genres[i], genres[j] = genres[j], genres[i]
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(genres)
}
