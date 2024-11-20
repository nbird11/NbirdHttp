package punch

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
)

const testClockFile = ".test_punch_clock"

func setupTestClockFile(content, user string) {
	CLOCK_FILE = testClockFile
	os.WriteFile(fmt.Sprintf("%s_%s", CLOCK_FILE, user), []byte(content), 0666)
}

func teardownTestClockFile(user string) {
	os.Remove(fmt.Sprintf("%s_%s", testClockFile, user))
}

func TestPunchController(t *testing.T) {
	tests := []struct {
		name string
	}{
		{"runs"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			PunchController()
		})
	}
}

func Test_getUserClockFile(t *testing.T) {
	type args struct {
		user string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{"normal", args{"user1"}, ".test_punch_clock_user1"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := getUserClockFile(tt.args.user); got != tt.want {
				t.Errorf("getUserClockFile() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_loadEntries(t *testing.T) {
	type args struct {
		user string
	}
	tests := []struct {
		name    string
		args    args
		want    *ClockData
		wantErr bool
	}{
		{"file not exist", args{"nonexistent_user"}, &ClockData{WorkHours: g_DEFAULT_WORK_HOURS}, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := loadEntries(tt.args.user)
			if (err != nil) != tt.wantErr {
				t.Errorf("loadEntries() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("loadEntries() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_writeToClockFileln(t *testing.T) {
	type args struct {
		user string
		line string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{"write line", args{"user1", "test line"}, false},
	}
	for _, tt := range tests {
		setupTestClockFile("", tt.args.user)
		t.Run(tt.name, func(t *testing.T) {
			if err := writeToClockFileln(tt.args.user, tt.args.line); (err != nil) != tt.wantErr {
				t.Errorf("writeToClockFileln() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
		teardownTestClockFile(tt.args.user)
	}
}

func Test_getUserFromParams(t *testing.T) {
	type args struct {
		r *http.Request
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{"valid user", args{httptest.NewRequest("GET", "/?user=testuser", nil)}, "testuser", false},
		{"missing user", args{httptest.NewRequest("GET", "/", nil)}, "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := getUserFromParams(tt.args.r)
			if (err != nil) != tt.wantErr {
				t.Errorf("getUserFromParams() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("getUserFromParams() = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_punchInHandler(t *testing.T) {
	user := "testuser"
	setupTestClockFile("", user)

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/punch/in?user=%s", user), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(punchInHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	expected := "PUNCH IN AT"
	if !strings.Contains(rr.Body.String(), expected) {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}

	teardownTestClockFile(user)
}

func Test_breakStartHandler(t *testing.T) {
	user := "testuser"
	setupTestClockFile("date\nP_IN::time\n", user)

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/punch/break/start?user=%s", user), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(breakStartHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	expected := "BREAK STARTED AT"
	if !strings.Contains(rr.Body.String(), expected) {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}

	teardownTestClockFile(user)
}

func Test_breakEndHandler(t *testing.T) {
	user := "testuser"
	setupTestClockFile("date\nP_IN::time\nB_IN::time", user)

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/punch/break/end?user=%s", user), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(breakEndHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	expected := "BREAK ENDED AT"
	if !strings.Contains(rr.Body.String(), expected) {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}

	teardownTestClockFile(user)
}

func Test_punchOutHandler(t *testing.T) {
	user := "testuser"
	setupTestClockFile("date\nP_IN::time", user)

	req := httptest.NewRequest("POST", fmt.Sprintf("/api/punch/out?user=%s", user), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(punchOutHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	expected := "PUNCH OUT AT"
	if !strings.Contains(rr.Body.String(), expected) {
		t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), expected)
	}

	teardownTestClockFile(user)
}

func Test_statusHandler(t *testing.T) {
	user := "testuser"
	setupTestClockFile("date\nP_IN::time", user)

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/punch/status?user=%s", user), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(statusHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "application/json"
	if contentType := rr.Header().Get("Content-Type"); contentType != expected {
		t.Errorf("handler returned wrong content type: got %v want %v", contentType, expected)
	}

	teardownTestClockFile(user)
}
