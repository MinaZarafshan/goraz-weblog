package model

import "time"

type Post struct {
	Title     string
	ID        int
	Content   string
	ImagePath string
	AuthorID  int
	Privacy   string
	CreatedAt time.Time
}
