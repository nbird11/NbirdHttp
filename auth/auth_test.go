package auth

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

const testAuthFile = ".test_auth"

func setupTestAuthFile(content string) {
	AUTH_FILE = testAuthFile
	os.WriteFile(testAuthFile, []byte(content), 0666)
}

func teardownTestAuthFile() {
	os.Remove(testAuthFile)
}

func TestFindUser(t *testing.T) {
	setupTestAuthFile("user1,pass1\nuser2,pass2\n")
	defer teardownTestAuthFile()

	tests := []struct {
		uname    string
		expected []string
		err      error
	}{
		{"user1", []string{"user1", "pass1"}, nil},
		{"user2", []string{"user2", "pass2"}, nil},
		{"user3", nil, errUserNotFound},
	}

	for _, test := range tests {
		result, err := findUser(test.uname)
		if err != test.err {
			t.Errorf("expected error %v, got %v", test.err, err)
		}
		if !equal(result, test.expected) {
			t.Errorf("expected %v, got %v", test.expected, result)
		}
	}
}

func TestHashPassword(t *testing.T) {
	pswd := "password"
	expected := fmt.Sprintf("%x", sha256.Sum256([]byte(pswd)))
	result := hashPassword(pswd)
	if result != expected {
		t.Errorf("expected %s, got %s", expected, result)
	}
}

func TestCreateUser(t *testing.T) {
	setupTestAuthFile("")
	defer teardownTestAuthFile()

	err := createUser("user1", "pass1")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	err = createUser("user1", "pass2")
	if err != errUsernameTaken {
		t.Errorf("expected error %v, got %v", errUsernameTaken, err)
	}
}

func TestAuthenticate(t *testing.T) {
	setupTestAuthFile(fmt.Sprintf("user1,%x\n", sha256.Sum256([]byte("pass1"))))
	defer teardownTestAuthFile()

	tests := []struct {
		uname        string
		pswd         string
		expectedAuth bool
		err          error
	}{
		{"user1", "pass1", true, nil},
		{"user1", "wrongpass", false, nil},
		{"user2", "pass2", false, errUserNotFound},
	}

	for i, test := range tests {
		auth, err := authenticate(test.uname, test.pswd)
		if err != test.err {
			t.Errorf("CASE %d: expected error %v, got %v", i+1, test.err, err)
		}
		if auth != test.expectedAuth {
			t.Errorf("CASE %d: expected %v, got %v", i+1, test.expectedAuth, auth)
		}
	}
}

func TestRegisterHandler(t *testing.T) {
	setupTestAuthFile("")
	defer teardownTestAuthFile()

	tests := []struct {
		uname        string
		pswd         string
		expectedCode int
		expectedBody string
	}{
		{"user1", "pass1", http.StatusCreated, "User `user1` registered successfully.\n"},
		{"user1", "pass2", http.StatusBadRequest, "Username `user1` is already taken. Please try a different one.\n"},
	}

	for _, test := range tests {
		req, err := http.NewRequest("POST", "/api/punch/auth/register", nil)
		if err != nil {
			t.Fatal(err)
		}
		q := req.URL.Query()
		q.Add("username", test.uname)
		q.Add("password", test.pswd)
		req.URL.RawQuery = q.Encode()

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(registerHandler)
		handler.ServeHTTP(rr, req)

		if status := rr.Code; status != test.expectedCode {
			t.Errorf("handler returned wrong status code: got %v want %v", status, test.expectedCode)
		}

		if rr.Body.String() != test.expectedBody {
			t.Errorf("handler returned unexpected body: got %v want %v", rr.Body.String(), test.expectedBody)
		}
	}
}

func TestLoginHandler(t *testing.T) {
	setupTestAuthFile(fmt.Sprintf("user1,%x\n", sha256.Sum256([]byte("pass1"))))
	defer teardownTestAuthFile()

	tests := []struct {
		uname        string
		pswd         string
		expectedCode int
		expectedBody string
	}{
		{"user1", "pass1", http.StatusOK, "Login successful.\n"},
		{"user1", "wrongpass", http.StatusUnauthorized, "Incorrect password for `user1`.\n"},
		{"user2", "pass2", http.StatusUnauthorized, "User `user2` has not been created.\n"},
	}

	for i, test := range tests {
		req, err := http.NewRequest("POST", "/api/punch/auth/login", nil)
		if err != nil {
			t.Fatal(err)
		}
		q := req.URL.Query()
		q.Add("username", test.uname)
		q.Add("password", test.pswd)
		req.URL.RawQuery = q.Encode()

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(loginHandler)
		handler.ServeHTTP(rr, req)

		if status := rr.Code; status != test.expectedCode {
			t.Errorf("CASE %d: handler returned wrong status code: got %q want %q", i+1, status, test.expectedCode)
		}

		if rr.Body.String() != test.expectedBody {
			t.Errorf("CASE %d: handler returned unexpected body: got %q want %q", i+1, rr.Body.String(), test.expectedBody)
		}
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
