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

type ISBNResponse struct {
	ISBN        string  `json:"isbn"`
	Title       string  `json:"title"`
	Author      string  `json:"author"`
	Genre       *string `json:"genre"`
	CoverImage  *string `json:"cover_image"`
	Publisher   *string `json:"publisher"`
	PublishDate *string `json:"publish_date"`
	Pages       *int    `json:"pages"`
}

type OpenLibraryBook struct {
	Title         string                 `json:"title"`
	Authors       []OpenLibraryAuthorRef `json:"authors"`
	Works         []OpenLibraryWorkRef   `json:"works"`
	Subjects      []interface{}          `json:"subjects"`
	Publishers    []string               `json:"publishers"`
	PublishDate   string                 `json:"publish_date"`
	NumberOfPages *int                   `json:"number_of_pages"`
}

type OpenLibraryAuthorRef struct {
	Key string `json:"key"`
}

type OpenLibraryWorkRef struct {
	Key string `json:"key"`
}

type OpenLibraryAuthor struct {
	Name string `json:"name"`
}

type OpenLibraryWork struct {
	Authors  []OpenLibraryWorkAuthor `json:"authors"`
	Subjects []interface{}           `json:"subjects"`
}

type OpenLibraryWorkAuthor struct {
	Author OpenLibraryAuthorRef `json:"author"`
	Key    string               `json:"key"`
}

var genrePatterns = []struct {
	keywords []string
	genre    string
}{
	{[]string{"science fiction", "sci-fi", "scifi"}, "Sci-Fi"},
	{[]string{"fantasy"}, "Fantasy"},
	{[]string{"mystery", "detective"}, "Mystery"},
	{[]string{"thriller", "suspense"}, "Thriller"},
	{[]string{"horror"}, "Horror"},
	{[]string{"romance"}, "Romance"},
	{[]string{"biography", "autobiography", "memoir"}, "Biography"},
	{[]string{"historical fiction", "history"}, "Historical"},
	{[]string{"adventure"}, "Adventure"},
	{[]string{"young adult"}, "Young Adult"},
	{[]string{"children", "juvenile"}, "Children"},
	{[]string{"crime"}, "Crime"},
	{[]string{"humor", "comedy"}, "Humor"},
	{[]string{"poetry", "poems"}, "Poetry"},
	{[]string{"graphic novel", "comic", "manga"}, "Graphic Novel"},
	{[]string{"dystopia"}, "Dystopian"},
	{[]string{"cookbook", "cooking", "recipes"}, "Cookbook"},
	{[]string{"self-help"}, "Self-Help"},
	{[]string{"classic"}, "Classics"},
}

func extractGenre(subjects []interface{}) *string {
	if len(subjects) == 0 {
		return nil
	}

	var subjectStrs []string
	for _, s := range subjects {
		var subjectStr string
		switch v := s.(type) {
		case string:
			subjectStr = v
		case map[string]interface{}:
			if name, ok := v["name"].(string); ok {
				subjectStr = name
			}
		}

		subjectStr = strings.ToLower(subjectStr)
		if subjectStr != "" && subjectStr != "fiction" && subjectStr != "general" {
			subjectStrs = append(subjectStrs, subjectStr)
		}
	}

	for _, pattern := range genrePatterns {
		for _, subjectStr := range subjectStrs {
			for _, keyword := range pattern.keywords {
				if strings.Contains(subjectStr, keyword) {
					return &pattern.genre
				}
			}
		}
	}

	return nil
}

func handleISBNLookup(w http.ResponseWriter, r *http.Request) {
	isbn := r.PathValue("isbn")

	// Clean ISBN (remove dashes and spaces)
	cleanIsbn := regexp.MustCompile(`[-\s]`).ReplaceAllString(isbn, "")

	// Validate ISBN format
	isbn10Pattern := regexp.MustCompile(`^\d{9}[\dX]$`)
	isbn13Pattern := regexp.MustCompile(`^\d{13}$`)
	if !isbn10Pattern.MatchString(cleanIsbn) && !isbn13Pattern.MatchString(cleanIsbn) {
		http.Error(w, "Invalid ISBN format", http.StatusBadRequest)
		return
	}

	// Fetch book data from Open Library
	bookURL := fmt.Sprintf("https://openlibrary.org/isbn/%s.json", cleanIsbn)
	bookResp, err := http.Get(bookURL)
	if err != nil {
		log.Printf("[ERROR] Failed to fetch book data: %v\n", err)
		http.Error(w, "Failed to lookup ISBN", http.StatusInternalServerError)
		return
	}
	defer bookResp.Body.Close()

	if bookResp.StatusCode != http.StatusOK {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}

	var bookData OpenLibraryBook
	if err := json.NewDecoder(bookResp.Body).Decode(&bookData); err != nil {
		log.Printf("[ERROR] Failed to decode book data: %v\n", err)
		http.Error(w, "Failed to parse book data", http.StatusInternalServerError)
		return
	}

	// Extract author
	authorName := "Unknown Author"
	if len(bookData.Authors) > 0 {
		authorKey := bookData.Authors[0].Key
		authorURL := fmt.Sprintf("https://openlibrary.org%s.json", authorKey)
		authorResp, err := http.Get(authorURL)
		if err == nil {
			defer authorResp.Body.Close()
			if authorResp.StatusCode == http.StatusOK {
				var authorData OpenLibraryAuthor
				if err := json.NewDecoder(authorResp.Body).Decode(&authorData); err == nil {
					if authorData.Name != "" {
						authorName = authorData.Name
					}
				}
			}
		}
	}

	var genre *string

	// Always fetch work for subjects (and author fallback)
	if len(bookData.Works) > 0 {
		workKey := bookData.Works[0].Key
		workURL := fmt.Sprintf("https://openlibrary.org%s.json", workKey)
		workResp, err := http.Get(workURL)
		if err == nil {
			defer workResp.Body.Close()
			if workResp.StatusCode == http.StatusOK {
				var workData OpenLibraryWork
				if err := json.NewDecoder(workResp.Body).Decode(&workData); err == nil {
					// Get author from work if not already found
					if authorName == "Unknown Author" && len(workData.Authors) > 0 {
						var authorKey string
						if workData.Authors[0].Author.Key != "" {
							authorKey = workData.Authors[0].Author.Key
						} else if workData.Authors[0].Key != "" {
							authorKey = workData.Authors[0].Key
						}

						if authorKey != "" {
							authorURL := fmt.Sprintf("https://openlibrary.org%s.json", authorKey)
							authorResp, err := http.Get(authorURL)
							if err == nil {
								defer authorResp.Body.Close()
								if authorResp.StatusCode == http.StatusOK {
									var authorData OpenLibraryAuthor
									if err := json.NewDecoder(authorResp.Body).Decode(&authorData); err == nil {
										if authorData.Name != "" {
											authorName = authorData.Name
										}
									}
								}
							}
						}
					}

					// Get genre from work subjects
					if len(workData.Subjects) > 0 {
						genre = extractGenre(workData.Subjects)
					}
				}
			}
		}
	}

	// Try book-level subjects if work didn't have any
	if genre == nil && len(bookData.Subjects) > 0 {
		genre = extractGenre(bookData.Subjects)
	}

	// Download cover image
	var coverPath *string
	coverURL := fmt.Sprintf("https://covers.openlibrary.org/b/isbn/%s-L.jpg", cleanIsbn)
	coverResp, err := http.Get(coverURL)
	if err == nil {
		defer coverResp.Body.Close()
		if coverResp.StatusCode == http.StatusOK {
			body, err := io.ReadAll(coverResp.Body)
			if err == nil {
				// Check if it's actually an image (Open Library returns a 1x1 pixel for missing covers)
				// Only save if larger than 1KB (placeholder images are tiny)
				if len(body) > 1000 {
					filename := fmt.Sprintf("%s-%d.jpg", cleanIsbn, time.Now().Unix())
					filePath := filepath.Join(coversDir, filename)

					if err := os.WriteFile(filePath, body, 0644); err == nil {
						path := "/books/covers/" + filename
						coverPath = &path
					} else {
						log.Printf("[WARN] Failed to save cover image: %v\n", err)
					}
				}
			}
		}
	}

	// Build response
	result := ISBNResponse{
		ISBN:       cleanIsbn,
		Title:      bookData.Title,
		Author:     authorName,
		Genre:      genre,
		CoverImage: coverPath,
	}

	if bookData.Title == "" {
		result.Title = "Unknown Title"
	}

	if len(bookData.Publishers) > 0 {
		result.Publisher = &bookData.Publishers[0]
	}

	if bookData.PublishDate != "" {
		result.PublishDate = &bookData.PublishDate
	}

	if bookData.NumberOfPages != nil {
		result.Pages = bookData.NumberOfPages
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
