package model

import "time"

type PostShare struct {
	PostID    int
	UserID    int
	CreatedAt time.Time
}
