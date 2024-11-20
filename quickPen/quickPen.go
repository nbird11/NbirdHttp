package quickpen

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

type Sprint struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	WordCount int       `json:"wordCount"`
	WPM       float64   `json:"wpm"`
	Duration  string    `json:"duration"`
}

var sprints []Sprint
var sprintId int
var mu sync.Mutex

func QuickPenController() {
	http.HandleFunc("POST /api/quickPen/startSprint", startSprint)
	http.HandleFunc("POST /api/quickPen/endSprint", endSprint)
	http.HandleFunc("GET /api/quickPen/sprints", getSprints)
	// http.HandleFunc("GET /api/quickPen/highScores", getHighScores)
	// http.HandleFunc("GET /api/quickPen/history", getHistory)
}

func startSprint(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	sprintId++
	mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"message":  "Sprint started",
		"sprintId": sprintId,
	})
}

func endSprint(w http.ResponseWriter, r *http.Request) {
	var sprintSummary struct {
		ID        int    `json:"id"`
		WordCount int    `json:"wordCount"`
		Duraction string `json:"duration"`
	}

	if err := json.NewDecoder(r.Body).Decode(&sprintSummary); err != nil {
		log.Printf("[ERROR] %s\n", err.Error())
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	duration, _ := time.ParseDuration(sprintSummary.Duraction)
	wpm := float64(sprintSummary.WordCount) / duration.Minutes()

	mu.Lock()
	newSprint := Sprint{
		ID:        sprintSummary.ID,
		Timestamp: time.Now(),
		WordCount: sprintSummary.WordCount,
		WPM:       wpm,
		Duration:  sprintSummary.Duraction,
	}
	sprints = append(sprints, newSprint)
	mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newSprint)
}

func getSprints(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Conten-Type", "application/json")
	json.NewEncoder(w).Encode(sprints)
}
