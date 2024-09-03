package auth

import (
	"crypto/sha256"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// Visible for testing
var AUTH_FILE = "./auth/.auth"

var errUsernameTaken = errors.New("user already exists")
var errUserNotFound = errors.New("user not found")

func AuthController() {
	http.HandleFunc("POST /api/auth/register", registerHandler)
	http.HandleFunc("POST /api/auth/login", loginHandler)
}

// Returns the line [uname, pswd] in auth file where uname matches
func findUser(uname string) ([]string, error) {
	file, err := os.OpenFile(AUTH_FILE, os.O_RDONLY|os.O_CREATE, 0666)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("[ERROR] %v\n", err)
			return nil, err
		}

		if record[0] == uname {
			return record, nil
		}
	}
	return nil, errUserNotFound
}

// Simple password hashing using SHA-256
func hashPassword(pswd string) string {
	hash := sha256.Sum256([]byte(pswd))
	return fmt.Sprintf("%x", hash)
}

func createUser(uname, pswd string) error {
	file, err := os.OpenFile(AUTH_FILE, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		return err
	}
	defer file.Close()

	if _, err := findUser(uname); err == nil {
		return errUsernameTaken
	}

	writer := csv.NewWriter(file)
	defer writer.Flush()
	return writer.Write([]string{uname, hashPassword(pswd)})
}

func authenticate(uname, pswd string) (bool, error) {
	user, err := findUser(uname)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		return false, err
	}
	return user[1] == hashPassword(pswd), nil
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	uname := r.FormValue("username")
	pswd := r.FormValue("password")

	if err := createUser(uname, pswd); err != nil {
		log.Printf("[ERROR] %v\n", err)
		if err == errUsernameTaken {
			http.Error(w, fmt.Sprintf("Username `%s` is already taken. Please try a different one.", uname), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "User `%s` registered successfully.\n", uname)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	uname := r.FormValue("username")
	pswd := r.FormValue("password")

	authenticated, err := authenticate(uname, pswd)
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		if err == errUserNotFound {
			http.Error(w, fmt.Sprintf("User `%s` has not been created.", uname), http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if !authenticated {
		http.Error(w, fmt.Sprintf("Incorrect password for `%s`.", uname), http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Login successful.")
}
