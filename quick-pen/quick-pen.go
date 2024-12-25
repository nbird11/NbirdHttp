package quickpen

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	SPRINTS_DIR  = "./quick-pen/.sprints.d"
	SPRINTS_FILE = filepath.Join(SPRINTS_DIR, ".sprints")
	CONTENT_DIR  = filepath.Join(SPRINTS_DIR, ".content.d")
)

type Sprint struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	WordCount int       `json:"wordCount"`
	WPM       float64   `json:"wpm"`
	Duration  string    `json:"duration"`
	Completed bool      `json:"completed"`
	Content   string    `json:"content,omitempty"` // Content is stored separately in files
}

func init() {
	// Ensure sprints directory exists
	if err := os.MkdirAll(SPRINTS_DIR, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create sprints directory: %v", err))
	}

	// Ensure content directory exists
	if err := os.MkdirAll(CONTENT_DIR, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create content directory: %v", err))
	}
}

func QuickPenController() {
	http.HandleFunc("GET /api/quick-pen/sprints", func(w http.ResponseWriter, r *http.Request) {
		sprints, err := loadSprints()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(sprints)
	})

	http.HandleFunc("POST /api/quick-pen/sprint", func(w http.ResponseWriter, r *http.Request) {
		var sprint Sprint
		if err := json.NewDecoder(r.Body).Decode(&sprint); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Extract content before saving sprint metadata
		content := sprint.Content
		sprint.Content = "" // Clear content from metadata

		if err := saveSprint(sprint); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Save content to separate file
		if err := saveContent(sprint.ID, content); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	})

	// New endpoint to get sprint content
	http.HandleFunc("GET /api/quick-pen/sprint/{id}/content", func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		var id int
		if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
			http.Error(w, "Invalid sprint ID", http.StatusBadRequest)
			return
		}

		content, err := loadContent(id)
		if err != nil {
			if os.IsNotExist(err) {
				http.Error(w, "Sprint content not found", http.StatusNotFound)
			} else {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}

		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(content))
	})
}

func loadSprints() ([]Sprint, error) {
	data, err := os.ReadFile(SPRINTS_FILE)
	if err != nil {
		if os.IsNotExist(err) {
			return []Sprint{}, nil
		}
		return nil, err
	}

	var sprints []Sprint
	lines := strings.Split(string(data), "\n")
	var sprint Sprint

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// fmt.Printf("DEBUG: line:%q\n", line)
		if line == "" {
			if sprint.ID != 0 {
				// fmt.Println("DEBUG: sprint:", sprint)
				sprints = append(sprints, sprint)
				sprint = Sprint{}
			}
			continue
		}

		parts := strings.Split(line, "::")
		if len(parts) != 2 {
			continue
		}
		// fmt.Println("DEBUG: parts:", parts)

		key, value := parts[0], parts[1]
		switch key {
		case "ID":
			fmt.Sscanf(value, "%d", &sprint.ID)
		case "TIME":
			sprint.Timestamp, _ = time.Parse(time.RFC3339, value)
		case "WORDS":
			fmt.Sscanf(value, "%d", &sprint.WordCount)
		case "WPM":
			fmt.Sscanf(value, "%f", &sprint.WPM)
		case "DURATION":
			sprint.Duration = value
		case "COMPLETED":
			sprint.Completed = value == "true"
		}
	}
	// fmt.Println("DEBUG: sprints:", sprints)

	if sprint.ID != 0 {
		sprints = append(sprints, sprint)
	}

	return sprints, nil
}

func saveSprint(sprint Sprint) error {
	f, err := os.OpenFile(SPRINTS_FILE, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		return err
	}
	defer f.Close()

	entry := fmt.Sprintf("ID::%d\nTIME::%s\nWORDS::%d\nWPM::%.2f\nDURATION::%s\nCOMPLETED::%v\n\n",
		sprint.ID,
		sprint.Timestamp.Format(time.RFC3339),
		sprint.WordCount,
		sprint.WPM,
		sprint.Duration,
		sprint.Completed)

	if _, err := f.WriteString(entry); err != nil {
		return err
	}

	return nil
}

func getContentPath(id int) string {
	return filepath.Join(CONTENT_DIR, fmt.Sprintf("sprint_%d.txt", id))
}

func saveContent(id int, content string) error {
	return os.WriteFile(getContentPath(id), []byte(content), 0666)
}

func loadContent(id int) (string, error) {
	data, err := os.ReadFile(getContentPath(id))
	if err != nil {
		return "", err
	}
	return string(data), nil
}
