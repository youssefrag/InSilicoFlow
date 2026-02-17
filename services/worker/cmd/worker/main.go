package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		panic("DATABASE_URL is required")
	}

	// Retry loop in case worker is ready before postgres
	for {
		db, err := sql.Open("postgres", dsn)
		if err == nil {
			if err = db.Ping(); err == nil {
				fmt.Println("Worker connected to Postgres ✅")
				_ = db.Close()
				break
			}
		}
		fmt.Println("Worker waiting for Postgres...")
		time.Sleep(1 * time.Second)
	}

	for {
    time.Sleep(30 * time.Second)
	}
}