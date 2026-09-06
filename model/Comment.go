package model

import "time"

type Comment struct {
	ID        int
	PostID    int
	UserID    int
	Text      string
	CreatedAt time.Time
}
