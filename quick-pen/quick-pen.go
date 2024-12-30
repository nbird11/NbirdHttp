package quickpen

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type HighScoreCategory string

const SPRINTS_DIR = "./quick-pen/.sprints.d"

const (
	HighScoreWPM      HighScoreCategory = "wpm"
	HighScoreWords    HighScoreCategory = "words"
	HighScoreDuration HighScoreCategory = "duration"
)

type Sprint struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	WordCount int       `json:"wordCount"`
	WPM       float64   `json:"wpm"`
	Duration  string    `json:"duration"`
	Content   string    `json:"content,omitempty"`
	Tags      []string  `json:"tags"`
}

type ProgressRange string

const (
	ProgressToday ProgressRange = "today"
	ProgressWeek  ProgressRange = "week"
	ProgressMonth ProgressRange = "month"
	ProgressYear  ProgressRange = "year"
	ProgressTotal ProgressRange = "total"
)

type ProgressStats struct {
	WordCount      int     `json:"wordCount"`
	MinutesWritten float64 `json:"minutesWritten"`
	AverageWPM     float64 `json:"averageWPM"`
	CurrentStreak  int     `json:"currentStreak"`
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
	// List all supported endpoints
	http.HandleFunc("GET /api/quick-pen/sprints", handleGetSprints)
	http.HandleFunc("POST /api/quick-pen/sprint", handleCreateSprint)
	http.HandleFunc("GET /api/quick-pen/sprint/{id}/content", handleGetSprintContent)
	http.HandleFunc("PATCH /api/quick-pen/sprint/{id}/tags", handleUpdateSprintTags)
	http.HandleFunc("GET /api/quick-pen/best-sprint/{category}", handleGetBestSprint)
	http.HandleFunc("GET /api/quick-pen/best-streak", handleGetBestStreak)
	http.HandleFunc("GET /api/quick-pen/progress/{range}", handleGetProgress)
}

// Returns all sprints for a user
// GET /api/quick-pen/sprints
func handleGetSprints(w http.ResponseWriter, r *http.Request) {
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
}

// Creates a new sprint for a user
// POST /api/quick-pen/sprint
func handleCreateSprint(w http.ResponseWriter, r *http.Request) {
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
}

// Returns the text content of a specific sprint
// GET /api/quick-pen/sprint/{id}/content
func handleGetSprintContent(w http.ResponseWriter, r *http.Request) {
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
}

// Updates the tags for a specific sprint
// PATCH /api/quick-pen/sprint/{id}/tags
func handleUpdateSprintTags(w http.ResponseWriter, r *http.Request) {
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
}

// Returns the sprint with the highest score in the given category
// GET /api/quick-pen/best-sprint/{category}
func handleGetBestSprint(w http.ResponseWriter, r *http.Request) {
	user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if user == "" {
		log.Printf("User not specified in request: %+v\n", r)
		http.Error(w, "User not specified", http.StatusBadRequest)
		return
	}

	category := HighScoreCategory(r.PathValue("category"))
	switch category {
	case HighScoreWPM, HighScoreWords, HighScoreDuration:
		// Valid category
	default:
		http.Error(w, "Invalid category. Must be one of: wpm, words, duration", http.StatusBadRequest)
		return
	}

	sprints, err := loadSprints(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(sprints) == 0 {
		// Return null if no sprints exist
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("null"))
		return
	}

	highScore := sprints[0]
	for _, sprint := range sprints[1:] {
		switch category {
		case HighScoreWPM:
			if sprint.WPM > highScore.WPM {
				highScore = sprint
			}
		case HighScoreWords:
			if sprint.WordCount > highScore.WordCount {
				highScore = sprint
			}
		case HighScoreDuration:
			currentMins := durationToMinutes(sprint.Duration)
			highScoreMins := durationToMinutes(highScore.Duration)
			if currentMins > highScoreMins {
				highScore = sprint
			}
		}
	}

	json.NewEncoder(w).Encode(highScore)
}

// Returns the longest streak of consecutive days with sprints
// GET /api/quick-pen/best-streak
func handleGetBestStreak(w http.ResponseWriter, r *http.Request) {
	user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if user == "" {
		log.Printf("User not specified in request: %+v\n", r)
		http.Error(w, "User not specified", http.StatusBadRequest)
		return
	}

	timezone := r.Header.Get("X-Timezone")
	if timezone == "" {
		timezone = "UTC" // Default to UTC if not specified
	}

	sprints, err := loadSprints(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(sprints) == 0 {
		json.NewEncoder(w).Encode(map[string]int{"length": 0})
		return
	}

	streakLength := calculateLongestStreak(sprints, timezone)
	json.NewEncoder(w).Encode(map[string]int{"length": streakLength})
}

// Returns progress stats for the given time range
// GET /api/quick-pen/progress/{range}
func handleGetProgress(w http.ResponseWriter, r *http.Request) {
	user := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if user == "" {
		log.Printf("User not specified in request: %+v\n", r)
		http.Error(w, "User not specified", http.StatusBadRequest)
		return
	}

	timezone := r.Header.Get("X-Timezone")
	if timezone == "" {
		timezone = "UTC"
	}

	rangeType := ProgressRange(r.PathValue("range"))
	switch rangeType {
	case ProgressToday, ProgressWeek, ProgressMonth, ProgressYear, ProgressTotal:
		// Valid range
	default:
		http.Error(w, "Invalid range. Must be one of: today, week, month, year, total", http.StatusBadRequest)
		return
	}

	sprints, err := loadSprints(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stats := calculateProgressStats(sprints, rangeType, timezone)
	json.NewEncoder(w).Encode(stats)
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

// Converts a duration string ([M...]M:SS) to total minutes
func durationToMinutes(duration string) float64 {
	parts := strings.Split(duration, ":")
	if len(parts) != 2 {
		return 0
	}
	minutes, _ := strconv.Atoi(parts[0])
	seconds, _ := strconv.Atoi(parts[1])
	return float64(minutes) + float64(seconds)/60
}

// Calculates the longest streak of consecutive days with sprints
func calculateLongestStreak(sprints []Sprint, timezone string) int {
	if len(sprints) == 0 {
		return 0
	}

	// Load timezone location
	location, err := time.LoadLocation(timezone)
	if err != nil {
		log.Printf("Invalid timezone %q, falling back to UTC: %v\n", timezone, err)
		location = time.UTC
	}

	// Helper function to get date string in user's timezone
	getDateStr := func(t time.Time) string {
		return t.In(location).Format("2006-01-02")
	}

	// Helper function to check if two dates are consecutive calendar days in user's timezone
	isConsecutive := func(d1, d2 time.Time) bool {
		date1 := getDateStr(d1)
		date2 := getDateStr(d2)
		day, _ := strconv.Atoi(date1[8:])
		return date2 > date1 && date2 <= date1[:8]+fmt.Sprintf("%02d", day+1)
	}

	currentLength := 1
	longestLength := 1
	lastDate := getDateStr(sprints[0].Timestamp)
	lastSprint := sprints[0]

	// Iterate through sprints, which are already ordered by date
	for _, sprint := range sprints[1:] {
		currentDate := getDateStr(sprint.Timestamp)

		// Skip if same day
		if currentDate == lastDate {
			continue
		}

		// Check if dates are consecutive
		if isConsecutive(lastSprint.Timestamp, sprint.Timestamp) {
			currentLength++
			if currentLength > longestLength {
				longestLength = currentLength
			}
		} else {
			currentLength = 1
		}

		lastDate = currentDate
		lastSprint = sprint
	}

	return longestLength
}

// Calculates aggregate stats for sprints within the given time range
func calculateProgressStats(sprints []Sprint, rangeType ProgressRange, timezone string) ProgressStats {
	if len(sprints) == 0 {
		return ProgressStats{}
	}

	// Load timezone location
	location, err := time.LoadLocation(timezone)
	if err != nil {
		log.Printf("Invalid timezone %q, falling back to UTC: %v\n", timezone, err)
		location = time.UTC
	}

	// Get range start time based on range type
	now := time.Now().In(location)
	var rangeStart time.Time
	switch rangeType {
	case ProgressToday:
		rangeStart = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location)
	case ProgressWeek:
		// Get start of current week (Sunday)
		weekday := now.Weekday()
		rangeStart = time.Date(now.Year(), now.Month(), now.Day()-int(weekday), 0, 0, 0, 0, location)
	case ProgressMonth:
		// Get start of current month
		rangeStart = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, location)
	case ProgressYear:
		// Get start of current year
		rangeStart = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, location)
	case ProgressTotal:
		// No filtering needed
	}

	// Filter and aggregate stats
	var totalWords int
	var totalMinutes float64
	var totalWPM float64
	var sprintCount int

	for _, sprint := range sprints {
		// Skip sprints outside range (except for total)
		if rangeType != ProgressTotal {
			sprintTime := sprint.Timestamp.In(location)
			if sprintTime.Before(rangeStart) {
				continue
			}
		}

		totalWords += sprint.WordCount
		totalMinutes += durationToMinutes(sprint.Duration)
		totalWPM += sprint.WPM
		sprintCount++
	}

	// Calculate averages
	var avgWPM float64
	if sprintCount > 0 {
		avgWPM = totalWPM / float64(sprintCount)
	}

	// Calculate current streak
	currentStreak := calculateCurrentStreak(sprints, timezone)

	return ProgressStats{
		WordCount:      totalWords,
		MinutesWritten: totalMinutes,
		AverageWPM:     avgWPM,
		CurrentStreak:  currentStreak,
	}
}

// Calculates the current (ongoing) streak of consecutive days with sprints
func calculateCurrentStreak(sprints []Sprint, timezone string) int {
	if len(sprints) == 0 {
		return 0
	}

	location, err := time.LoadLocation(timezone)
	if err != nil {
		log.Printf("Invalid timezone %q, falling back to UTC: %v\n", timezone, err)
		location = time.UTC
	}

	now := time.Now().In(location)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location)
	yesterday := today.AddDate(0, 0, -1)

	// Get most recent sprint's date
	lastSprintTime := sprints[len(sprints)-1].Timestamp.In(location)
	lastSprintDate := time.Date(
		lastSprintTime.Year(),
		lastSprintTime.Month(),
		lastSprintTime.Day(),
		0, 0, 0, 0,
		location,
	)

	// If last sprint isn't from today or yesterday, no current streak
	if lastSprintDate.Before(yesterday) {
		return 0
	}

	// Count consecutive days backwards from the last sprint
	streak := 1
	lastDate := lastSprintDate
	for i := len(sprints) - 2; i >= 0; i-- {
		sprintTime := sprints[i].Timestamp.In(location)
		sprintDate := time.Date(
			sprintTime.Year(),
			sprintTime.Month(),
			sprintTime.Day(),
			0, 0, 0, 0,
			location,
		)

		// Skip if same day
		if sprintDate.Equal(lastDate) {
			continue
		}

		// Check if dates are consecutive
		expectedPrevDate := lastDate.AddDate(0, 0, -1)
		if !sprintDate.Equal(expectedPrevDate) {
			break
		}

		streak++
		lastDate = sprintDate
	}

	return streak
}
