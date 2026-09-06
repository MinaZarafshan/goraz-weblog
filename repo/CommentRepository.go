package repo

import (
	"database/sql"
	"time"

	"weblog/model"
)

type CommentRepo struct {
	db *sql.DB
}

type CommentWithAuthor struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
}

func NewCommentRepo(db *sql.DB) *CommentRepo {
	return &CommentRepo{
		db: db,
	}
}

func (r *CommentRepo) CreateComment(
	postID int,
	userID int,
	text string,
) (model.Comment, error) {

	var comment model.Comment

	err := r.db.QueryRow(`
		INSERT INTO comments (post_id, user_id, text)
		VALUES ($1, $2, $3)
		RETURNING id, post_id, user_id, text, created_at
	`,
		postID,
		userID,
		text,
	).Scan(
		&comment.ID,
		&comment.PostID,
		&comment.UserID,
		&comment.Text,
		&comment.CreatedAt,
	)

	if err != nil {
		return model.Comment{}, err
	}

	return comment, nil
}

func (r *CommentRepo) GetCommentsByPostID(
	postID int,
) ([]CommentWithAuthor, error) {

	rows, err := r.db.Query(`
		SELECT
			comments.id,
			comments.post_id,
			comments.user_id,
			users.username,
			comments.text,
			comments.created_at
		FROM comments
		JOIN users ON users.id = comments.user_id
		WHERE comments.post_id = $1
		ORDER BY comments.created_at ASC
	`, postID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := []CommentWithAuthor{}

	for rows.Next() {
		var comment CommentWithAuthor

		if err := rows.Scan(
			&comment.ID,
			&comment.PostID,
			&comment.UserID,
			&comment.Username,
			&comment.Text,
			&comment.CreatedAt,
		); err != nil {
			return nil, err
		}

		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}