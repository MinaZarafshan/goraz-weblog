package repo

import (
	"database/sql"
	"weblog/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}
func (r *UserRepository) CreateUser(u model.User) (model.User, error) {
	row := r.db.QueryRow("INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING id, username, password_hash, created_at", u.Username, u.PasswordHash)
	user := model.User{}
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.CreatedAt,
	)
	if err != nil {
		return model.User{}, err
	}
	return user, nil
}

func (r *UserRepository) GetUserByID(UserID int) (model.User, error) {
	row := r.db.QueryRow("SELECT id, username, password_hash, created_at FROM users WHERE id = $1", UserID)
	user := model.User{}
	err := row.Scan(
		&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt,
	)
	if err != nil {
		return model.User{}, err
	}
	return user, nil
}

func (r *UserRepository) GetUserByUsername(Username string) (model.User, error) {
	row := r.db.QueryRow("SELECT id, username, password_hash, created_at From users WHERE username = $1", Username)
	user := model.User{}
	err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return model.User{}, err
	}
	return user, nil
}
