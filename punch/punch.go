package punch

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type LogEntry struct {
	Date   string      `json:"date"`
	PIn    string      `json:"p_in"`
	Breaks [][2]string `json:"breaks"`
	POut   string      `json:"p_out"`
	Time   string      `json:"time"`
}

type ClockData struct {
	Entries    []LogEntry
	FocusEntry *LogEntry
	WorkHours  float64
}

var g_DEFAULT_WORK_HOURS = 8.0

// Visible for testing
var CLOCK_FILE = "./punch/.punch_clock"

func PunchController() {
	http.HandleFunc("GET /punch", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/punch.html")
	})
	http.HandleFunc("POST /api/punch/in", punchInHandler)
	http.HandleFunc("POST /api/punch/break/start", breakStartHandler)
	http.HandleFunc("POST /api/punch/break/end", breakEndHandler)
	http.HandleFunc("POST /api/punch/out", punchOutHandler)
	http.HandleFunc("GET /api/punch/status", statusHandler)
}

func getUserClockFile(user string) string {
	return fmt.Sprintf("%s_%s", CLOCK_FILE, user)
}

// Read clockFile line by line creating and adding entries to internal ClockData struct
func loadEntries(user string) (*ClockData, error) {
	data, err := os.ReadFile(getUserClockFile(user))
	if err != nil {
		if os.IsNotExist(err) {
			return &ClockData{WorkHours: g_DEFAULT_WORK_HOURS}, nil
		}
		log.Printf("[ERROR] %v\n", err)
		return nil, err
	}

	lines := strings.Split(string(data), "\n")
	var entries []LogEntry
	var entry LogEntry
	for _, line := range lines {
		line = strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(line, "P_IN::"):
			entry.PIn = strings.Split(line, "::")[1]
		case strings.HasPrefix(line, "B_IN::"):
			entry.Breaks = append(entry.Breaks, [2]string{strings.Split(line, "::")[1], ""})
		case strings.HasPrefix(line, "B_OUT::"):
			if len(entry.Breaks) > 0 {
				entry.Breaks[len(entry.Breaks)-1][1] = strings.Split(line, "::")[1]
			}
		case strings.HasPrefix(line, "P_OUT::"):
			entry.POut = strings.Split(line, "::")[1]
		case strings.HasPrefix(line, "TIME::"):
			entry.Time = strings.Split(line, "::")[1]
		case line == "" && entry.PIn != "":
			entries = append(entries, entry)
			entry = LogEntry{}
		default:
			entry.Date = line
		}
	}
	if entry.Date != "" {
		entries = append(entries, entry)
	}
	var focusEntry *LogEntry
	if len(entries) > 0 {
		focusEntry = &entries[len(entries)-1]
	}
	return &ClockData{Entries: entries, FocusEntry: focusEntry, WorkHours: g_DEFAULT_WORK_HOURS}, nil
}

func writeToClockFileln(user, line string) error {
	f, err := os.OpenFile(getUserClockFile(user), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		return err
	}
	defer f.Close()

	if _, err = f.WriteString(line + "\n"); err != nil {
		log.Printf("[ERROR] %v\n", err)
		return err
	}

	return nil
}

func getUserFromParams(r *http.Request) (string, error) {
	params, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		return "", err
	}

	user := params.Get("user")
	if user == "" {
		errMissingParamUser := errors.New("parameter `user` is required")
		return "", errMissingParamUser
	}

	return user, nil
}

func punchInHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromParams(r)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cd, err := loadEntries(user)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cd.FocusEntry != nil && cd.FocusEntry.POut == "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Already punched in.")
		return
	}

	now := time.Now()
	entry := LogEntry{
		Date: now.Format("Mon, Jan 02, 2006"),
		PIn:  now.Format("15:04"),
	}
	cd.Entries = append(cd.Entries, entry)
	cd.FocusEntry = &cd.Entries[len(cd.Entries)-1]

	if err := writeToClockFileln(user, fmt.Sprintf("\n%s\n  P_IN::%s", entry.Date, entry.PIn)); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "PUNCH IN AT %s\n", now.Format("03:04pm, Mon, Jan 2, 2006"))
}

func breakStartHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromParams(r)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cd, err := loadEntries(user)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cd.FocusEntry == nil || cd.FocusEntry.POut != "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Not punched in.")
		return
	}

	if cd.FocusEntry.Breaks != nil && cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1] == "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Already on break.")
		return
	}

	now := time.Now()
	cd.FocusEntry.Breaks = append(cd.FocusEntry.Breaks, [2]string{now.Format("15:04"), ""})

	if err := writeToClockFileln(user, fmt.Sprintf("  B_IN::%s", cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][0])); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "BREAK STARTED AT %s\n", now.Format("03:04pm, Mon, Jan 2, 2006"))
}

func breakEndHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromParams(r)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cd, err := loadEntries(user)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cd.FocusEntry == nil || cd.FocusEntry.POut != "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Not punched in.")
		return
	}

	if cd.FocusEntry.Breaks == nil || cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1] != "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Not on break.")
		return
	}

	now := time.Now()
	cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1] = now.Format("15:04")

	if err := writeToClockFileln(user, fmt.Sprintf("  B_OUT::%s", cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1])); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "BREAK ENDED AT %s\n", now.Format("3:04pm, Mon, Jan 2, 2006"))
}

func punchOutHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromParams(r)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cd, err := loadEntries(user)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cd.FocusEntry == nil || cd.FocusEntry.POut != "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Not punched in.")
		return
	}

	// Breaks exist                && Taken at least one break      && Last break has no end time
	if cd.FocusEntry.Breaks != nil && len(cd.FocusEntry.Breaks) > 0 && cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1] == "" {
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintln(w, "Still on break.")
		return
	}

	now := time.Now()
	cd.FocusEntry.POut = now.Format("15:04")

	if err := writeToClockFileln(user, fmt.Sprintf("  P_OUT::%s", cd.FocusEntry.POut)); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get time difference between punch in and punch out minus breaks
	pIn, _ := time.Parse("15:04", cd.FocusEntry.PIn)
	pOut, _ := time.Parse("15:04", cd.FocusEntry.POut)
	var breaks float64
	for _, b := range cd.FocusEntry.Breaks {
		bIn, _ := time.Parse("15:04", b[0])
		bOut, _ := time.Parse("15:04", b[1])
		breaks += bOut.Sub(bIn).Minutes()
	}
	hours := pOut.Sub(pIn).Minutes() - breaks

	if err := writeToClockFileln(user, fmt.Sprintf("  TIME::%.2f", hours/60)); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "PUNCH OUT AT %s\n", now.Format("3:04pm, Mon, Jan 2, 2006"))
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromParams(r)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cd, err := loadEntries(user)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cd.FocusEntry == nil {
		w.WriteHeader(http.StatusNoContent)
		fmt.Fprintln(w, "No punch data available.")
	}

	params, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	status := map[string]string{}
	var hoursToWork float64
	if prm_hours := params.Get("hours"); prm_hours != "" {
		hoursToWork, _ = strconv.ParseFloat(prm_hours, 64)
	} else {
		hoursToWork = cd.WorkHours
	}

	punchState := "punched out"
	if cd.FocusEntry != nil && cd.FocusEntry.POut == "" { // Still working
		punchState = "punched in"

		// Calculate total time worked so far
		loc, err := time.LoadLocation("Local")
		if err != nil {
			log.Printf("[ERROR] %v\n", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		pIn, _ := time.ParseInLocation("Mon, Jan 2, 2006 15:04", fmt.Sprintf("%s %s", cd.FocusEntry.Date, cd.FocusEntry.PIn), loc)
		timeSince := time.Since(pIn)
		var totalWorked time.Duration = timeSince
		for _, b := range cd.FocusEntry.Breaks {
			bIn, _ := time.ParseInLocation("Mon, Jan 2, 2006 15:04", fmt.Sprintf("%s %s", cd.FocusEntry.Date, b[0]), loc)
			bOut, _ := time.ParseInLocation("Mon, Jan 2, 2006 15:04", fmt.Sprintf("%s %s", cd.FocusEntry.Date, b[1]), loc)
			totalWorked -= bOut.Sub(bIn)
		}

		// Calculate remaining time until punch out
		workDuration := time.Duration(hoursToWork) * time.Hour
		timeUntilPOut := workDuration - totalWorked

		// Format the hoursLeft and minutes
		hoursLeft := int(timeUntilPOut.Hours())
		minutesLeft := int(math.Round(timeUntilPOut.Minutes())) % 60

		hoursWorked := int(totalWorked.Hours())
		minutesWorked := int(math.Round(totalWorked.Minutes())) % 60

		status["timeLeft"] = fmt.Sprintf("%dH:%dM", hoursLeft, minutesLeft)
		status["totalTime"] = fmt.Sprintf("%dH:%dM", hoursWorked, minutesWorked)
		status["workHours"] = fmt.Sprintf("%.2f", hoursToWork)
		status["debugTimeNow"] = time.Now().Format("Mon, Jan 2, 2006 15:04")
		status["debugTimePIn"] = pIn.Format("Mon, Jan 2, 2006 15:04")
		status["debugTimeSince"] = timeSince.String()
	} else if cd.FocusEntry != nil && cd.FocusEntry.Time != "" { // Finished working
		status["totalTime"] = fmt.Sprintf("%sH", cd.FocusEntry.Time)
	}
	breakState := "off break"
	if cd.FocusEntry != nil && len(cd.FocusEntry.Breaks) > 0 && cd.FocusEntry.Breaks[len(cd.FocusEntry.Breaks)-1][1] == "" {
		breakState = "on break"
	}
	status["inOut"] = fmt.Sprintf("%s, %s", punchState, breakState)

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}
