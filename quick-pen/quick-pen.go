package quickpen

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

var SPRINTS_FILE = "./quick-pen/.sprints"

type Sprint struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	WordCount int       `json:"wordCount"`
	WPM       float64   `json:"wpm"`
	Duration  string    `json:"duration"`
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

		if err := saveSprint(sprint); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
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
		}
	}

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

	entry := fmt.Sprintf("\nID::%d\nTIME::%s\nWORDS::%d\nWPM::%.2f\nDURATION::%s\n",
		sprint.ID,
		sprint.Timestamp.Format(time.RFC3339),
		sprint.WordCount,
		sprint.WPM,
		sprint.Duration)

	if _, err := f.WriteString(entry); err != nil {
		return err
	}

	return nil
}
