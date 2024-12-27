package quickpen

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var SPRINTS_DIR = "./quick-pen/.sprints.d"

type Sprint struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	WordCount int       `json:"wordCount"`
	WPM       float64   `json:"wpm"`
	Duration  string    `json:"duration"`
	Content   string    `json:"content,omitempty"`
	Tags      []string  `json:"tags"`
}

func getUserSprintsPath(user string) string {
	return filepath.Join(SPRINTS_DIR, fmt.Sprintf(".sprints_%s", user))
}

func getUserContentPath(user string) string {
	return filepath.Join(SPRINTS_DIR, fmt.Sprintf(".content_%s.d", user))
}

func init() {
	// Ensure sprints directory exists
	if err := os.MkdirAll(SPRINTS_DIR, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create sprints directory: %v", err))
	}
}

func ensureUserDir(user string) error {
	// Create user's content directory if it doesn't exist
	if err := os.MkdirAll(getUserContentPath(user), 0755); err != nil {
		return fmt.Errorf("failed to create user content directory: %v", err)
	}
	return nil
}

func QuickPenController() {
	http.HandleFunc("GET /api/quick-pen/sprints", func(w http.ResponseWriter, r *http.Request) {
		user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if user == "" {
			log.Printf("User not specified in request: %+v\n", r)
			http.Error(w, "User not specified", http.StatusBadRequest)
			return
		}

		sprints, err := loadSprints(user)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(sprints)
	})

	http.HandleFunc("POST /api/quick-pen/sprint", func(w http.ResponseWriter, r *http.Request) {
		user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if user == "" {
			log.Printf("User not specified in request: %+v\n", r)
			http.Error(w, "User not specified", http.StatusBadRequest)
			return
		}

		var sprint Sprint
		if err := json.NewDecoder(r.Body).Decode(&sprint); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := ensureUserDir(user); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Extract content before saving sprint metadata
		content := sprint.Content
		sprint.Content = "" // Clear content from metadata

		if err := saveSprint(user, sprint); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Save content to separate file
		if err := saveContent(user, sprint.ID, content); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	})

	http.HandleFunc("GET /api/quick-pen/sprint/{id}/content", func(w http.ResponseWriter, r *http.Request) {
		user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if user == "" {
			log.Printf("User not specified in request: %+v\n", r)
			http.Error(w, "User not specified", http.StatusBadRequest)
			return
		}

		idStr := r.PathValue("id")
		var id int
		if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
			http.Error(w, "Invalid sprint ID", http.StatusBadRequest)
			return
		}

		content, err := loadContent(user, id)
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

	http.HandleFunc("PATCH /api/quick-pen/sprint/{id}/tags", func(w http.ResponseWriter, r *http.Request) {
		user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if user == "" {
			log.Printf("User not specified in request: %+v\n", r)
			http.Error(w, "User not specified", http.StatusBadRequest)
			return
		}

		idStr := r.PathValue("id")
		var id int
		if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
			http.Error(w, "Invalid sprint ID", http.StatusBadRequest)
			return
		}

		var tags []string
		if err := json.NewDecoder(r.Body).Decode(&tags); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := updateSprintTags(user, id, tags); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}

func splitEscapedCommas(s string) []string {
	var result []string
	var current strings.Builder
	escaped := false

	for i := 0; i < len(s); i++ {
		if escaped {
			current.WriteByte(s[i])
			escaped = false
			continue
		}
		if s[i] == '\\' {
			escaped = true
			continue
		}
		if s[i] == ',' {
			result = append(result, current.String())
			current.Reset()
			continue
		}
		current.WriteByte(s[i])
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func loadSprints(user string) ([]Sprint, error) {
	sprintsFile := getUserSprintsPath(user)
	data, err := os.ReadFile(sprintsFile)
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
		if line == "" {
			if sprint.ID != 0 {
				sprints = append(sprints, sprint)
				sprint = Sprint{}
			}
			continue
		}

		parts := strings.Split(line, "::")
		if len(parts) != 2 {
			continue
		}

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
		case "TAGS":
			if value != "" {
				// Use custom split function that respects escaped commas
				sprint.Tags = splitEscapedCommas(value)
			} else {
				sprint.Tags = []string{}
			}
		}
	}

	if sprint.ID != 0 {
		sprints = append(sprints, sprint)
	}

	return sprints, nil
}

func saveSprint(user string, sprint Sprint) error {
	sprintsFile := getUserSprintsPath(user)
	f, err := os.OpenFile(sprintsFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		return err
	}
	defer f.Close()

	// Escape commas in tags
	escapedTags := make([]string, len(sprint.Tags))
	for i, tag := range sprint.Tags {
		escapedTags[i] = strings.ReplaceAll(tag, ",", "\\,")
	}

	entry := fmt.Sprintf("ID::%d\nTIME::%s\nWORDS::%d\nWPM::%.2f\nDURATION::%s\nTAGS::%s\n\n",
		sprint.ID,
		sprint.Timestamp.Format(time.RFC3339),
		sprint.WordCount,
		sprint.WPM,
		sprint.Duration,
		strings.Join(escapedTags, ","))

	if _, err := f.WriteString(entry); err != nil {
		return err
	}

	return nil
}

func getContentPath(user string, id int) string {
	return filepath.Join(getUserContentPath(user), fmt.Sprintf("sprint_%d.txt", id))
}

func saveContent(user string, id int, content string) error {
	return os.WriteFile(getContentPath(user, id), []byte(content), 0666)
}

func loadContent(user string, id int) (string, error) {
	data, err := os.ReadFile(getContentPath(user, id))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func updateSprintTags(user string, sprintId int, tags []string) error {
	sprints, err := loadSprints(user)
	if err != nil {
		return err
	}

	// Find and update the sprint
	sprintFound := false
	for i, sprint := range sprints {
		if sprint.ID == sprintId {
			sprints[i].Tags = tags
			sprintFound = true
			break
		}
	}

	if !sprintFound {
		return fmt.Errorf("sprint not found")
	}

	// Rewrite the entire sprints file
	sprintsFile := getUserSprintsPath(user)
	if err := os.Truncate(sprintsFile, 0); err != nil {
		return err
	}

	for _, sprint := range sprints {
		if err := saveSprint(user, sprint); err != nil {
			return err
		}
	}

	return nil
}
