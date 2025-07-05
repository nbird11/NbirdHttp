# NbirdHttp

A personal web server written in Go, designed to run on a Raspberry Pi. This monorepo contains the backend services and a collection of frontend web applications. See the server running static content live at [nbird.dev](https://nbird.dev/).

## Overview

NbirdHttp is a multi-purpose server that hosts a variety of personal projects and utilities. The backend is built with Go and provides several APIs, while the frontend consists of a collection of distinct web applications written in HTML, CSS, and vanilla JavaScript.

## Features

### Backend Services (Go)

The Go backend provides the core logic for several of the web applications.

- **Authentication (`/api/auth`)**: A simple, hand-rolled user authentication system that handles user registration and login. It's used by the Punch Clock\* and QuickPen applications.
- **Punch Clock (`/api/punch`)**: A time-tracking application that allows users to punch in, punch out, and record breaks. Work data is stored in a custom plain-text format.
- **QuickPen (`/api/quick-pen`)**: A writing sprint application prototype designed to help users track their writing sessions. It records metrics like word count, words per minute (WPM), and writing streaks. It also stores the content of each sprint.

### Frontend Applications

All frontend applications are served from the `/static` directory.

- **Homepage (`/`)**: A personal landing page.
- **Punch Clock (`/punch` or `/punch.html`)**: The user interface for the Punch Clock application.  
    ![Static Badge](https://img.shields.io/badge/Under_Construction-goldenrod)
- **QuickPen (`/quick-pen/`)**: A feature-rich interface for the writing sprint application, complete with a timer, progress dashboards, high scores, and sprint history.
  > [!TIP]
  > This is just a prototype. See [QuickPen Github](https://github.com/nbird11/quickpen), [QuickPen Homepage](https://quickpen.web.app/) for a beta implementation of the web app in React (TS) and Firebase.
- **Resume (`/resume/`)**: A dynamic online resume.
- **Back Alley Score Sheet (`/back-alley/`)**: A web-based score sheet for the card game "Back Alley".
- **Dining Philosophers (`/dining-philosophers/`)**: A visualization of the classic Dining Philosophers computer science problem.
- **Mexican Train Dominoes (`/mex-train-dominoes/`)**: A canvas-based implementation of the game Mexican Train Dominoes.  
    ![Static Badge](https://img.shields.io/badge/Under_Construction-goldenrod)
- **Seating Chart (`/seating/`)**: An application for creating and managing seating charts.  
    ![Static Badge](https://img.shields.io/badge/Under_Construction-goldenrod)

## Codebase & Design

This repository is built with vanilla HTML, CSS, and JavaScript on the frontend, avoiding frontend frameworks to maintain simplicity and minimize dependencies. The Go backend is similarly written using only the standard library.

### Notable Features

- **Graceful Shutdown**: The Go server is designed to shut down gracefully, listening for system signals (`SIGINT`, `SIGTERM`) or a manual terminal command (`'q'`) to ensure existing connections are properly closed.
- **Database-Free**: All backend services use a custom, file-based persistence strategy instead of a traditional database. This makes the server lightweight, portable, and free of external dependencies, which is ideal for its target Raspberry Pi environment.
- **Unit Tests**: The backend includes unit tests for the `auth` and `punch` modules to ensure reliability and maintainability.

- **Custom Reusable Components**: The frontend is structured to be modular and DRY (Don't Repeat Yourself) through the use of shared scripts and styles.
  - **Shared Styles (`/static/styles/`)**: Global styles, along with specific component styles for cards, headers, footers, and modals, are managed in this directory to ensure a consistent look and feel across all applications.
  - **Dynamic Headers & Footers**: The header and footer for each page are loaded dynamically using the JavaScript files in `/static/scripts/`. This allows for easy updates across the entire site by modifying only a single file.
  - **Profile Data**: The homepage and resume pages load personal data from a central `profile.json` file, making it easy to update information in one place.

## Project Structure

The repository is organized as a monorepo with the following structure:

```plaintext
/
├── auth/             # Go package for authentication
├── punch/            # Go package for the punch clock application
├── quick-pen/        # Go package for the QuickPen writing application
├── static/           # All frontend assets and applications
│   ├── assets/
│   ├── back-alley/
│   ├── dining-philosophers/
│   ├── mex-train-dominoes/
│   ├── punch.html
│   ├── quick-pen/
│   ├── resume/
│   ├── seating/
│   └── ...
├── go.mod            # Go module definition
├── main.go           # Main entry point for the Go server
└── README.md
```

## Getting Started

To run the server, you will need to have Go installed.

1. Clone the repository:

   ```bash
   git clone https://github.com/nbird11/NbirdHttp.git
   cd NbirdHttp
   ```

2. Run the server:

   ```bash
   go run main.go
   ```

The server will start on port 80. You can access the applications by navigating to `http://localhost` in your web browser.
