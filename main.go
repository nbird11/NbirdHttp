package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"NbirdHttp/auth"
	"NbirdHttp/punch"
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

	http.Handle("GET /", http.FileServer(http.Dir("./static")))

	helloController()
	auth.AuthController()
	punch.PunchController()

	log.Fatal(http.ListenAndServe(":80", nil))
}
