package main

import (
	"NbirdHttp/auth"
	"NbirdHttp/punch"
	qp "NbirdHttp/quick-pen"
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os/signal"
	"syscall"
)

func helloController() {
	http.HandleFunc("GET /hello", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/hello" {
			// http.NotFound(w, r)
			w.WriteHeader(http.StatusNotFound)
			return
		}

		log.Printf("[INFO] %s request received at %q from %q", r.Method, r.URL.Path, r.RemoteAddr)

		params, err := url.ParseQuery(r.URL.RawQuery)
		if err != nil {
			log.Printf("[ERROR] parsing query: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		name := params.Get("name")
		if name == "" {
			log.Printf("[WARN] url param %q was omitted.", "name")
			name = "World!"
		}

		w.Write([]byte(fmt.Sprintf("Hello %s\n", name)))
	})
}

func main() {
	fmt.Print(
		`

 .+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+. 
(     ____  ____  ____  ____     _   _  ____  ____  ____      )
 )   (  _ \(_  _)(  _ \(  _ \   ( )_( )(_  _)(_  _)(  _ \    ( 
(     ) _ < _)(_  )   / )(_) )   ) _ (   )(    )(   )___/     )
 )   (____/(____)(_)\_)(____/   (_) (_) (__)  (__) (__)      ( 
(                                                             )
 "+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+"+.+" 

Serving...

`)

	server := &http.Server{Addr: ":80"}

	// Setup routes
	http.Handle("GET /", http.FileServer(http.Dir("./static")))

	helloController()
	auth.AuthController()
	punch.PunchController()
	qp.QuickPenController()

	// Create channel for shutdown signals
	shutdown := make(chan struct{})

	// Listen for 'q' in a separate goroutine
	go func() {
		var input string
		for {
			fmt.Scanf("%s", &input)
			if input == "q" || input == "Q" {
				fmt.Println("\nShutting down server...")
				close(shutdown)
				return
			}
		}
	}()

	// Run server in a goroutine
	go func() {
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Printf("HTTP server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	select {
	case <-shutdown:
	case <-ctx.Done():
	}

	// Graceful shutdown
	if err := server.Shutdown(context.Background()); err != nil {
		log.Printf("HTTP server Shutdown error: %v", err)
	}
}
