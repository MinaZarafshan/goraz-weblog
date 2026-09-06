package repo

import (
	"database/sql"
)

type PostShareRepo struct {
	db *sql.DB
}
type SharedUser struct {
	Username string
	ID       int
}

func NewPostShareRepo(db *sql.DB) *PostShareRepo {
	return &PostShareRepo{
		db: db,
	}
}

func (r *PostShareRepo) SharePost(userID int, postID int) error {
	_, err := r.db.Exec("INSERT INTO post_shares(user_id, post_id) VALUES($1, $2)", userID, postID)
	if err != nil {
		return err
	}

	return nil
}

func (r *PostShareRepo) GetSharedUsers(postID int) ([]SharedUser, error) {
	rows, err := r.db.Query("SELECT users.id, users.username FROM post_shares JOIN users ON users.id = post_shares.user_id WHERE post_shares.post_id = $1", postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := []SharedUser{}
	for rows.Next() {
		var user SharedUser

		if err := rows.Scan(&user.ID, &user.Username); err != nil {
			return nil, err
		}

		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}
